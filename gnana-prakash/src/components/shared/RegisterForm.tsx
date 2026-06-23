"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, GraduationCap, ShieldCheck, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "@/lib/hooks/use-toast";

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "STUDENT",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const password = formData.password;
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError("Password must contain at least one special character.");
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || "Registration failed.";
        setError(errMsg);
        toast({ title: "Registration Failed", description: errMsg, variant: "destructive" });
      } else {
        toast({ title: "Registration Request Submitted", description: "Your access request has been sent for admin verification.", variant: "success" });
        setSuccess(true);
      }
    } catch (err: any) {
      const errMsg = err.message || "An unexpected error occurred.";
      setError(errMsg);
      toast({ title: "Registration Error", description: errMsg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 text-center dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 shadow-sm border border-emerald-100 mb-6">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4 dark:text-slate-100">Registration Submitted!</h2>
        <p className="text-slate-600 mb-8">
          Your request has been securely routed to the Super Admin for approval. You will not be able to login until your account is activated.
        </p>
        <Button onClick={() => router.push("/login")} className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-600/30">
          Return to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 w-full dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 shadow-sm border border-brand-100 mb-4">
          <GraduationCap className="w-6 h-6 text-brand-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight dark:text-slate-100">Request Access</h1>
        <p className="text-slate-500 text-sm mt-1">Submit your details for Admin verification</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-600 text-sm font-medium">{error}</div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-700 text-sm font-semibold">Full Name</Label>
          <Input id="name" required placeholder="John Doe" value={formData.name} onChange={handleChange} className="bg-slate-50 border-slate-200 h-10 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-700 text-sm font-semibold">Official Email</Label>
          <Input id="email" type="email" required placeholder="name@gnana.edu.in" value={formData.email} onChange={handleChange} className="bg-slate-50 border-slate-200 h-10 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile" className="text-slate-700 text-sm font-semibold">Mobile Number</Label>
          <Input id="mobile" required placeholder="10-digit number" value={formData.mobile} onChange={handleChange} className="bg-slate-50 border-slate-200 h-10 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role" className="text-slate-700 text-sm font-semibold">Requested Role</Label>
          <select id="role" required value={formData.role} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <option value="STUDENT">Student</option>
            <option value="MANDAL_ADMIN">Mandal Admin</option>
            <option value="DISTRICT_ADMIN">District Admin</option>
            <option value="STATE_ADMIN">State Admin</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-700 text-sm font-semibold">Set Password</Label>
          <Input id="password" type="password" required placeholder="Min 8 characters" value={formData.password} onChange={handleChange} className="bg-slate-50 border-slate-200 h-10 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" />
          <div className="mt-2 space-y-1">
            <div className={`flex items-center text-[11px] ${formData.password.length >= 8 ? "text-emerald-600 font-medium" : "text-rose-500"}`}>
              {formData.password.length >= 8 ? <Check className="w-3.5 h-3.5 mr-1" /> : <X className="w-3.5 h-3.5 mr-1" />}
              At least 8 characters long
            </div>
            <div className={`flex items-center text-[11px] ${/[A-Z]/.test(formData.password) ? "text-emerald-600 font-medium" : "text-rose-500"}`}>
              {/[A-Z]/.test(formData.password) ? <Check className="w-3.5 h-3.5 mr-1" /> : <X className="w-3.5 h-3.5 mr-1" />}
              One uppercase letter
            </div>
            <div className={`flex items-center text-[11px] ${/[a-z]/.test(formData.password) ? "text-emerald-600 font-medium" : "text-rose-500"}`}>
              {/[a-z]/.test(formData.password) ? <Check className="w-3.5 h-3.5 mr-1" /> : <X className="w-3.5 h-3.5 mr-1" />}
              One lowercase letter
            </div>
            <div className={`flex items-center text-[11px] ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? "text-emerald-600 font-medium" : "text-rose-500"}`}>
              {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? <Check className="w-3.5 h-3.5 mr-1" /> : <X className="w-3.5 h-3.5 mr-1" />}
              One special character
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-bold tracking-wide rounded-xl shadow-lg mt-4">
          {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Submitting...</> : "Submit Registration Request"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
          Already have an account? Log in here
        </Link>
      </div>
    </div>
  );
}
