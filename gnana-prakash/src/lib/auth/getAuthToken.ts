import { decode } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import type { JWT } from "next-auth/jwt";

/**
 * Bulletproof token extraction for Next.js 16 App Router + Vercel.
 * 
 * Problem: NextAuth v4's `getToken()` uses `req.cookies[name]` bracket access,
 * but in Next.js 16 App Router, `req.cookies` is a `RequestCookies` class that
 * requires `.get(name)` — bracket access silently returns `undefined`, causing
 * permanent 401s in production.
 *
 * Solution: Read cookies manually via `req.cookies.get()` and decode the JWT
 * directly using NextAuth's `decode()` function, bypassing `getToken` entirely.
 */
export async function getAuthToken(req: NextRequest): Promise<JWT | null> {
  const secret = process.env.NEXTAUTH_SECRET!;

  // On Vercel (HTTPS), cookie name is __Secure-next-auth.session-token
  // On localhost (HTTP), cookie name is next-auth.session-token
  const secureCookie = req.cookies.get("__Secure-next-auth.session-token");
  const normalCookie = req.cookies.get("next-auth.session-token");
  let token: JWT | null = null;

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
    return null;
  }

  if (token && token.sub) {
    token.id = token.sub;
  }
  return token;
}
