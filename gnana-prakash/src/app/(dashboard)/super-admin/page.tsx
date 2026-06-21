import { Metadata } from "next";
import { getCustomSession } from "@/lib/auth/session";
import connectDB from "@/lib/db/mongoose";
import Program from "@/models/Program";
import Venue from "@/models/Venue";
import District from "@/models/District";
import Mandal from "@/models/Mandal";
import Participant from "@/models/Participant";
import Photo from "@/models/Photo";
import Video from "@/models/Video";
import User from "@/models/User";
import TopBar from "@/components/shared/TopBar";
import StatCard from "@/components/dashboard/StatCard";
import SuperAdminCharts from "@/components/dashboard/SuperAdminCharts";
import CircularsWidget from "@/components/announcements/CircularsWidget";
import PendingRegistrationsWidget from "@/components/users/PendingRegistrationsWidget";
import { Building2, GraduationCap, Users, MapPin, Image, Video as VideoIcon, CheckCircle, Clock, UserCheck, AlertCircle } from "lucide-react";

export const metadata: Metadata = { title: "Super Admin Dashboard" };

async function getDashboardStats() {
  await connectDB();
  const [districts, mandals, venues, programs, participants, photos, videos, users, pendingPhotos, pendingVideos, activePrograms] = await Promise.all([
    District.countDocuments({ isActive: true }),
    Mandal.countDocuments({ isActive: true }),
    Venue.countDocuments({ isActive: true }),
    Program.countDocuments(),
    Participant.countDocuments(),
    Photo.countDocuments({ status: "APPROVED" }),
    Video.countDocuments({ status: "APPROVED" }),
    User.countDocuments({ isActive: true }),
    Photo.countDocuments({ status: "PENDING" }),
    Video.countDocuments({ status: "PENDING" }),
    Program.countDocuments({ status: "ACTIVE" }),
  ]);
  return { districts, mandals, venues, programs, participants, photos, videos, users, pendingPhotos, pendingVideos, activePrograms };
}

export default async function SuperAdminDashboard() {
  const session = await getCustomSession();
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Super Admin Dashboard" subtitle="Department of School Education — Andhra Pradesh" />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Welcome Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-violet-600 p-6 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative">
            <p className="text-brand-200 text-sm font-medium mb-1">Welcome back,</p>
            <h2 className="text-2xl font-bold">{session?.user?.name}</h2>
            <p className="text-brand-200 text-sm mt-1">You have <span className="text-white font-semibold">{stats.pendingPhotos}</span> pending media approvals</p>
          </div>
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute -right-4 -bottom-12 w-32 h-32 bg-white/5 rounded-full" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Districts" value={stats.districts} subtitle="Active regions" icon={MapPin} iconColor="text-brand-600" iconBg="bg-brand-50 dark:bg-brand-950" />
          <StatCard title="Total Mandals" value={stats.mandals} subtitle="Administrative units" icon={Building2} iconColor="text-violet-600" iconBg="bg-violet-50 dark:bg-violet-950" />
          <StatCard title="Total Venues" value={stats.venues} subtitle="Training centers" icon={Building2} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950" />
          <StatCard title="Total Programs" value={stats.programs} subtitle={`${stats.activePrograms} active`} icon={GraduationCap} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-950" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total Participants" value={stats.participants} subtitle="Registered" icon={Users} iconColor="text-brand-600" iconBg="bg-brand-50 dark:bg-brand-950" />
          <StatCard title="Active Users" value={stats.users} subtitle="Portal access" icon={UserCheck} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950" />
          <StatCard title="Approved Photos" value={stats.photos} subtitle={`${stats.pendingPhotos} pending`} icon={Image} iconColor="text-violet-600" iconBg="bg-violet-50 dark:bg-violet-950" />
        </div>

        {/* Charts and Circulars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SuperAdminCharts />
          </div>
          <div className="lg:col-span-1">
            <CircularsWidget />
          </div>
        </div>

        {/* Quick Actions & Registrations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <PendingRegistrationsWidget />
          </div>
          <div className="rounded-xl border bg-card p-5 lg:col-span-1">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" /> Pending Media Approvals
            </h3>
            <div className="space-y-2">
              {stats.pendingPhotos > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium">{stats.pendingPhotos} Photos awaiting approval</span>
                  </div>
                  <span className="text-xs text-amber-600 font-medium">Review →</span>
                </div>
              )}
              {stats.pendingPhotos === 0 && (
                <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> All media approved
                </div>
              )}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 lg:col-span-1">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" /> System Overview
            </h3>
            <div className="space-y-3">
              {[
                { label: "Districts", value: stats.districts, total: 13, color: "bg-brand-500" },
                { label: "Venues Active", value: stats.venues, total: 100, color: "bg-emerald-500" },
                { label: "Programs Running", value: stats.activePrograms, total: stats.programs || 1, color: "bg-violet-500" },
              ].map(({ label, value, total, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value} / {total}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min((value / total) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...args: (string | undefined | null | false)[]): string {
  return args.filter(Boolean).join(" ");
}
