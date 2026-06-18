import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import { redirect } from "next/navigation";
import Sidebar from "@/components/shared/Sidebar";

/**
 * Dashboard layout — uses direct JWT decode instead of getServerSession
 * which is broken on Next.js 16 with next-auth v4.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const secureCookie = cookieStore.get("__Secure-next-auth.session-token");
  const normalCookie = cookieStore.get("next-auth.session-token");

  if (!secureCookie?.value && !normalCookie?.value) {
    redirect("/login");
  }

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

  if (!token) redirect("/login");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
