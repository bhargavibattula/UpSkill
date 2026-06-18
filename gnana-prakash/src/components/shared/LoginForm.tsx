"use client";
import { useState } from "react";
import { toast } from "@/lib/hooks/use-toast";
import { DASHBOARD_ROUTES } from "@/lib/auth/rbac";
import { UserRole } from "@/types";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations";
import { Eye, EyeOff, GraduationCap, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Mode states for forgot password flow
  const [mode, setMode] = useState<"login" | "forgot_email" | "forgot_reset">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

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

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setForgotLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }
      toast({ title: "OTP Sent", description: data.message || "A 2FA code has been sent to your email.", variant: "success" });
      setForgotOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setMode("forgot_reset");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      toast({ title: "Request Failed", description: err.message, variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim() || forgotOtp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError("New password must contain at least one uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setError("New password must contain at least one lowercase letter.");
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setError("New password must contain at least one special character.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setForgotLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }
      
      toast({ title: "Password Reset Successful", description: "Your password has been updated. Logging you in...", variant: "success" });
      
      // Auto login after password reset
      setLoading(true);
      const loginRes = await fetch("/api/auth/custom-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, password: newPassword }),
      });

      const loginResult = await loginRes.json();
      if (!loginRes.ok || loginResult.error) {
        toast({ title: "Login Required", description: "Password reset successful. Please sign in manually." });
        setMode("login");
        return;
      }

      setTimeout(() => {
        if (loginResult.user?.role) {
          const role = loginResult.user.role as UserRole;
          const dashboardUrl = DASHBOARD_ROUTES[role] || "/";
          window.location.href = dashboardUrl;
        } else {
          window.location.href = "/";
        }
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
      toast({ title: "Reset Failed", description: err.message, variant: "destructive" });
    } finally {
      setForgotLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 w-full">
      {mode === "login" && (
        <>
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
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-slate-700 text-sm font-semibold">Password</Label>
                <button type="button" onClick={() => { setMode("forgot_email"); setError(""); }}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                  Forgot Password?
                </button>
              </div>
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
        </>
      )}

      {mode === "forgot_email" && (
        <>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 shadow-sm border border-brand-100 mb-4">
              <GraduationCap className="w-6 h-6 text-brand-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reset Password</h1>
            <p className="text-slate-500 text-sm mt-1">Enter your registered email to receive a 2FA code</p>
          </div>

          <form onSubmit={handleRequestOTP} className="space-y-4">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-rose-400 text-sm">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-slate-700 text-sm font-semibold">Official Email</Label>
              <Input id="forgot-email" type="email" placeholder="your.name@gnana.edu.in" required
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 h-11 transition-all duration-200"
                value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
            </div>
            <Button type="submit" disabled={forgotLoading}
              className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-bold tracking-wide rounded-xl shadow-lg shadow-brand-600/30 transition-all active:scale-[0.98]">
              {forgotLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Sending code...</> : "Send 2FA Verification Code"}
            </Button>
            <button type="button" onClick={() => { setMode("login"); setError(""); }}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mt-2">
              Back to Sign In
            </button>
          </form>
        </>
      )}

      {mode === "forgot_reset" && (
        <>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 shadow-sm border border-brand-100 mb-4">
              <GraduationCap className="w-6 h-6 text-brand-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Verify & Reset</h1>
            <p className="text-slate-500 text-sm mt-1">Enter the 2FA code sent to your email and choose a new password</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-rose-400 text-sm">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-slate-700 text-sm font-semibold">2FA Verification Code (OTP)</Label>
              <Input id="otp" type="text" placeholder="Enter 6-digit code" required maxLength={6}
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 h-11 tracking-widest text-center text-lg font-bold transition-all duration-200"
                value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-slate-700 text-sm font-semibold">New Password</Label>
              <Input id="new-password" type="password" placeholder="Min. 8 characters" required
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 h-11 transition-all duration-200"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <div className="mt-2 space-y-1">
                <div className={`flex items-center text-[11px] ${newPassword.length >= 8 ? "text-emerald-600 font-medium" : "text-rose-500"}`}>
                  {newPassword.length >= 8 ? <Check className="w-3.5 h-3.5 mr-1" /> : <X className="w-3.5 h-3.5 mr-1" />}
                  At least 8 characters long
                </div>
                <div className={`flex items-center text-[11px] ${/[A-Z]/.test(newPassword) ? "text-emerald-600 font-medium" : "text-rose-500"}`}>
                  {/[A-Z]/.test(newPassword) ? <Check className="w-3.5 h-3.5 mr-1" /> : <X className="w-3.5 h-3.5 mr-1" />}
                  One uppercase letter
                </div>
                <div className={`flex items-center text-[11px] ${/[a-z]/.test(newPassword) ? "text-emerald-600 font-medium" : "text-rose-500"}`}>
                  {/[a-z]/.test(newPassword) ? <Check className="w-3.5 h-3.5 mr-1" /> : <X className="w-3.5 h-3.5 mr-1" />}
                  One lowercase letter
                </div>
                <div className={`flex items-center text-[11px] ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? "text-emerald-600 font-medium" : "text-rose-500"}`}>
                  {/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? <Check className="w-3.5 h-3.5 mr-1" /> : <X className="w-3.5 h-3.5 mr-1" />}
                  One special character
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-slate-700 text-sm font-semibold">Confirm New Password</Label>
              <Input id="confirm-password" type="password" placeholder="Confirm new password" required
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 h-11 transition-all duration-200"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={forgotLoading}
              className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-bold tracking-wide rounded-xl shadow-lg shadow-brand-600/30 transition-all active:scale-[0.98]">
              {forgotLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Resetting password...</> : "Verify OTP & Reset"}
            </Button>
            <button type="button" onClick={() => { setMode("forgot_email"); setError(""); }}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mt-2">
              Resend Verification Code
            </button>
          </form>
        </>
      )}
    </div>
  );
}
