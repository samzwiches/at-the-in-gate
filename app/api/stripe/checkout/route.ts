import { getAuthenticatedUser } from "@/lib/auth/require-user";
import { createMembershipCheckoutSession } from "@/lib/stripe/billing";
import { getAppUrl, type MembershipBillingInterval } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return Response.json({ error: "Sign in is required before starting membership Checkout." }, { status: 401 });
  }

  let interval: MembershipBillingInterval = "monthly";

  try {
    const body = (await request.json()) as { interval?: unknown };

    if (body.interval === "annual") {
      interval = "annual";
    } else if (body.interval !== undefined && body.interval !== "monthly") {
      return Response.json({ error: "Choose either monthly or annual membership billing." }, { status: 400 });
    }
  } catch {
    // Preserve monthly Checkout for older clients that send an empty POST body.
  }

  try {
    const checkout = await createMembershipCheckoutSession(user.id, user.email, getAppUrl(), interval);

    if (checkout.alreadyEntitled) {
      return Response.json({ error: "Your membership is already active. Manage billing from your account." }, { status: 409 });
    }

    return Response.json({ url: checkout.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Membership checkout session creation failed", {
      userId: user.id,
      interval,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return Response.json(
      { error: "Membership Checkout is unavailable right now. Please try again shortly." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
