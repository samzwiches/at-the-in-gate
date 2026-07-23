import { type NextRequest, NextResponse } from "next/server";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"));

  if (!code) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", nextPath);
    signInUrl.searchParams.set("error", "oauth_callback");
    return NextResponse.redirect(signInUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", nextPath);
    signInUrl.searchParams.set("error", "oauth_callback");
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
