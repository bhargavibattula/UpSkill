import { NextRequest, NextResponse } from "next/server";
import { decode } from "next-auth/jwt";

/**
 * Custom session endpoint — reads the JWT cookie and returns the session.
 * Replaces NextAuth's /api/auth/session which is broken on Next.js 16.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET!;

  const secureCookie = req.cookies.get("__Secure-next-auth.session-token");
  const normalCookie = req.cookies.get("next-auth.session-token");
  let token = null;

  if (secureCookie?.value) {
    try {
      token = await decode({
        token: secureCookie.value,
        secret,
        salt: secureCookie.name,
      });
    } catch {
      // ignore
    }
  }

  if (!token && normalCookie?.value) {
    try {
      token = await decode({
        token: normalCookie.value,
        secret,
        salt: normalCookie.name,
      });
    } catch {
      // ignore
    }
  }

  if (!token) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: token.sub,
      name: token.name,
      email: token.email,
      role: token.role,
      employeeId: token.employeeId,
      district: token.district,
      mandal: token.mandal,
      venue: token.venue,
      avatar: token.avatar,
    },
    expires: token.exp ? new Date(Number(token.exp) * 1000).toISOString() : null,
  });
}
