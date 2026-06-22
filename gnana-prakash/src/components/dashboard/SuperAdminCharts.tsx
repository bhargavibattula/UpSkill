"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const ATTENDANCE_DATA = [
  { month: "Jan", sgt: 120, krp: 45, drp: 30, meo: 15 },
  { month: "Feb", sgt: 160, krp: 55, drp: 40, meo: 20 },
  { month: "Mar", sgt: 200, krp: 65, drp: 50, meo: 25 },
  { month: "Apr", sgt: 180, krp: 60, drp: 45, meo: 22 },
  { month: "May", sgt: 220, krp: 70, drp: 55, meo: 28 },
  { month: "Jun", sgt: 250, krp: 80, drp: 60, meo: 32 },
];

const DISTRICT_DATA = [
  { district: "Krishna", participants: 450 },
  { district: "Guntur", participants: 380 },
  { district: "West G.", participants: 320 },
  { district: "East G.", participants: 290 },
  { district: "Kurnool", participants: 260 },
  { district: "Kadapa", participants: 230 },
];

const PIE_DATA = [
  { name: "Teachers", value: 65, color: "#3b82f6" },
  { name: "Trainers", value: 20, color: "#8b5cf6" },
  { name: "Staff", value: 15, color: "#10b981" },
];

const PROGRAM_DATA = [
  { month: "Jan", completed: 4, active: 2, draft: 1 },
  { month: "Feb", completed: 6, active: 3, draft: 2 },
  { month: "Mar", completed: 8, active: 4, draft: 1 },
  { month: "Apr", completed: 5, active: 5, draft: 3 },
  { month: "May", completed: 10, active: 3, draft: 2 },
  { month: "Jun", completed: 12, active: 4, draft: 1 },
];

export default function SuperAdminCharts() {
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["super_admin_attendance"],
    queryFn: async () => {
      const res = await fetch("/api/analytics?type=attendance-trend");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return data.map((d: any) => ({
        month: monthNames[(d._id || 1) - 1],
        sgt: d.sgt || 0,
        krp: d.krp || 0,
        drp: d.drp || 0,
        meo: d.meo || 0,
      }));
    }
  });

  const { data: districtData, isLoading: isLoadingDistrict } = useQuery({
    queryKey: ["super_admin_district"],
    queryFn: async () => {
      const res = await fetch("/api/analytics?type=district-participation");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      return data.map((d: any) => ({
        district: d.name,
        participants: d.total || 0
      }));
    }
  });

  const { data: categoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ["super_admin_category"],
    queryFn: async () => {
      const res = await fetch("/api/analytics?type=category-distribution");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#94a3b8", "#ec4899", "#14b8a6"];
      return data.map((d: any, idx: number) => ({
        name: d._id || "Unknown",
        value: d.count || 0,
        color: colors[idx % colors.length]
      }));
    }
  });

  const { data: programData, isLoading: isLoadingProgram } = useQuery({
    queryKey: ["super_admin_programs"],
    queryFn: async () => {
      const res = await fetch("/api/analytics?type=program-status");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const isLoading = isLoadingAttendance || isLoadingDistrict || isLoadingCategory || isLoadingProgram;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );
  }

  const attendanceFinal = attendanceData && attendanceData.length > 0 ? attendanceData : ATTENDANCE_DATA;
  const districtFinal = districtData && districtData.length > 0 ? districtData : DISTRICT_DATA;
  const categoryFinal = categoryData && categoryData.length > 0 ? categoryData : PIE_DATA;
  const programFinal = programData && programData.length > 0 ? programData : PROGRAM_DATA;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">Attendance Trends (Monthly)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={attendanceFinal} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="sgt" stroke="#3b82f6" strokeWidth={2} dot={false} name="SGT" />
              <Line type="monotone" dataKey="krp" stroke="#8b5cf6" strokeWidth={2} dot={false} name="KRP" />
              <Line type="monotone" dataKey="drp" stroke="#10b981" strokeWidth={2} dot={false} name="DRP" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">District-wise Participation</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={districtFinal} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="district" type="category" tick={{ fontSize: 11 }} width={70} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} />
              <Bar dataKey="participants" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Participants" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">Participant Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryFinal} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {categoryFinal.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">Program Status (Monthly)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={programFinal} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
              <Bar dataKey="active" stackId="a" fill="#3b82f6" name="Active" />
              <Bar dataKey="draft" stackId="a" fill="#94a3b8" name="Draft" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
