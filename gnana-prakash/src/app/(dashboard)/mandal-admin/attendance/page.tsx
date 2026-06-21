import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import AttendanceClient from "@/components/attendance/AttendanceClient";
export const metadata: Metadata = { title: "Attendance" };
export default function MandalAttendancePage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Attendance" subtitle="Record daily attendance" />
      <div className="p-4 sm:p-6 lg:p-8"><AttendanceClient /></div>
    </div>
  );
}
