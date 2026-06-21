import { Metadata } from "next";
import { getCustomSession } from "@/lib/auth/session";
import TopBar from "@/components/shared/TopBar";
import StatCard from "@/components/dashboard/StatCard";
import { GraduationCap, Users, ClipboardList, Star } from "lucide-react";

export const metadata: Metadata = { title: "Trainer Dashboard" };

export default async function TrainerDashboard() {
  const session = await getCustomSession();
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title={`Welcome, ${session?.user?.name?.split(" ")[0]}`} subtitle="Trainer portal" />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Assigned Programs" value={4} subtitle="This year" icon={GraduationCap} iconColor="text-brand-600" iconBg="bg-brand-50 dark:bg-brand-950" />
          <StatCard title="Total Trainees" value={280} subtitle="Trained so far" icon={Users} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950" />
          <StatCard title="Sessions Taken" value={18} subtitle="Completed" icon={ClipboardList} iconColor="text-violet-600" iconBg="bg-violet-50 dark:bg-violet-950" />
          <StatCard title="Avg. Rating" value="4.8" subtitle="Feedback score" icon={Star} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-950" />
        </div>
      </div>
    </div>
  );
}
