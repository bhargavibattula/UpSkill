import { Metadata } from "next";
import { getCustomSession } from "@/lib/auth/session";
import connectDB from "@/lib/db/mongoose";
import Participant from "@/models/Participant";
import ParticipantAttendance from "@/models/ParticipantAttendance";
import TopBar from "@/components/shared/TopBar";
import StatCard from "@/components/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ClipboardList, Award, Calendar, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Teacher Dashboard" };

export default async function TeacherDashboard() {
  const session = await getCustomSession();
  const email = session?.user?.email || "";
  const employeeId = (session?.user as any)?.employeeId || "";

  await connectDB();

  // Fetch participant registrations
  const registrations = await Participant.find({
    $or: [
      { email: email.toLowerCase() },
      { employeeId: employeeId }
    ]
  }).populate("program").lean();

  const programIds = registrations.map((r: any) => r.program?._id).filter(Boolean);

  // Fetch all daily attendance logs
  const attendanceLogs = await ParticipantAttendance.find({
    participant: { $in: registrations.map(r => r._id) }
  }).lean();

  // Metrics
  const totalProgramsEnrolled = registrations.length;
  const certificatesCount = registrations.filter(r => r.certificateIssued).length;

  const totalLogs = attendanceLogs.length;
  const totalPresent = attendanceLogs.filter(a => a.status === "PRESENT").length;
  
  const averageAttendancePercent = totalLogs > 0 
    ? Math.round((totalPresent / totalLogs) * 100) 
    : 0;

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title={`Welcome, ${session?.user?.name?.split(" ")[0]}`} subtitle="Your training portal" />
      
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard 
            title="My Trainings" 
            value={totalProgramsEnrolled} 
            subtitle="Total enrolled" 
            icon={GraduationCap} 
            iconColor="text-brand-600" 
            iconBg="bg-brand-50 dark:bg-brand-950" 
          />
          <StatCard 
            title="Attendance" 
            value={`${averageAttendancePercent}%`} 
            subtitle="Average" 
            icon={ClipboardList} 
            iconColor="text-emerald-600" 
            iconBg="bg-emerald-50 dark:bg-emerald-950" 
          />
          <StatCard 
            title="Certificates" 
            value={certificatesCount} 
            subtitle="Earned" 
            icon={Award} 
            iconColor="text-amber-600" 
            iconBg="bg-amber-50 dark:bg-amber-950" 
          />
        </div>

        {/* Enrollments Listing */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Enrolled Training Programs</CardTitle>
                <CardDescription>Courses and workshops assigned to you</CardDescription>
              </div>
              <Link href="/teacher/attendance">
                <Button size="sm" variant="outline" className="text-xs font-semibold">
                  View Detail Logs
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {registrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center">
                  <AlertCircle className="w-10 h-10 mb-2.5 opacity-20 text-brand-600" />
                  <p className="font-semibold text-slate-700">No Enrolled Courses Found</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    You are not currently listed in any active training programs. Please check back later or contact your Center Coordinator.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {registrations.map((reg: any) => {
                    const prog = reg.program;
                    if (!prog) return null;

                    const progLogs = attendanceLogs.filter(a => String(a.program) === String(prog._id));
                    const pres = progLogs.filter(a => a.status === "PRESENT").length;
                    const pct = progLogs.length > 0 ? Math.round((pres / progLogs.length) * 100) : 0;

                    return (
                      <div key={reg._id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">
                              {reg.category}
                            </span>
                            {prog.status === "COMPLETED" ? (
                              <Badge className="bg-emerald-600 text-white font-bold text-[9px] uppercase px-1.5 py-0">Completed</Badge>
                            ) : (
                              <Badge className="bg-brand-600 text-white font-bold text-[9px] uppercase px-1.5 py-0">Active</Badge>
                            )}
                          </div>
                          <p className="font-semibold text-slate-800 text-sm">{prog.programName}</p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(prog.startDate)} - {formatDate(prog.endDate)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-left sm:text-right">
                            <p className="text-sm font-bold text-slate-800">{pct}%</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Attendance</p>
                          </div>
                          {reg.certificateIssued && (
                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px] px-2 py-1 rounded-md">
                              <Award className="w-3.5 h-3.5 text-amber-600" />
                              <span>Cert Issued</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
