import "server-only";
import type { Database } from "@/lib/database.types";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  hasMembershipAccess,
  hasMembershipEntitlement,
  type EntitlementCandidate,
} from "@/lib/membership/entitlement";

type BillingCustomer = Database["public"]["Tables"]["billing_customers"]["Row"];
type MembershipPlan = Database["public"]["Tables"]["membership_plans"]["Row"];
type MembershipSubscription = Database["public"]["Tables"]["membership_subscriptions"]["Row"];

export type MembershipState = {
  hasStripeCustomer: boolean;
  isAdmin: boolean;
  isEntitled: boolean;
  billingCustomer: BillingCustomer | null;
  subscription: MembershipSubscription | null;
  plan: MembershipPlan | null;
};

function emptyMembershipState(isAdmin = false): MembershipState {
  return {
    hasStripeCustomer: false,
    isAdmin,
    isEntitled: hasMembershipAccess({ isAdmin, subscription: null }),
    billingCustomer: null,
    subscription: null,
    plan: null,
  };
}

function throwMembershipQueryError(context: string, error: { message: string }) {
  throw new Error(`Could not ${context}: ${error.message}`);
}

export async function getBillingCustomerForProfile(profileId: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("billing_customers")
    .select("id, profile_id, stripe_customer_id, created_at, updated_at")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    throwMembershipQueryError("look up the Stripe customer", error);
  }

  return data;
}

export async function getMembershipPlanByStripePriceId(stripePriceId: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("membership_plans")
    .select("id, slug, name, description, stripe_price_id, past_due_grace_days, is_active, created_at, updated_at")
    .eq("stripe_price_id", stripePriceId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throwMembershipQueryError("look up the membership plan", error);
  }

  return data;
}

export async function ensureInitialMembershipPlan(stripePriceId: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("membership_plans")
    .upsert(
      {
        slug: "member",
        name: "At The In Gate Membership",
        stripe_price_id: stripePriceId,
        is_active: true,
      },
      { onConflict: "slug" }
    )
    .select("id, slug, name, description, stripe_price_id, past_due_grace_days, is_active, created_at, updated_at")
    .single();

  if (error) {
    throwMembershipQueryError("prepare the membership plan", error);
  }

  return data;
}

export async function getMembershipForProfile(profileId: string): Promise<MembershipState> {
  const admin = getAdminClient();
  const { data: adminRole, error: adminRoleError } = await admin
    .from("community_roles")
    .select("profile_id")
    .eq("profile_id", profileId)
    .eq("role", "admin")
    .maybeSingle();

  if (adminRoleError) {
    throwMembershipQueryError("look up the administrator role", adminRoleError);
  }

  const isAdmin = Boolean(adminRole);
  const billingCustomer = await getBillingCustomerForProfile(profileId);

  if (!billingCustomer) {
    return emptyMembershipState(isAdmin);
  }

  const { data: subscriptions, error: subscriptionsError } = await admin
    .from("membership_subscriptions")
    .select(
      "id, billing_customer_id, membership_plan_id, stripe_subscription_id, stripe_price_id, status, current_period_start, current_period_end, trial_end, cancel_at_period_end, canceled_at, ended_at, last_invoice_status, last_stripe_event_created_at, created_at, updated_at"
    )
    .eq("billing_customer_id", billingCustomer.id)
    .order("last_stripe_event_created_at", { ascending: false });

  if (subscriptionsError) {
    throwMembershipQueryError("look up the membership subscription", subscriptionsError);
  }

  const subscriptionRows = subscriptions ?? [];
  const planIds = [
    ...new Set(
      subscriptionRows
        .map((subscription) => subscription.membership_plan_id)
        .filter((membershipPlanId): membershipPlanId is string => Boolean(membershipPlanId))
    ),
  ];
  const plansById = new Map<string, MembershipPlan>();

  if (planIds.length > 0) {
    const { data: plans, error: plansError } = await admin
      .from("membership_plans")
      .select("id, slug, name, description, stripe_price_id, past_due_grace_days, is_active, created_at, updated_at")
      .in("id", planIds);

    if (plansError) {
      throwMembershipQueryError("look up the membership plan", plansError);
    }

    (plans ?? []).forEach((plan) => plansById.set(plan.id, plan));
  }

  const subscriptionCandidates = subscriptionRows.map((subscription) => {
    const plan = subscription.membership_plan_id ? plansById.get(subscription.membership_plan_id) : null;
    const entitlementCandidate: EntitlementCandidate = {
      ...subscription,
      pastDueGraceDays: plan?.past_due_grace_days ?? 7,
    };

    return { entitlementCandidate, subscription };
  });
  const entitledSubscription = subscriptionCandidates.find(({ entitlementCandidate }) =>
    hasMembershipEntitlement(entitlementCandidate)
  );
  const currentSubscription = entitledSubscription?.subscription ?? subscriptionRows[0] ?? null;
  const currentPlan = currentSubscription?.membership_plan_id
    ? plansById.get(currentSubscription.membership_plan_id) ?? null
    : null;

  return {
    hasStripeCustomer: true,
    isAdmin,
    isEntitled: hasMembershipAccess({
      isAdmin,
      subscription: entitledSubscription?.entitlementCandidate ?? null,
    }),
    billingCustomer,
    subscription: currentSubscription,
    plan: currentPlan,
  };
}
