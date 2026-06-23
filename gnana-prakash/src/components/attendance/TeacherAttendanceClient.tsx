"use client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  GraduationCap, ClipboardList, Award, CheckCircle2, XCircle, 
  MinusCircle, Loader2, RefreshCw, Calendar, Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface TeacherAttendanceClientProps {
  email: string;
  employeeId?: string;
}

export default function TeacherAttendanceClient({ email, employeeId }: TeacherAttendanceClientProps) {
  // Fetch personal training attendance history
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["teacher_attendance", email, employeeId],
    queryFn: async () => {
      const url = new URL("/api/attendance/participants", window.location.origin);
      if (email) url.searchParams.set("email", email);
      if (employeeId) url.searchParams.set("employeeId", employeeId);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load attendance logs");
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
        <p className="text-sm text-slate-500 font-medium">Loading your attendance record...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <p className="text-rose-600 font-semibold">Failed to load attendance record</p>
        <button 
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-brand-600 font-bold hover:underline"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try Again
        </button>
      </div>
    );
  }

  const programs = data?.data || [];
  
  // Calculate aggregate metrics
  const totalPrograms = programs.length;
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLoggedDays = 0;
  let certificatesIssuedCount = 0;

  programs.forEach((prog: any) => {
    if (prog.certificateIssued) {
      certificatesIssuedCount++;
    }
    prog.attendanceLogs.forEach((log: any) => {
      totalLoggedDays++;
      if (log.status === "PRESENT") {
        totalPresent++;
      } else {
        totalAbsent++;
      }
    });
  });

  const averageAttendance = totalLoggedDays > 0 
    ? Math.round((totalPresent / totalLoggedDays) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-slate-100 shadow-sm dark:border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{totalPrograms}</p>
              <p className="text-xs text-slate-500 font-medium">Enrolled Trainings</p>
            </div>
            <div className="p-3 bg-brand-50 rounded-xl">
              <GraduationCap className="w-5 h-5 text-brand-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm dark:border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-emerald-600">{totalPresent}</p>
              <p className="text-xs text-slate-500 font-medium">Total Days Present</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm dark:border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-rose-500">{totalAbsent}</p>
              <p className="text-xs text-slate-500 font-medium">Total Days Absent</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl">
              <XCircle className="w-5 h-5 text-rose-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm dark:border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-amber-600">{averageAttendance}%</p>
              <p className="text-xs text-slate-500 font-medium">Average Attendance</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <ClipboardList className="w-5 h-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program Listings */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 dark:text-slate-100">
          <Calendar className="w-5 h-5 text-brand-600" /> Registered Training Log
        </h2>

        {programs.length === 0 ? (
          <Card className="border-slate-100 shadow-sm dark:border-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-500">
              <ClipboardList className="w-12 h-12 mb-3 opacity-20 text-brand-600" />
              <p className="font-semibold text-slate-700">No Attendance Logs Available</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
                You are currently not registered as a participant in any active training programs. When an admin registers you, your detailed logs will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {programs.map((prog: any) => {
              const programPresent = prog.attendanceLogs.filter((l: any) => l.status === "PRESENT").length;
              const programAbsent = prog.attendanceLogs.filter((l: any) => l.status === "ABSENT").length;
              const percent = prog.totalDays > 0 
                ? Math.round((programPresent / prog.totalDays) * 100) 
                : 0;

              return (
                <Card key={prog.programId} className="border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow dark:border-slate-800">
                  <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-brand-600 border-brand-200">
                            {prog.category || "Teacher"}
                          </Badge>
                          {prog.status === "COMPLETED" ? (
                            <Badge className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white">
                              Completed
                            </Badge>
                          ) : (
                            <Badge className="text-[10px] font-bold uppercase tracking-wider bg-brand-600 hover:bg-brand-700 text-white">
                              In Progress
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base font-bold text-slate-900 leading-snug mt-1 dark:text-slate-100">
                          {prog.programName}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                          Timeline: {formatDate(prog.startDate)} to {formatDate(prog.endDate)}
                        </CardDescription>
                      </div>
                      <div className="text-right flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-0 sm:justify-start">
                        <div className="text-2xl font-black text-brand-600">{percent}%</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Attendance</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-5 space-y-4">
                    {/* Day Cards / Grid */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Log</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-6 gap-3">
                        {Array.from({ length: prog.totalDays }).map((_, idx) => {
                          const dayNum = idx + 1;
                          const log = prog.attendanceLogs.find((l: any) => l.dayNumber === dayNum);
                          const status = log ? log.status : "PENDING";

                          return (
                            <div 
                              key={dayNum}
                              className={`p-3.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                                status === "PRESENT" 
                                  ? "border-emerald-100 bg-emerald-50/50" 
                                  : status === "ABSENT"
                                  ? "border-rose-100 bg-rose-50/50"
                                  : "border-slate-100 bg-slate-50/30"
                              }`}
                            >
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Day {dayNum}</span>
                              {status === "PRESENT" ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              ) : status === "ABSENT" ? (
                                <XCircle className="w-5 h-5 text-rose-500" />
                              ) : (
                                <MinusCircle className="w-5 h-5 text-slate-300" />
                              )}
                              <span className={`text-[10px] font-bold tracking-wide ${
                                status === "PRESENT"
                                  ? "text-emerald-700"
                                  : status === "ABSENT"
                                  ? "text-rose-600"
                                  : "text-slate-400"
                              }`}>
                                {status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Certificate banner */}
                    {prog.certificateIssued && prog.certificateId && (
                      <div className="mt-4 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Award className="w-5 h-5 text-amber-600" />
                          <div>
                            <p className="text-xs font-bold text-amber-900 flex items-center gap-1">
                              Certificate Issued! <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            </p>
                            <p className="text-[10px] text-amber-800 font-medium">ID: {prog.certificateId}</p>
                          </div>
                        </div>
                        <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px]">
                          Issued
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
