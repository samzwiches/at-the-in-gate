import type Stripe from "stripe";
import type { Json } from "@/lib/database.types";
import { getAdminClient } from "@/lib/supabase/admin";
import { getStripeObjectId, syncMembershipSubscriptionFromStripe } from "@/lib/stripe/billing";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handledEventTypes = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

function subscriptionIdFromEvent(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    return getStripeObjectId((event.data.object as Stripe.Checkout.Session).subscription);
  }

  if (event.type.startsWith("customer.subscription.")) {
    return (event.data.object as Stripe.Subscription).id;
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionDetails = invoice.parent?.subscription_details;
    return getStripeObjectId(subscriptionDetails?.subscription);
  }

  return null;
}

function invoiceStatusFromEvent(event: Stripe.Event) {
  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    return (event.data.object as Stripe.Invoice).status;
  }

  return null;
}

async function completeWebhookEvent(
  stripeEventId: string,
  processingStatus: "processed" | "ignored" | "failed",
  processingError?: string
) {
  await getAdminClient().rpc("complete_stripe_webhook_event", {
    p_stripe_event_id: stripeEventId,
    p_processing_status: processingStatus,
    ...(processingError ? { p_processing_error: processingError.slice(0, 2000) } : {}),
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripeClient().webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());
  } catch {
    return Response.json({ error: "Webhook signature verification failed." }, { status: 400 });
  }

  let eventWasClaimed = false;

  try {
    const { data: didClaimEvent, error: recordError } = await getAdminClient().rpc("record_stripe_webhook_event", {
      p_stripe_event_id: event.id,
      p_event_type: event.type,
      p_stripe_created_at: new Date(event.created * 1000).toISOString(),
      p_payload: JSON.parse(rawBody) as Json,
    });

    if (recordError) {
      throw new Error(recordError.message);
    }

    eventWasClaimed = didClaimEvent === true;

    if (!eventWasClaimed) {
      return Response.json({ received: true, duplicate: true });
    }

    if (!handledEventTypes.has(event.type)) {
      await completeWebhookEvent(event.id, "ignored");
      return Response.json({ received: true, ignored: true });
    }

    const subscriptionId = subscriptionIdFromEvent(event);

    if (!subscriptionId) {
      await completeWebhookEvent(event.id, "ignored");
      return Response.json({ received: true, ignored: true });
    }

    // Retrieve the canonical Stripe subscription instead of treating event or
    // browser values as authoritative state.
    const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price"],
    });
    const result = await syncMembershipSubscriptionFromStripe(
      subscription,
      new Date(event.created * 1000),
      invoiceStatusFromEvent(event)
    );

    await completeWebhookEvent(event.id, result.outcome === "ignored" ? "ignored" : "processed");

    return Response.json({ received: true, outcome: result.outcome });
  } catch (error) {
    if (eventWasClaimed) {
      try {
        await completeWebhookEvent(
          event.id,
          "failed",
          error instanceof Error ? error.message : "Unknown webhook processing error."
        );
      } catch {
        // Stripe will retry the original non-2xx response. Never leak billing internals to the caller.
      }
    }

    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
