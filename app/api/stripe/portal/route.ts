import { getAuthenticatedUser } from "@/lib/auth/require-user";
import { createBillingPortalSession } from "@/lib/stripe/billing";
import { getAppUrl } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return Response.json({ error: "Sign in is required to manage billing." }, { status: 401 });
  }

  try {
    const portalSession = await createBillingPortalSession(user.id, getAppUrl());

    if (!portalSession) {
      return Response.json({ error: "There is no billing account to manage yet." }, { status: 404 });
    }

    return Response.json({ url: portalSession.url }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Billing management is unavailable right now. Please try again shortly." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
