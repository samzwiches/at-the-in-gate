import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const COMING_SOON_MODE = true;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const shouldBypassComingSoon =
    pathname === "/coming-soon.html" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next/");

  if (COMING_SOON_MODE && !shouldBypassComingSoon) {
    return NextResponse.rewrite(new URL("/coming-soon.html", request.url));
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
