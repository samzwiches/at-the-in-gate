import { type NextRequest, NextResponse } from "next/server";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

function redirectToSignIn(
  request: NextRequest,
  nextPath: string,
  errorCode: string,
) {
  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("next", nextPath);
  signInUrl.searchParams.set("error", "oauth_callback");
  signInUrl.searchParams.set("error_code", errorCode);
  return NextResponse.redirect(signInUrl);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"));
  const providerErrorCode =
    request.nextUrl.searchParams.get("error_code") ??
    request.nextUrl.searchParams.get("error");

  if (providerErrorCode) {
    console.error("[auth/callback] OAuth provider returned an error", {
      code: providerErrorCode,
      description: request.nextUrl.searchParams.get("error_description"),
    });
    return redirectToSignIn(request, nextPath, providerErrorCode);
  }

  if (!code) {
    console.error("[auth/callback] Missing authorization code");
    return redirectToSignIn(request, nextPath, "missing_authorization_code");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const errorCode = error.code ?? "exchange_failed";
    console.error("[auth/callback] Code exchange failed", {
      code: errorCode,
      message: error.message,
      status: error.status,
    });
    return redirectToSignIn(request, nextPath, errorCode);
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
