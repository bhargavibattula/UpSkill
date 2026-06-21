import { Metadata } from "next";
import { getCustomSession } from "@/lib/auth/session";
import TopBar from "@/components/shared/TopBar";
import StatCard from "@/components/dashboard/StatCard";
import { GraduationCap, ClipboardList, Award, Bell } from "lucide-react";

import connectDB from "@/lib/db/mongoose";
import Participant from "@/models/Participant";
import Attendance from "@/models/Attendance";
import Program from "@/models/Program";

export const metadata: Metadata = { title: "Student Dashboard" };

export default async function StudentDashboard() {
  const session = await getCustomSession();
  
  await connectDB();
  const userEmail = session?.user?.email;

  // 1. Total Enrolled (Match by name since demo seed might use different email domains)
  const userName = session?.user?.name;
  const enrollments = await Participant.find({ name: userName });
  const totalEnrolled = enrollments.length;

  // 2. Certificates Earned
  const certificatesEarned = enrollments.filter(e => e.certificateIssued).length;

  // 3. Dynamic Attendance (Average of programs they are in)
  let avgAttendance = "0%";
  if (totalEnrolled > 0) {
    const programIds = enrollments.map(e => e.program);
    const attendanceRecords = await Attendance.find({ program: { $in: programIds } });
    if (attendanceRecords.length > 0) {
      const sum = attendanceRecords.reduce((acc, curr) => acc + (curr.attendancePercentage || 0), 0);
      avgAttendance = `${Math.round(sum / attendanceRecords.length)}%`;
    } else {
      avgAttendance = "No Data";
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title={`Welcome, ${session?.user?.name?.split(" ")[0] || "Student"}`} subtitle="Your learning portal" />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="My Enrollments" value={totalEnrolled} subtitle="Total enrolled" icon={GraduationCap} iconColor="text-brand-600" iconBg="bg-brand-50 dark:bg-brand-950" />
          <StatCard title="Attendance" value={avgAttendance} subtitle="Average for my programs" icon={ClipboardList} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950" />
          <StatCard title="Certificates" value={certificatesEarned} subtitle="Earned" icon={Award} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-950" />
        </div>
      </div>
    </div>
  );
}
