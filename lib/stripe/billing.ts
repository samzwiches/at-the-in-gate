import "server-only";
import type Stripe from "stripe";
import type { Database } from "@/lib/database.types";
import {
  ensureInitialMembershipPlan,
  getBillingCustomerForProfile,
  getMembershipForProfile,
  getMembershipPlanByStripePriceId,
} from "@/lib/membership/membership";
import { getAdminClient } from "@/lib/supabase/admin";
import { getMembershipPriceId, getStripeClient } from "@/lib/stripe/server";

type BillingCustomer = Database["public"]["Tables"]["billing_customers"]["Row"];
type SyncSubscriptionArgs = Database["public"]["Functions"]["sync_membership_subscription"]["Args"];

type NullableSyncSubscriptionArgs = Omit<
  SyncSubscriptionArgs,
  "p_canceled_at" | "p_current_period_end" | "p_current_period_start" | "p_ended_at" | "p_last_invoice_status" | "p_trial_end"
> & {
  p_canceled_at: string | null;
  p_current_period_end: string | null;
  p_current_period_start: string | null;
  p_ended_at: string | null;
  p_last_invoice_status: string | null;
  p_trial_end: string | null;
};

function toIsoTimestamp(unixTimestamp: number | null | undefined) {
  return typeof unixTimestamp === "number" ? new Date(unixTimestamp * 1000).toISOString() : null;
}

