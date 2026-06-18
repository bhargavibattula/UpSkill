import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";

/**
 * Server-side session reader for Next.js 16 + next-auth v4.
 * 
 * Replaces `getServerSession(authOptions)` which is broken in this combination.
 * Reads the session cookie directly and decodes the JWT.
 * 
 * Returns a session-like object compatible with what getServerSession returns,
 * or null if not authenticated.
 */
export async function getCustomSession() {
  const cookieStore = await cookies();
  const secureCookie = cookieStore.get("__Secure-next-auth.session-token");
  const normalCookie = cookieStore.get("next-auth.session-token");
  let token = null;

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

  if (!token) return null;

  try {

    return {
      user: {
        id: token.sub as string,
        name: token.name as string,
        email: token.email as string,
        role: token.role as string,
        employeeId: token.employeeId as string,
        district: token.district as string | undefined,
        mandal: token.mandal as string | undefined,
        venue: token.venue as string | undefined,
        avatar: token.avatar as string | undefined,
      },
      expires: token.exp
        ? new Date(Number(token.exp) * 1000).toISOString()
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch {
    // Silently ignore decode errors (likely an old or invalid token)
    return null;
  }
}
