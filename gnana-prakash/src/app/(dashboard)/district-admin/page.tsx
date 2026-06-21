import { Metadata } from "next";
import { getCustomSession } from "@/lib/auth/session";
import TopBar from "@/components/shared/TopBar";
import StatCard from "@/components/dashboard/StatCard";
import { GraduationCap, Users, Building2, Image, BarChart3, CheckCircle } from "lucide-react";
import connectDB from "@/lib/db/mongoose";
import Program from "@/models/Program";
import Participant from "@/models/Participant";
import Venue from "@/models/Venue";
import Photo from "@/models/Photo";
import User from "@/models/User";

export const metadata: Metadata = { title: "District Admin Dashboard" };

export default async function DistrictAdminDashboard() {
  const session = await getCustomSession();
  const districtId = (session?.user as any)?.district;
  await connectDB();
  const query = districtId ? { district: districtId } : {};
  const [programs, venues, pendingPhotos, users] = await Promise.all([
    Program.countDocuments(query),
    Venue.countDocuments({ ...query, isActive: true }),
    Photo.countDocuments({ status: "PENDING" }),
    User.countDocuments({ isActive: true, ...query }),
  ]);

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="District Dashboard" subtitle="District-level program oversight" />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Programs" value={programs} subtitle="In this district" icon={GraduationCap} iconColor="text-brand-600" iconBg="bg-brand-50 dark:bg-brand-950" />
          <StatCard title="Venues" value={venues} subtitle="Training centers" icon={Building2} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950" />
          <StatCard title="Pending Approvals" value={pendingPhotos} subtitle="Media to review" icon={Image} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-950" />
          <StatCard title="Total Users" value={users} subtitle="Registered in district" icon={Users} iconColor="text-violet-600" iconBg="bg-violet-50 dark:bg-violet-950" />
        </div>
      </div>
    </div>
  );
}
