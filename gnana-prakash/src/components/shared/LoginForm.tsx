"use client";
import { useState } from "react";
import { toast } from "@/lib/hooks/use-toast";
import { DASHBOARD_ROUTES } from "@/lib/auth/rbac";
import { UserRole } from "@/types";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations";
import { Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError("");
    try {
      // Use custom login API — bypasses NextAuth's broken signIn() on Next.js 16
      const res = await fetch("/api/auth/custom-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        const errMsg = result.error || "Invalid credentials. Please check your email and password.";
        setError(errMsg);
        toast({ title: "Login Failed", description: errMsg, variant: "destructive" });
        return;
      }

      // Login successful — the cookie is already set by the server
      toast({ title: "Login Successful", description: `Welcome back, ${result.user?.name || "User"}!`, variant: "success" });
      
      // Delay navigation slightly to ensure toast is visible and cookie is registered
      setTimeout(() => {
        if (result.user?.role) {
          const role = result.user.role as UserRole;
          const dashboardUrl = DASHBOARD_ROUTES[role] || "/";
          window.location.href = dashboardUrl;
        } else {
          window.location.href = "/";
        }
      }, 500);
    } catch (err: any) {
      console.error("Login error:", err);
      const errMsg = err.message || "Network error. Please check your connection and try again.";
      setError(errMsg);
      toast({ title: "Login Error", description: errMsg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 w-full">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 shadow-sm border border-brand-100 mb-4">
          <GraduationCap className="w-6 h-6 text-brand-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
        <p className="text-slate-500 text-sm mt-1">Sign in to your official portal</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-rose-400 text-sm">{error}</div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-700 text-sm font-semibold">Official Email</Label>
          <Input id="email" type="email" placeholder="your.name@gnana.edu.in" autoComplete="email"
            className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 h-11 transition-all duration-200"
            {...register("email")} />
          {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-700 text-sm font-semibold">Password</Label>
          <div className="relative">
            <Input id="password" type={showPwd ? "text" : "password"} placeholder="Enter your password"
              autoComplete="current-password"
              className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 h-11 pr-12 transition-all duration-200"
              {...register("password")} />
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => setShowPwd(!showPwd)}>
              {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <Button type="submit" disabled={loading}
          className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-bold tracking-wide rounded-xl shadow-lg shadow-brand-600/30 transition-all active:scale-[0.98]">
          {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Signing in...</> : "Sign In Securely"}
        </Button>
      </form>


    </div>
  );
}
