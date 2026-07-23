import { getAuthenticatedUser } from "@/lib/auth/require-user";
import { createMembershipCheckoutSession } from "@/lib/stripe/billing";
import { getAppUrl } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return Response.json({ error: "Sign in is required before starting membership Checkout." }, { status: 401 });
  }

  try {
    const checkout = await createMembershipCheckoutSession(user.id, user.email, getAppUrl());

    if (checkout.alreadyEntitled) {
      return Response.json({ error: "Your membership is already active. Manage billing from your account." }, { status: 409 });
    }

    return Response.json({ url: checkout.url }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Membership Checkout is unavailable right now. Please try again shortly." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