function toStripeId(value: string | { id: string } | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function stripeProfileId(metadata: Stripe.Metadata) {
  const profileId = metadata.supabase_profile_id;
  return profileId && isUuid(profileId) ? profileId : null;
}

function throwBillingError(context: string, error: { message: string }): never {
  throw new Error(`Could not ${context}: ${error.message}`);
}

export async function getOrCreateStripeCustomer(profileId: string, email: string | null): Promise<BillingCustomer> {
  const existing = await getBillingCustomerForProfile(profileId);

  if (existing) {
    return existing;
  }

  const stripeCustomer = await getStripeClient().customers.create({
    ...(email ? { email } : {}),
    metadata: { supabase_profile_id: profileId },
  });
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("billing_customers")
    .insert({
      profile_id: profileId,
      stripe_customer_id: stripeCustomer.id,
    })
    .select("id, profile_id, stripe_customer_id, created_at, updated_at")
    .single();

  if (!error && data) {
    return data;
  }

  if (!error) {
    throw new Error("Stripe customer creation returned no database record.");
  }

  // A second Checkout request may race the first. In that case, keep the
  // already-mapped customer and never accept a browser-provided customer ID.
  if (error.code === "23505") {
    const racedCustomer = await getBillingCustomerForProfile(profileId);

    if (racedCustomer) {
      return racedCustomer;
    }
  }

  throwBillingError("store the Stripe customer", error);
}

export async function createMembershipCheckoutSession(profileId: string, email: string | null, appUrl: string) {
  const membership = await getMembershipForProfile(profileId);

  if (membership.isEntitled) {
    return { url: null, alreadyEntitled: true };
  }

  const priceId = getMembershipPriceId();
  await ensureInitialMembershipPlan(priceId);
  const customer = await getOrCreateStripeCustomer(profileId, email);
  const checkout = await getStripeClient().checkout.sessions.create({
    mode: "subscription",
    customer: customer.stripe_customer_id,
    client_reference_id: profileId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { supabase_profile_id: profileId },
    subscription_data: {
      metadata: { supabase_profile_id: profileId },
    },
    success_url: `${appUrl}/membership?checkout=success`,
    cancel_url: `${appUrl}/membership?checkout=cancelled`,
  });

  if (!checkout.url) {
    throw new Error("Stripe did not return a Checkout URL.");
  }

  return { url: checkout.url, alreadyEntitled: false };
}

export async function createBillingPortalSession(profileId: string, appUrl: string) {
  const customer = await getBillingCustomerForProfile(profileId);

  if (!customer) {
    return null;
  }

  return getStripeClient().billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${appUrl}/account`,
  });
}

async function resolveBillingCustomerFromStripe(
  stripeCustomerId: string,
  subscriptionMetadata: Stripe.Metadata
): Promise<BillingCustomer | null> {
  const admin = getAdminClient();
  const { data: mappedCustomer, error: mappedCustomerError } = await admin
    .from("billing_customers")
    .select("id, profile_id, stripe_customer_id, created_at, updated_at")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (mappedCustomerError) {
    throwBillingError("look up the billing customer", mappedCustomerError);
  }

  if (mappedCustomer) {
    return mappedCustomer;
  }

  const stripeCustomer = await getStripeClient().customers.retrieve(stripeCustomerId);

  if (stripeCustomer.deleted) {
    return null;
  }

  const profileId = stripeProfileId(subscriptionMetadata) ?? stripeProfileId(stripeCustomer.metadata);

  if (!profileId) {
    return null;
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) {
    throwBillingError("validate the profile attached to Stripe metadata", profileError);
  }

  if (!profile) {
    return null;
  }

  const profileCustomer = await getBillingCustomerForProfile(profile.id);

  if (profileCustomer) {
    return profileCustomer.stripe_customer_id === stripeCustomerId ? profileCustomer : null;
  }

  const { data: insertedCustomer, error: insertError } = await admin
    .from("billing_customers")
    .insert({
      profile_id: profile.id,
      stripe_customer_id: stripeCustomerId,
    })
    .select("id, profile_id, stripe_customer_id, created_at, updated_at")
    .single();

  if (!insertError && insertedCustomer) {
    return insertedCustomer;
  }

  if (!insertError) {
    throw new Error("Validated Stripe customer creation returned no database record.");
  }

  if (insertError.code === "23505") {
    return getBillingCustomerForProfile(profile.id);
  }

  throwBillingError("store the validated Stripe customer", insertError);
}

export async function syncMembershipSubscriptionFromStripe(
  subscription: Stripe.Subscription,
  eventCreatedAt: Date,
  invoiceStatus: string | null = null
) {
  const stripeCustomerId = toStripeId(subscription.customer);

  if (!stripeCustomerId) {
    return { outcome: "ignored" as const, reason: "subscription_has_no_customer" };
  }

  const membershipPrice = subscription.items.data.find((item) => item.price?.id === getMembershipPriceId());
  const stripePriceId = membershipPrice?.price.id;

  if (!membershipPrice || !stripePriceId) {
    return { outcome: "ignored" as const, reason: "subscription_has_no_membership_price" };
  }

  const plan = await getMembershipPlanByStripePriceId(stripePriceId);

  if (!plan) {
    return { outcome: "ignored" as const, reason: "price_is_not_an_active_membership_plan" };
  }

  const billingCustomer = await resolveBillingCustomerFromStripe(stripeCustomerId, subscription.metadata);

  if (!billingCustomer) {
    return { outcome: "ignored" as const, reason: "billing_customer_could_not_be_validated" };
  }

  const syncArgs: NullableSyncSubscriptionArgs = {
    p_billing_customer_id: billingCustomer.id,
    p_membership_plan_id: plan.id,
    p_stripe_subscription_id: subscription.id,
    p_stripe_price_id: stripePriceId,
    p_status: subscription.status,
    p_current_period_start: toIsoTimestamp(membershipPrice.current_period_start),
    p_current_period_end: toIsoTimestamp(membershipPrice.current_period_end),
    p_trial_end: toIsoTimestamp(subscription.trial_end),
    p_cancel_at_period_end: subscription.cancel_at_period_end,
    p_canceled_at: toIsoTimestamp(subscription.canceled_at),
    p_ended_at: toIsoTimestamp(subscription.ended_at),
    p_last_invoice_status: invoiceStatus,
    p_last_stripe_event_created_at: eventCreatedAt.toISOString(),
  };
  const { data: didSync, error } = await getAdminClient().rpc(
    "sync_membership_subscription",
    syncArgs as SyncSubscriptionArgs
  );

  if (error) {
    throwBillingError("synchronize the membership subscription", error);
  }

  return { outcome: didSync ? ("synced" as const) : ("stale" as const) };
}

export function getStripeObjectId(value: string | { id: string } | null | undefined) {
  return toStripeId(value);
}
