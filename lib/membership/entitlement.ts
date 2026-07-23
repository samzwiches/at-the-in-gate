import "server-only";
import type { Database } from "@/lib/database.types";

type MembershipSubscription = Pick<
  Database["public"]["Tables"]["membership_subscriptions"]["Row"],
  | "cancel_at_period_end"
  | "current_period_end"
  | "last_stripe_event_created_at"
  | "status"
>;

export type EntitlementCandidate = MembershipSubscription & {
  pastDueGraceDays: number;
};

export type MembershipAccessCandidate = {
  isAdmin: boolean;
  subscription: EntitlementCandidate | null;
};

function toTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

/**
 * Mirrors private.has_active_membership for server-rendered authorization.
 * Only active/trialing subscriptions are entitled, with the cancellation
 * boundary and configured past-due grace period applied deliberately.
 */
export function hasMembershipEntitlement(candidate: EntitlementCandidate, now = new Date()) {
  const nowTimestamp = now.getTime();

  if (candidate.status === "active" || candidate.status === "trialing") {
    if (!candidate.cancel_at_period_end) {
      return true;
    }

    const currentPeriodEnd = toTimestamp(candidate.current_period_end);
    return currentPeriodEnd !== null && currentPeriodEnd > nowTimestamp;
  }

  if (candidate.status === "past_due") {
    const graceStartsAt =
      toTimestamp(candidate.current_period_end) ??
      toTimestamp(candidate.last_stripe_event_created_at);

    if (graceStartsAt === null) {
      return false;
    }

    return nowTimestamp < graceStartsAt + candidate.pastDueGraceDays * 24 * 60 * 60 * 1000;
  }

  return false;
}

/**
 * Mirrors private.has_active_membership for server-rendered authorization.
 * An administrator role is an intentional access entitlement; otherwise the
 * same subscription rules used by the database apply.
 */
export function hasMembershipAccess(candidate: MembershipAccessCandidate, now = new Date()) {
  return candidate.isAdmin || (candidate.subscription ? hasMembershipEntitlement(candidate.subscription, now) : false);
}
