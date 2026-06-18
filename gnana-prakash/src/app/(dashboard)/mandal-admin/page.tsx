import { Metadata } from "next";
import { getCustomSession } from "@/lib/auth/session";
import TopBar from "@/components/shared/TopBar";
import StatCard from "@/components/dashboard/StatCard";
import { GraduationCap, Users, Building2, Image } from "lucide-react";
import connectDB from "@/lib/db/mongoose";
import Program from "@/models/Program";
import Venue from "@/models/Venue";
import Participant from "@/models/Participant";
import User from "@/models/User";

export const metadata: Metadata = { title: "Mandal Admin Dashboard" };

export default async function MandalAdminDashboard() {
  const session = await getCustomSession();
  const mandalId = (session?.user as any)?.mandal;
  await connectDB();
  
  const query = mandalId ? { mandal: mandalId } : {};
  
  const [programs, venues, participants, users] = await Promise.all([
    Program.countDocuments(query),
    Venue.countDocuments({ ...query, isActive: true }),
    Participant.countDocuments(query),
    User.countDocuments({ ...query, isActive: true }),
  ]);

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Mandal Dashboard" subtitle="Your local area overview" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Programs" value={programs} subtitle="In this mandal" icon={GraduationCap} iconColor="text-brand-600" iconBg="bg-brand-50 dark:bg-brand-950" />
          <StatCard title="Venues" value={venues} subtitle="Training centers" icon={Building2} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950" />
          <StatCard title="Participants" value={participants} subtitle="Registered locally" icon={Users} iconColor="text-violet-600" iconBg="bg-violet-50 dark:bg-violet-950" />
          <StatCard title="Portal Users" value={users} subtitle="Registered users" icon={Users} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-950" />
        </div>
      </div>
    </div>
  );
}
