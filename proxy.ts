import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { db } from "@/lib/db";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/reset-password",
  "/api/auth/webhook",
  "/api/cron",
  "/_next",
  "/favicon.ico",
  "/manifest.json",
  "/icons",
  "/sw.js",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  // Always refresh the session token
  const supabase = createMiddlewareClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow public paths through
  if (isPublicPath(pathname)) {
    // Redirect already-authenticated users away from auth pages
    if (user && (pathname === "/login" || pathname === "/signup")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  // Unauthenticated → login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Check onboarding (skip for /onboarding itself)
  if (pathname !== "/onboarding") {
    try {
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { onboardingCompleted: true },
      });
      if (dbUser && !dbUser.onboardingCompleted) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    } catch {
      // DB not yet available (e.g., first deploy) — let through
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)",
  ],
};
