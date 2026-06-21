import { Metadata } from "next";
import { getCustomSession } from "@/lib/auth/session";
import TopBar from "@/components/shared/TopBar";
import TeacherAttendanceClient from "@/components/attendance/TeacherAttendanceClient";

export const metadata: Metadata = { title: "My Attendance" };

export default async function TeacherAttendancePage() {
  const session = await getCustomSession();
  const email = session?.user?.email || "";
  const employeeId = (session?.user as any)?.employeeId || "";

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Attendance History" subtitle="Your training attendance record" />
      <div className="p-4 sm:p-6 lg:p-8">
        <TeacherAttendanceClient email={email} employeeId={employeeId} />
      </div>
    </div>
  );
}
