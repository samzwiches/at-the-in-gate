import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const COMING_SOON_MODE = true;
const PUBLIC_SITE_HOSTNAMES = new Set(["attheingate.com", "www.attheingate.com"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicSiteHostname = PUBLIC_SITE_HOSTNAMES.has(request.nextUrl.hostname);

  const shouldBypassComingSoon =
    pathname === "/coming-soon.html" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next/");

  if (COMING_SOON_MODE && isPublicSiteHostname && !shouldBypassComingSoon) {
    return NextResponse.rewrite(new URL("/coming-soon.html", request.url));
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
