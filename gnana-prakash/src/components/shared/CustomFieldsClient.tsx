"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Search, Edit2, Trash2, Loader2, Calendar, Target, 
  Users, CheckCircle, AlertTriangle, TrendingUp, Info, ChevronRight, X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/lib/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface AttendanceRecord {
  _id: string;
  title: string;
  target: number;
  attended: number;
  date: string;
  createdAt: string;
}

export default function CustomFieldsClient() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formAttended, setFormAttended] = useState("");
  const [formDate, setFormDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/custom-session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(console.error);
  }, []);

  const canWrite = currentUser && ["SUPER_ADMIN", "STATE_ADMIN"].includes(currentUser.role);

  // Fetch target attendance records
  const { data: records = [], isLoading, error } = useQuery<AttendanceRecord[]>({
    queryKey: ["target_attendance_list"],
    queryFn: async () => {
      const res = await fetch("/api/target-attendance");
      if (!res.ok) throw new Error("Failed to load records");
      return res.json();
    }
  });

  // Fetch programs list for target attendance drop-down
  const { data: programsData } = useQuery({
    queryKey: ["all_programs_list"],
    queryFn: async () => {
      const res = await fetch("/api/programs?limit=1000&bypassScope=true");
      if (!res.ok) throw new Error("Failed to load programs");
      return res.json();
    }
  });
  const programsList = (programsData as any)?.data || [];

  // Create record mutation
  const createMutation = useMutation({
    mutationFn: async (newRecord: Omit<AttendanceRecord, "_id" | "createdAt">) => {
      const res = await fetch("/api/target-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create record");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target_attendance_list"] });
      toast({ title: "Record Created", description: "Target attendance record has been added successfully.", variant: "success" });
      closeModal();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create target attendance record.", variant: "destructive" });
    }
  });

  // Update record mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedRecord: AttendanceRecord) => {
      const res = await fetch(`/api/target-attendance/${updatedRecord._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updatedRecord.title,
          target: updatedRecord.target,
          attended: updatedRecord.attended,
          date: updatedRecord.date,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update record");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target_attendance_list"] });
      toast({ title: "Record Updated", description: "Target attendance record has been updated successfully.", variant: "success" });
      closeModal();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update target attendance record.", variant: "destructive" });
    }
  });

  // Delete record mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/target-attendance/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete record");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target_attendance_list"] });
      toast({ title: "Record Deleted", description: "Target attendance record has been deleted successfully.", variant: "success" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete target attendance record.", variant: "destructive" });
    }
  });

  const openAddModal = () => {
    setEditingRecord(null);
    setFormTitle("");
    setFormTarget("");
    setFormAttended("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setFormTitle(record.title);
    setFormTarget(record.target.toString());
    setFormAttended(record.attended.toString());
    setFormDate(record.date ? new Date(record.date).toISOString().split("T")[0] : "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formTarget || !formAttended || !formDate) {
      toast({ title: "Validation Error", description: "Please fill in all the required fields.", variant: "destructive" });
      return;
    }

    const targetNum = parseInt(formTarget, 10);
    const attendedNum = parseInt(formAttended, 10);

    if (isNaN(targetNum) || targetNum < 0 || isNaN(attendedNum) || attendedNum < 0) {
      toast({ title: "Validation Error", description: "Target and Attended values must be non-negative numbers.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRecord) {
        await updateMutation.mutateAsync({
          ...editingRecord,
          title: formTitle,
          target: targetNum,
          attended: attendedNum,
          date: new Date(formDate).toISOString(),
        });
      } else {
        await createMutation.mutateAsync({
          title: formTitle,
          target: targetNum,
          attended: attendedNum,
          date: new Date(formDate).toISOString(),
        });
      }
    } catch {
      // Handled by react-query
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this target attendance record?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  // Filter records
  const filteredRecords = records.filter(record => 
    record.title.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate stats
  const totalTarget = records.reduce((sum, r) => sum + r.target, 0);
  const totalAttended = records.reduce((sum, r) => sum + r.attended, 0);
  const globalRate = totalTarget > 0 ? (totalAttended / totalTarget) * 100 : 0;
  const globalGap = totalTarget - totalAttended;

  // Find highest performing training session
  let topPerformerTitle = "No data yet";
  let topPerformerRate = 0;
  if (records.length > 0) {
    const sortedByRate = [...records]
      .map(r => ({
        title: r.title,
        rate: r.target > 0 ? (r.attended / r.target) * 100 : 0
      }))
      .sort((a, b) => b.rate - a.rate);
    if (sortedByRate[0]) {
      topPerformerTitle = sortedByRate[0].title;
      topPerformerRate = sortedByRate[0].rate;
    }
  }

  // Creative classification/tiering based on attendance rates
  const getTierInfo = (rate: number) => {
    if (rate >= 95) {
      return {
        label: "Elite Performance 🌟",
        description: "Outstanding attendance rate! The training programs are executing with maximum attendance alignment.",
        gradient: "from-amber-500 via-yellow-400 to-amber-600",
        bg: "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/30",
        text: "text-amber-800 dark:text-amber-300"
      };
    }
    if (rate >= 85) {
      return {
        label: "Highly Successful 📈",
        description: "Strong attendance results. The majority of planned participants have successfully attended.",
        gradient: "from-brand-600 via-violet-500 to-indigo-600",
        bg: "bg-brand-50/50 dark:bg-brand-950/10 border-brand-200 dark:border-brand-900/30",
        text: "text-brand-800 dark:text-brand-300"
      };
    }
    if (rate >= 70) {
      return {
        label: "Satisfactory Level 📊",
        description: "Decent participation rate. Consider scheduling quick follow-ups to cover the remaining gaps.",
        gradient: "from-emerald-500 via-teal-400 to-emerald-600",
        bg: "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30",
        text: "text-emerald-800 dark:text-emerald-300"
      };
    }
    return {
      label: "Action Needed ⚠️",
      description: "Low attendance rate detected. Recommend adjusting training timings or coordinating with local officers.",
      gradient: "from-rose-600 to-red-500",
      bg: "bg-rose-50/50 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/30",
      text: "text-rose-800 dark:text-rose-300"
    };
  };

  const tier = getTierInfo(globalRate);

  // Record-specific status badge
  const getRecordStatus = (attended: number, target: number) => {
    const pct = target > 0 ? (attended / target) * 100 : 0;
    if (pct >= 95) return { text: "Target Met ✅", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200" };
    if (pct >= 80) return { text: "On Track 📈", color: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200" };
    if (pct >= 60) return { text: "Needs Focus ⚠️", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200" };
    return { text: "Critical Gap 🚨", color: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200" };
  };

  // Recharts structured data
  const chartData = [...filteredRecords].reverse().map(record => ({
    name: record.title.length > 18 ? record.title.slice(0, 15) + "..." : record.title,
    Target: record.target,
    Attended: record.attended,
    Percentage: record.target > 0 ? Math.round((record.attended / record.target) * 100) : 0,
  }));

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading Target Attendance analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-rose-200 bg-rose-50/50 p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <CardTitle className="text-rose-800">Connection Failure</CardTitle>
        <CardDescription className="text-rose-600 mt-1">We couldn't connect to the database to pull target attendance configurations.</CardDescription>
        <Button className="mt-4" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["target_attendance_list"] })}>
          Retry Connection
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards & Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Core Stats Card */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 text-brand-500/10 group-hover:scale-110 transition-transform">
              <Target className="w-20 h-20" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider">Total Target</CardDescription>
              <CardTitle className="text-3xl font-black text-brand-900 dark:text-brand-100">{totalTarget.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Cumulative target capacity</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 text-violet-500/10 group-hover:scale-110 transition-transform">
              <Users className="w-20 h-20" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider">Total Attended</CardDescription>
              <CardTitle className="text-3xl font-black text-violet-900 dark:text-violet-100">{totalAttended.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Cumulative actual presence</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 text-emerald-500/10 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-20 h-20" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider">Top Performer</CardDescription>
              <CardTitle className="text-3xl font-black text-emerald-950 dark:text-emerald-100">
                {topPerformerRate > 0 ? `${topPerformerRate.toFixed(1)}%` : "N/A"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground truncate" title={topPerformerTitle}>
                {topPerformerTitle}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 text-rose-500/10 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-20 h-20" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider">Attendance Gap</CardDescription>
              <CardTitle className="text-3xl font-black text-rose-950 dark:text-rose-100">{globalGap > 0 ? `-${globalGap.toLocaleString()}` : "0"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{globalGap > 0 ? "Absent teachers to cover" : "All targets fully met"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Circular Progress Gauge / Creative Widget */}
        <Card className={`relative border ${tier.bg} transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm`}>
          <div className="absolute -left-12 -bottom-12 w-36 h-36 rounded-full bg-gradient-to-tr from-brand-500/5 to-transparent blur-2xl pointer-events-none" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Level</CardDescription>
            <CardTitle className={`text-base font-extrabold ${tier.text}`}>{tier.label}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xs leading-relaxed text-muted-foreground mt-1">
              {tier.description}
            </p>
            {/* Visual Mini Progress Bar */}
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-muted-foreground">Achievement Status</span>
                <span className={tier.text}>{globalRate.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border">
                <div className={`h-full rounded-full bg-gradient-to-r ${tier.gradient}`} style={{ width: `${Math.min(globalRate, 100)}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Panel */}
      {records.length > 0 ? (
        <Card className="shadow-sm border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Target vs Attended Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "12px", 
                    border: "1px solid hsl(var(--border))", 
                    background: "rgba(255, 255, 255, 0.95)", 
                    color: "#000",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
                  }} 
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                <Bar dataKey="Target" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Target Attendance" />
                <Bar dataKey="Attended" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Actual Attended" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 py-12 flex flex-col items-center justify-center text-center">
          <Target className="w-12 h-12 text-slate-300 mb-2 animate-bounce" />
          <h3 className="font-bold text-slate-700">No Target Data Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">No target attendance records have been registered. Add your first training target above to populate the visual analytics reports.</p>
        </Card>
      )}

      {/* List Grid / Search */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold">Target Attendance Records</CardTitle>
              <CardDescription className="text-xs">Manage individual program capacity parameters</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search workshops..." 
                  className="pl-9 h-9 w-full sm:w-56 text-sm" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
              </div>
              {canWrite && (
                <Button size="sm" className="gap-2 shrink-0 bg-brand-600 hover:bg-brand-700 text-white font-bold" onClick={openAddModal}>
                  <Plus className="w-4 h-4" /> Add Record
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 dark:bg-slate-900/30 text-slate-500 font-semibold text-xs tracking-wider uppercase">
                  <th className="py-3 px-4">Event Title</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4 text-right">Target</th>
                  <th className="py-3 px-4 text-right">Attended</th>
                  <th className="py-3 px-4 text-right">Achievement</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {canWrite && <th className="py-3 px-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => {
                    const pct = record.target > 0 ? (record.attended / record.target) * 100 : 0;
                    const status = getRecordStatus(record.attended, record.target);

                    return (
                      <tr key={record._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group">
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{record.title}</td>
                        <td className="py-3.5 px-4 text-slate-500">
                          <span className="flex items-center gap-1.5 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(record.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-400">{record.target.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-400">{record.attended.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex flex-col items-end">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{pct.toFixed(0)}%</span>
                            <div className="w-16 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                        {canWrite && (
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center justify-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                              <Button size="icon" variant="ghost" className="w-7 h-7 text-slate-500 hover:text-brand-600" onClick={() => openEditModal(record)}>
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="w-7 h-7 text-slate-500 hover:text-rose-600" onClick={() => handleDelete(record._id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={canWrite ? 7 : 6} className="py-10 text-center text-muted-foreground text-sm">
                      No records matched your search parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Slide-over/Dialog modal for Add/Edit */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingRecord ? "Edit Record" : "Add Target Attendance"}</DialogTitle>
              <DialogDescription>
                Provide target attendance projections and actual numbers to dynamically calculate report logs.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-500">Workshop / Event Title</Label>
                <select
                  id="title"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a program...</option>
                  {Array.from(new Set(programsList.map((prog: any) => prog.programName))).map((programName) => (
                    <option key={String(programName)} value={String(programName)}>
                      {String(programName)}
                    </option>
                  ))}
                  {/* Fallback option if editing an entry with a custom title not in the programs list */}
                  {formTitle && !programsList.some((p: any) => p.programName === formTitle) && (
                    <option value={formTitle}>{formTitle}</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="target" className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Attendance</Label>
                  <Input 
                    id="target" 
                    type="number" 
                    min="0"
                    placeholder="e.g. 350" 
                    value={formTarget} 
                    onChange={e => setFormTarget(e.target.value)} 
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="attended" className="text-xs font-bold uppercase tracking-wider text-slate-500">Actual Attended</Label>
                  <Input 
                    id="attended" 
                    type="number" 
                    min="0"
                    placeholder="e.g. 320" 
                    value={formAttended} 
                    onChange={e => setFormAttended(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-slate-500">Event Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={formDate} 
                  onChange={e => setFormDate(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-bold" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
