import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Manually read cookies - bypasses getToken's broken bracket-access on Next.js 16
  const secureCookie = req.cookies.get("__Secure-next-auth.session-token");
  const normalCookie = req.cookies.get("next-auth.session-token");
  
  let token = null;

  // Try decoding secure cookie first
  if (secureCookie?.value) {
    try {
      token = await decode({
        token: secureCookie.value,
        secret: process.env.NEXTAUTH_SECRET!,
        salt: secureCookie.name,
      });
    } catch {
      // ignore
    }
  }

  // If no token yet, try normal cookie
  if (!token && normalCookie?.value) {
    try {
      token = await decode({
        token: normalCookie.value,
        secret: process.env.NEXTAUTH_SECRET!,
        salt: normalCookie.name,
      });
    } catch {
      // ignore
    }
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = token.role as string;

  const roleRoutes: Record<string, string[]> = {
    SUPER_ADMIN: ["/super-admin", "/state-admin", "/district-admin", "/mandal-admin"],
    STATE_ADMIN: ["/state-admin", "/super-admin/custom-fields"],
    DISTRICT_ADMIN: ["/district-admin", "/super-admin/custom-fields"],
    MANDAL_ADMIN: ["/mandal-admin", "/super-admin/custom-fields"],
    VENUE_ADMIN: ["/mandal-admin", "/super-admin/custom-fields"],
    TEACHER: ["/teacher", "/super-admin/custom-fields"],
    TRAINER: ["/trainer", "/super-admin/custom-fields"],
    STAFF: ["/teacher", "/super-admin/custom-fields"],
    STUDENT: ["/student", "/super-admin/custom-fields"],
  };

  const allowedPaths = roleRoutes[role] || [];
  const isAllowed = allowedPaths.some((p) => pathname.startsWith(p));

  if (!isAllowed && !pathname.startsWith("/api")) {
    const dashboardMap: Record<string, string> = {
      SUPER_ADMIN: "/super-admin",
      STATE_ADMIN: "/state-admin",
      DISTRICT_ADMIN: "/district-admin",
      MANDAL_ADMIN: "/mandal-admin",
      VENUE_ADMIN: "/mandal-admin",
      TEACHER: "/teacher",
      TRAINER: "/trainer",
      STAFF: "/teacher",
      STUDENT: "/student",
    };
    return NextResponse.redirect(new URL(dashboardMap[role] || "/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/super-admin/:path*",
    "/state-admin/:path*",
    "/district-admin/:path*",
    "/mandal-admin/:path*",
    "/teacher/:path*",
    "/trainer/:path*",
    "/student/:path*",
  ],
};
