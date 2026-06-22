"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const MONTHLY_ATTENDANCE = [
  { month: "Jan", total: 420, sgt: 180, krp: 80, drp: 60, others: 100 },
  { month: "Feb", total: 560, sgt: 240, krp: 100, drp: 80, others: 140 },
  { month: "Mar", total: 680, sgt: 290, krp: 120, drp: 100, others: 170 },
  { month: "Apr", total: 520, sgt: 220, krp: 90, drp: 75, others: 135 },
  { month: "May", total: 750, sgt: 320, krp: 130, drp: 110, others: 190 },
  { month: "Jun", total: 820, sgt: 360, krp: 150, drp: 120, others: 190 },
  { month: "Jul", total: 920, sgt: 400, krp: 170, drp: 140, others: 210 },
  { month: "Aug", total: 880, sgt: 380, krp: 160, drp: 130, others: 210 },
  { month: "Sep", total: 760, sgt: 330, krp: 140, drp: 115, others: 175 },
];

const DISTRICT_DATA = [
  { name: "Krishna", teachers: 380, trainers: 80, staff: 40 },
  { name: "Guntur", teachers: 320, trainers: 70, staff: 35 },
  { name: "West G.", teachers: 280, trainers: 60, staff: 30 },
  { name: "East G.", teachers: 250, trainers: 55, staff: 28 },
  { name: "Kurnool", teachers: 220, trainers: 48, staff: 25 },
  { name: "Kadapa", teachers: 190, trainers: 42, staff: 22 },
  { name: "Prakasam", teachers: 170, trainers: 38, staff: 20 },
];

const VENUE_UTILIZATION = [
  { venue: "DIET Vijayawada", programs: 12, occupancy: 85 },
  { venue: "DIET Guntur", programs: 10, occupancy: 78 },
  { venue: "DIET Rajahmundry", programs: 9, occupancy: 72 },
  { venue: "DIET Kurnool", programs: 7, occupancy: 65 },
  { venue: "DIET Tirupati", programs: 8, occupancy: 70 },
];

const FOOD_DATA = [
  { month: "Jan", breakfast: 380, lunch: 380, dinner: 320 },
  { month: "Feb", breakfast: 500, lunch: 500, dinner: 420 },
  { month: "Mar", breakfast: 620, lunch: 620, dinner: 540 },
  { month: "Apr", breakfast: 480, lunch: 480, dinner: 400 },
  { month: "May", breakfast: 700, lunch: 700, dinner: 620 },
  { month: "Jun", breakfast: 780, lunch: 780, dinner: 700 },
];

const CATEGORY_PIE = [
  { name: "SGT", value: 35, color: "#3b82f6" },
  { name: "KRP", value: 18, color: "#8b5cf6" },
  { name: "DRP", value: 14, color: "#10b981" },
  { name: "HM", value: 12, color: "#f59e0b" },
  { name: "MEO", value: 8, color: "#f43f5e" },
  { name: "Others", value: 13, color: "#94a3b8" },
];

const TOOLTIP_STYLE = { borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: "12px" };

export default function AnalyticsClient() {
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["analytics_attendance"],
    queryFn: async () => {
      const res = await fetch("/api/analytics?type=attendance-trend");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return data.map((d: any) => ({
        month: monthNames[(d._id || 1) - 1],
        total: d.total || 0,
        sgt: d.sgt || 0,
        krp: d.krp || 0,
        drp: d.drp || 0,
        others: d.others || 0
      }));
    }
  });

  const { data: districtData, isLoading: isLoadingDistrict } = useQuery({
    queryKey: ["analytics_district"],
    queryFn: async () => {
      const res = await fetch("/api/analytics?type=district-participation");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const { data: categoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ["analytics_category"],
    queryFn: async () => {
      const res = await fetch("/api/analytics?type=category-distribution");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#94a3b8", "#ec4899", "#14b8a6"];
      const totalCount = data.reduce((sum: number, d: any) => sum + (d.count || 0), 0);
      return data.map((d: any, idx: number) => ({
        name: d._id || "Unknown",
        value: totalCount > 0 ? Math.round(((d.count || 0) / totalCount) * 100) : 0,
        color: colors[idx % colors.length]
      }));
    }
  });

  const { data: venueData, isLoading: isLoadingVenue } = useQuery({
    queryKey: ["analytics_venue"],
    queryFn: async () => {
      const res = await fetch("/api/analytics?type=venue-utilization");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const { data: foodData, isLoading: isLoadingFood } = useQuery({
    queryKey: ["analytics_food"],
    queryFn: async () => {
      const res = await fetch("/api/analytics?type=food-trends");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return data.map((d: any) => ({
        month: monthNames[(d._id || 1) - 1],
        breakfast: d.breakfast || 0,
        lunch: d.lunch || 0,
        dinner: d.dinner || 0
      }));
    }
  });

  const isLoading = isLoadingAttendance || isLoadingDistrict || isLoadingCategory || isLoadingVenue || isLoadingFood;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const attendanceDataFinal = attendanceData && attendanceData.length > 0 ? attendanceData : MONTHLY_ATTENDANCE;
  const districtDataFinal = districtData && districtData.length > 0 ? districtData : DISTRICT_DATA;
  const categoryDataFinal = categoryData && categoryData.length > 0 ? categoryData : CATEGORY_PIE;
  const venueDataFinal = venueData && venueData.length > 0 ? venueData : VENUE_UTILIZATION;
  const foodDataFinal = foodData && foodData.length > 0 ? foodData : FOOD_DATA;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="attendance">
        <TabsList className="mb-4">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="district">District-wise</TabsTrigger>
          <TabsTrigger value="venue">Venue</TabsTrigger>
          <TabsTrigger value="food">Food</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-semibold">Monthly Attendance Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={attendanceDataFinal} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                    <defs>
                      <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fill="url(#totalGrad)" name="Total" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-semibold">Category-wise Attendance</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={attendanceDataFinal} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="sgt" stackId="a" fill="#3b82f6" name="SGT" />
                    <Bar dataKey="krp" stackId="a" fill="#8b5cf6" name="KRP" />
                    <Bar dataKey="drp" stackId="a" fill="#10b981" name="DRP" />
                    <Bar dataKey="others" stackId="a" fill="#94a3b8" name="Others" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-semibold">Participant Category Distribution</CardTitle></CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-6">
              <PieChart width={220} height={220}>
                <Pie data={categoryDataFinal} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {categoryDataFinal.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                {categoryDataFinal.map((e: any) => (
                  <div key={e.name} className="flex items-center gap-2 p-3 rounded-xl border">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: e.color }} />
                    <div>
                      <p className="text-sm font-semibold">{e.name}</p>
                      <p className="text-xs text-muted-foreground">{e.value}% of total</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="district">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-semibold">District-wise Participation</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={districtDataFinal} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="teachers" fill="#3b82f6" name="Teachers" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="trainers" fill="#8b5cf6" name="Trainers" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="staff" fill="#10b981" name="Staff" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="venue">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-semibold">Venue Utilization</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {venueDataFinal.map((v: any) => (
                  <div key={v.venue} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{v.venue}</span>
                      <span className="text-muted-foreground">{v.programs} programs Â· {v.occupancy}% occupancy</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${v.occupancy}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="food">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-semibold">Food Consumption Trends</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={foodDataFinal} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="breakfast" stroke="#f59e0b" strokeWidth={2} dot={false} name="Breakfast" />
                  <Line type="monotone" dataKey="lunch" stroke="#3b82f6" strokeWidth={2} dot={false} name="Lunch" />
                  <Line type="monotone" dataKey="dinner" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Dinner" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
