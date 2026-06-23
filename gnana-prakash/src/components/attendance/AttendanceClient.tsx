"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardList, Loader2, Plus, Save, Check, X, Calendar, 
  UserCheck, Users, Percent, FileText, CheckSquare, Square, Printer, UserPlus, Trash2
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";

const PARTICIPANT_ROLES = [
  { value: "SGT", label: "SGT" },
  { value: "KRP", label: "KRP" },
  { value: "DRP", label: "DRP" },
  { value: "DEO_STAFF", label: "DEO Staff" },
  { value: "SS_OFFICE_STAFF", label: "SS Staff" },
  { value: "MEO", label: "MEO" },
  { value: "HM", label: "HM" },
  { value: "CRP", label: "CRP" },
];

export default function AttendanceClient() {
  const [programId, setProgramId] = useState("");
  
  // Local state to track modifications before saving to DB
  // Key: `${participantId}_${dayNumber}`, Value: "PRESENT" | "ABSENT"
  const [localAttendance, setLocalAttendance] = useState<Record<string, "PRESENT" | "ABSENT">>({});
  
  // Register inline participant form
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    name: "",
    employeeId: "",
    mobile: "",
    category: "SGT",
  });
  const [addError, setAddError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const qc = useQueryClient();

  // 1. Fetch programs list
  const { data: programsData, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ["programs_list"],
    queryFn: async () => {
      const res = await fetch("/api/programs?limit=100");
      return res.json();
    }
  });

  const selectedProgram = programsData?.data?.find((p: any) => p._id === programId);

  // 2. Fetch detailed attendance grid
  const { data: detailedData, isLoading: isLoadingDetailed } = useQuery({
    queryKey: ["attendance_detailed", programId],
    queryFn: async () => {
      if (!programId) return null;
      const res = await fetch(`/api/attendance/participants?program=${programId}`);
      if (!res.ok) throw new Error("Failed to fetch detailed attendance");
      return res.json();
    },
    enabled: !!programId,
  });

  // Sync database logs with local modifications when data is fetched/refetched
  useEffect(() => {
    if (detailedData?.participants) {
      const initialMap: Record<string, "PRESENT" | "ABSENT"> = {};
      detailedData.participants.forEach((p: any) => {
        // Sync days 1 to N
        const daysCount = selectedProgram?.totalDays || 6;
        for (let d = 1; d <= daysCount; d++) {
          initialMap[`${p._id}_${d}`] = p.history[d] || "ABSENT";
        }
      });
      setLocalAttendance(initialMap);
    }
  }, [detailedData, selectedProgram]);

  // Toggle checklist checkbox
  const toggleAttendanceCell = (participantId: string, dayNum: number) => {
    const key = `${participantId}_${dayNum}`;
    setLocalAttendance(prev => ({
      ...prev,
      [key]: prev[key] === "PRESENT" ? "ABSENT" : "PRESENT"
    }));
  };

  // Check/Uncheck all for a specific day
  const setAllStatusForDay = (dayNum: number, status: "PRESENT" | "ABSENT") => {
    if (!detailedData?.participants) return;
    const update: Record<string, "PRESENT" | "ABSENT"> = {};
    detailedData.participants.forEach((p: any) => {
      update[`${p._id}_${dayNum}`] = status;
    });
    setLocalAttendance(prev => ({
      ...prev,
      ...update
    }));
  };

  // Change role of participant inline
  const updateParticipantRole = async (participantId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/participants/${participantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newRole })
      });
      if (!res.ok) throw new Error("Failed to update role");
      
      // Update role locally in React query cache to avoid flash
      qc.invalidateQueries({ queryKey: ["attendance_detailed", programId] });
      toast({ title: "Role Updated", description: `Participant category updated to ${newRole}.`, variant: "success" });
    } catch (err: any) {
      toast({ title: "Role Update Failed", description: err.message || "Error updating role.", variant: "destructive" });
    }
  };

  // Delete participant
  const handleDeleteParticipant = async (participantId: string) => {
    if (!confirm("Are you sure you want to remove this participant from the program?")) return;
    try {
      const res = await fetch(`/api/participants/${participantId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete participant");
      qc.invalidateQueries({ queryKey: ["attendance_detailed", programId] });
      toast({ title: "Participant Removed", description: "Successfully removed participant from the program.", variant: "success" });
    } catch (err: any) {
      toast({ title: "Deletion Failed", description: err.message || "Error deleting participant.", variant: "destructive" });
    }
  };

  // Add Participant Form Submit
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipant.name || !newParticipant.employeeId || !newParticipant.mobile) {
      setAddError("All fields are required.");
      return;
    }
    setAddError("");
    setIsAdding(true);

    try {
      const payload = {
        name: newParticipant.name,
        employeeId: newParticipant.employeeId,
        mobile: newParticipant.mobile,
        category: newParticipant.category,
        designation: newParticipant.category === "SGT" ? "SGT Teacher" : newParticipant.category,
        program: programId,
        district: Array.isArray(selectedProgram?.district)
          ? (typeof selectedProgram.district[0] === "object" ? selectedProgram.district[0]?._id : selectedProgram.district[0])
          : (selectedProgram?.district?._id || selectedProgram?.district),
        mandal: Array.isArray(selectedProgram?.mandal)
          ? (typeof selectedProgram.mandal[0] === "object" ? selectedProgram.mandal[0]?._id : selectedProgram.mandal[0])
          : (selectedProgram?.mandal?._id || selectedProgram?.mandal),
        schoolName: "Training Venue School",
        isResidential: false
      };

      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create participant");
      }

      setNewParticipant({ name: "", employeeId: "", mobile: "", category: "SGT" });
      setShowAddParticipant(false);
      qc.invalidateQueries({ queryKey: ["attendance_detailed", programId] });
    } catch (err: any) {
      setAddError(err.message || "Network error. Try again.");
    } finally {
      setIsAdding(false);
    }
  };

  // Save the entire attendance sheet modification matrix
  const saveAllAttendanceMutation = useMutation({
    mutationFn: async () => {
      const totalDays = selectedProgram?.totalDays || 6;
      
      // Build batch updates
      const updatesPayload: any[] = [];
      detailedData.participants.forEach((p: any) => {
        for (let day = 1; day <= totalDays; day++) {
          const status = localAttendance[`${p._id}_${day}`] || "ABSENT";
          
          // Generate date for this day
          const dateObj = new Date(selectedProgram.startDate);
          dateObj.setDate(dateObj.getDate() + (day - 1));

          updatesPayload.push({
            participantId: p._id,
            dayNumber: day,
            date: dateObj.toISOString(),
            status
          });
        }
      });

      const res = await fetch("/api/attendance/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          updates: updatesPayload
        })
      });

      if (!res.ok) throw new Error("Failed to save batch attendance");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance_detailed", programId] });
      toast({ title: "Attendance Saved", description: "Manual attendance matrix saved and synchronized successfully!", variant: "success" });
    },
    onError: (err: any) => {
      console.error(err);
      toast({ title: "Save Failed", description: err.message || "Error saving attendance matrix.", variant: "destructive" });
    }
  });

  // Calculate local live counts for the PDF preview (computed on-the-fly from checkboxes)
  const getLocalCountsForDay = (dayNum: number) => {
    let sgt = 0, krp = 0, drp = 0, deoStaff = 0, ssStaff = 0, meo = 0, hm = 0, crp = 0;
    
    if (detailedData?.participants) {
      detailedData.participants.forEach((p: any) => {
        const isPresent = localAttendance[`${p._id}_${dayNum}`] === "PRESENT";
        if (isPresent) {
          const cat = p.category;
          if (cat === "SGT") sgt++;
          else if (cat === "KRP") krp++;
          else if (cat === "DRP") drp++;
          else if (cat === "DEO_STAFF") deoStaff++;
          else if (cat === "SS_OFFICE_STAFF") ssStaff++;
          else if (cat === "MEO") meo++;
          else if (cat === "HM") hm++;
          else if (cat === "CRP") crp++;
        }
      });
    }
    const total = sgt + krp + drp + deoStaff + ssStaff + meo + hm + crp;
    return { sgt, krp, drp, deoStaff, ssStaff, meo, hm, crp, total };
  };

  const getGrandTotals = () => {
    let sgtTotal = 0, krpTotal = 0, drpTotal = 0, deoTotal = 0, ssTotal = 0, meoTotal = 0, hmTotal = 0, crpTotal = 0, grandTotal = 0;
    const totalDays = selectedProgram?.totalDays || 6;
    for (let day = 1; day <= totalDays; day++) {
      const counts = getLocalCountsForDay(day);
      sgtTotal += counts.sgt;
      krpTotal += counts.krp;
      drpTotal += counts.drp;
      deoTotal += counts.deoStaff;
      ssTotal += counts.ssStaff;
      meoTotal += counts.meo;
      hmTotal += counts.hm;
      crpTotal += counts.crp;
      grandTotal += counts.total;
    }
    return { sgtTotal, krpTotal, drpTotal, deoTotal, ssTotal, meoTotal, hmTotal, crpTotal, grandTotal };
  };

  const grand = getGrandTotals();

  // Helper to format days range
  const getDayDateLabel = (dayIdx: number) => {
    if (!selectedProgram) return "â€”";
    const baseDate = new Date(selectedProgram.startDate);
    baseDate.setDate(baseDate.getDate() + dayIdx);
    return baseDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit"
    }) + " | " + baseDate.toLocaleDateString("en-US", { weekday: "short" });
  };

  const totalDays = selectedProgram?.totalDays || 6;

  return (
    <div className="space-y-8">
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #official-sheet, #official-sheet * {
            visibility: visible;
          }
          #official-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: 2px solid black !important;
            padding: 15px !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Program Selector */}
      <Card className="border-slate-100 shadow-sm no-print">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Training Program Roll Call</CardTitle>
              <CardDescription>Select a program to take name-based student attendance and view aggregate summaries</CardDescription>
            </div>
            <select className="flex h-10 w-full sm:w-80 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              disabled={isLoadingPrograms}
            >
              <option value="">-- Select a Program --</option>
              {programsData?.data?.map((p: any) => (
                <option key={p._id} value={p._id}>
                  {p.programName}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
      </Card>

      {!programId ? (
        <div className="flex flex-col items-center justify-center h-72 border border-dashed rounded-3xl bg-white text-muted-foreground p-6 no-print">
          <ClipboardList className="w-12 h-12 mb-3 opacity-20 text-brand-600" />
          <p className="font-semibold text-slate-700">No Program Selected</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
            Choose a training program from the selection box to manage the registered student checklist, mark attendance, and preview report percentages.
          </p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* 1. INDIVIDUAL STUDENT CHECKLIST AND ATTENDANCE MARKING */}
          <Card className="border-slate-100 shadow-sm no-print">
            <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 bg-slate-50/50">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-600" />
                  Participant Attendance Matrix (Name-based Roll Call)
                </CardTitle>
                <CardDescription>
                  Update categories/roles and check day attendance boxes. Remember to click **Save & Sync Matrix** at the bottom to store updates.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowAddParticipant(!showAddParticipant)}
                  className="gap-1.5 font-semibold text-slate-700 border-slate-200"
                >
                  <UserPlus className="w-4 h-4 text-brand-600" /> Add Participant
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              {/* Add Participant Form */}
              {showAddParticipant && (
                <form onSubmit={handleAddParticipant} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Register & Enroll Participant</h3>
                  {addError && <p className="text-xs text-rose-600 font-semibold">{addError}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Full Name *</Label>
                      <Input 
                        placeholder="Name" 
                        className="h-9 text-xs" 
                        value={newParticipant.name}
                        onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Employee ID *</Label>
                      <Input 
                        placeholder="EMP000" 
                        className="h-9 text-xs" 
                        value={newParticipant.employeeId}
                        onChange={(e) => setNewParticipant(prev => ({ ...prev, employeeId: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Mobile *</Label>
                      <Input 
                        placeholder="10 digit mobile" 
                        className="h-9 text-xs" 
                        value={newParticipant.mobile}
                        onChange={(e) => setNewParticipant(prev => ({ ...prev, mobile: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Category / Role *</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-background dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-1 text-xs shadow-sm focus-visible:outline-none"
                        value={newParticipant.category}
                        onChange={(e) => setNewParticipant(prev => ({ ...prev, category: e.target.value }))}
                      >
                        {PARTICIPANT_ROLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddParticipant(false)}>Cancel</Button>
                    <Button type="submit" size="sm" disabled={isAdding} className="bg-brand-600 hover:bg-brand-700 text-white font-semibold">
                      {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add to Sheet
                    </Button>
                  </div>
                </form>
              )}

              {/* Matrix Table */}
              {isLoadingDetailed ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
              ) : !detailedData?.participants?.length ? (
                <div className="text-center py-10 text-muted-foreground bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Users className="w-8 h-8 mx-auto opacity-10 mb-2" />
                  <p className="font-semibold text-slate-700">No Participants Registered</p>
                  <p className="text-xs text-slate-500 mt-0.5">Please add participants to take daily roll call.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-inner">
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                      <TableRow>
                        <TableHead className="w-12 text-center">S.No</TableHead>
                        <TableHead className="min-w-44">Name / ID</TableHead>
                        <TableHead className="w-40">Category / Role</TableHead>
                        {Array.from({ length: totalDays }).map((_, idx) => (
                          <TableHead key={idx} className="text-center w-24 border-l border-slate-200">
                            <div>
                              <p className="font-bold">Day {idx + 1}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{getDayDateLabel(idx)}</p>
                              <div className="flex justify-center gap-1 mt-1">
                                <button 
                                  title="Mark all present for this day"
                                  onClick={() => setAllStatusForDay(idx + 1, "PRESENT")}
                                  className="text-[9px] px-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded font-extrabold"
                                >
                                  âœ” All
                                </button>
                                <button 
                                  title="Mark all absent for this day"
                                  onClick={() => setAllStatusForDay(idx + 1, "ABSENT")}
                                  className="text-[9px] px-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded font-extrabold"
                                >
                                  âœ– All
                                </button>
                              </div>
                            </div>
                          </TableHead>
                        ))}
                        <th className="text-center w-16 border-l border-slate-200 font-bold p-3 text-slate-700">Total</th>
                        <th className="text-center w-16 border-l border-slate-200 font-bold p-3 text-slate-700">%</th>
                        <th className="w-12 text-center border-l border-slate-200"></th>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailedData.participants.map((p: any, idx: number) => {
                        // Compute local stats on-the-fly
                        let presentCount = 0;
                        for (let d = 1; d <= totalDays; d++) {
                          if (localAttendance[`${p._id}_${d}`] === "PRESENT") {
                            presentCount++;
                          }
                        }
                        const attendancePct = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

                        return (
                          <TableRow key={p._id} className="hover:bg-slate-50/30">
                            <TableCell className="text-center font-bold text-slate-500">{idx + 1}</TableCell>
                            <TableCell className="py-2.5">
                              <div>
                                <p className="font-semibold text-slate-800 text-sm leading-snug">{p.name}</p>
                                <p className="text-[10px] text-brand-600 font-mono font-bold leading-none mt-0.5">{p.employeeId}</p>
                              </div>
                            </TableCell>
                            <TableCell className="py-2">
                              <select className="flex h-8 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-0.5 text-xs focus:outline-none"
                                value={p.category}
                                onChange={(e) => updateParticipantRole(p._id, e.target.value)}
                              >
                                {PARTICIPANT_ROLES.map(r => (
                                  <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                              </select>
                            </TableCell>
                            
                            {/* Checkbox daily cells */}
                            {Array.from({ length: totalDays }).map((_, dIdx) => {
                              const dayNum = dIdx + 1;
                              const isChecked = localAttendance[`${p._id}_${dayNum}`] === "PRESENT";
                              
                              return (
                                <TableCell 
                                  key={dIdx} 
                                  onClick={() => toggleAttendanceCell(p._id, dayNum)}
                                  className={`text-center border-l border-slate-150 cursor-pointer select-none transition-colors ${
                                    isChecked ? "bg-emerald-50/30 hover:bg-emerald-50/60" : "bg-rose-50/20 hover:bg-rose-50/40"
                                  }`}
                                >
                                  <div className="flex items-center justify-center">
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}} // Controlled by cell click
                                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                                    />
                                  </div>
                                </TableCell>
                              );
                            })}

                            {/* Stats */}
                            <td className="text-center border-l border-slate-200 font-bold bg-slate-50/50 p-2 text-slate-800">
                              {presentCount}
                            </td>
                            <td className={`text-center border-l border-slate-200 font-extrabold p-2 ${
                              attendancePct >= 75 ? "text-emerald-700 bg-emerald-50/10" : "text-rose-600 bg-rose-50/10"
                            }`}>
                              {attendancePct}%
                            </td>

                            <TableCell className="text-center border-l border-slate-200 py-1">
                              <button 
                                onClick={() => handleDeleteParticipant(p._id)}
                                className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                title="Remove participant"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Action buttons */}
              {detailedData?.participants?.length > 0 && (
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    onClick={() => saveAllAttendanceMutation.mutate()}
                    disabled={saveAllAttendanceMutation.isPending}
                    className="gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 shadow-sm h-10"
                  >
                    {saveAllAttendanceMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save & Sync Attendance Grid
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. OFFICIAL SUMMARY SHEET PREVIEW */}
          <div className="no-print flex justify-between items-center max-w-5xl mx-auto pt-2 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              Official Attendance Summary (Print Preview)
            </h2>
            <Button 
              onClick={() => window.print()} 
              size="sm" 
              variant="outline" 
              className="gap-2 text-slate-700 border-slate-200 font-semibold shadow-sm hover:bg-slate-50"
            >
              <Printer className="w-4 h-4" /> Print PDF Ledger
            </Button>
          </div>

          <div id="official-sheet" className="bg-white border-2 border-black p-8 rounded-none text-black font-sans shadow-lg max-w-5xl mx-auto">
            {/* Header Title */}
            <div className="text-center space-y-2 border-b-2 border-black pb-4">
              <h1 className="text-sm sm:text-base font-bold uppercase tracking-wide">
                ATTENDANCE SHEET FOR GNANA PRAKASH YEAR - 3 CERTIFICATE COURSE TRAINING FOR SGTs at GROUND LEVEL
              </h1>
              <h2 className="text-sm font-semibold">
                for {selectedProgram?.totalDays || 6} Days from {selectedProgram ? formatDate(selectedProgram.startDate) : ""} to {selectedProgram ? formatDate(selectedProgram.endDate) : ""}
              </h2>
            </div>

            {/* Address & Service Provider Block */}
            <div className="border-b-2 border-black grid grid-cols-1 divide-y-2 divide-black">
              <div className="py-2.5 px-4 text-xs sm:text-sm font-semibold flex">
                <span className="w-64">Name of the Venue with Complete Address:</span>
                <span className="font-bold flex-1">
                  {Array.isArray(selectedProgram?.venue)
                    ? selectedProgram.venue.map((v: any) => typeof v === "object" ? `${v?.name || "Official Venue"} (${v?.address || "AP"})` : v).filter(Boolean).join(", ")
                    : selectedProgram?.venue
                      ? `${selectedProgram?.venue?.name || "Official Venue"} (${selectedProgram?.venue?.address || "AP"})`
                      : "Official Venue"}
                </span>
              </div>
              <div className="py-2.5 px-4 text-xs sm:text-sm font-semibold flex">
                <span className="w-64">Name of the Service Provider:</span>
                <span className="font-bold flex-1">{selectedProgram?.serviceProvider || "School Education Department"}</span>
              </div>
            </div>

            {/* The Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-b-2 border-black text-center text-xs">
                <thead>
                  <tr className="border-b-2 border-black divide-x-2 divide-black font-bold text-[10px] uppercase tracking-tight">
                    <th className="p-3 w-10">S. No</th>
                    <th className="p-3 min-w-44 text-left">Date | Day</th>
                    <th className="p-3 w-24">Number of SGTs Attended for Training</th>
                    <th className="p-3 w-20">Number of KRPs Attended</th>
                    <th className="p-3 w-20">Number of DRPs Attended</th>
                    <th className="p-3 w-24">No of Staff Members Attended from DEO Office</th>
                    <th className="p-3 w-24">No of Staff Members Attended from SS Office</th>
                    <th className="p-3 w-16">MEOs</th>
                    <th className="p-3 w-16">HMs</th>
                    <th className="p-3 w-16">CRPs</th>
                    <th className="p-3 w-20">Total Number</th>
                    <th className="p-3 w-36">Signature of the AMO</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black">
                  {Array.from({ length: totalDays }).map((_, idx) => {
                    const dayNum = idx + 1;
                    
                    // Retrieve date from base
                    const baseDate = new Date(selectedProgram.startDate);
                    baseDate.setDate(baseDate.getDate() + idx);
                    const formattedDate = baseDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric"
                    }) + " | " + baseDate.toLocaleDateString("en-US", { weekday: "long" });

                    const counts = getLocalCountsForDay(dayNum);

                    return (
                      <tr key={dayNum} className="divide-x-2 divide-black">
                        <td className="p-3.5 font-bold">{dayNum}</td>
                        <td className="p-3.5 text-left font-semibold">Day - {dayNum} <br /> {formattedDate}</td>
                        <td className="p-3.5 font-bold text-slate-800">{counts.sgt}</td>
                        <td className="p-3.5 font-bold text-slate-800">{counts.krp}</td>
                        <td className="p-3.5 font-bold text-slate-800">{counts.drp}</td>
                        <td className="p-3.5 font-bold text-slate-800">{counts.deoStaff}</td>
                        <td className="p-3.5 font-bold text-slate-800">{counts.ssStaff}</td>
                        <td className="p-3.5 font-bold text-slate-800">{counts.meo}</td>
                        <td className="p-3.5 font-bold text-slate-800">{counts.hm}</td>
                        <td className="p-3.5 font-bold text-slate-800">{counts.crp}</td>
                        <td className="p-3.5 font-extrabold bg-slate-50/50">{counts.total}</td>
                        <td className="p-3.5"></td>
                      </tr>
                    );
                  })}

                  {/* Totals Summary Row */}
                  <tr className="divide-x-2 divide-black bg-slate-50 font-extrabold border-t-2 border-black">
                    <td colSpan={2} className="p-4 text-center uppercase tracking-wider text-xs">Total Number</td>
                    <td className="p-4">{grand.sgtTotal}</td>
                    <td className="p-4">{grand.krpTotal}</td>
                    <td className="p-4">{grand.drpTotal}</td>
                    <td className="p-4">{grand.deoTotal}</td>
                    <td className="p-4">{grand.ssTotal}</td>
                    <td className="p-4">{grand.meoTotal}</td>
                    <td className="p-4">{grand.hmTotal}</td>
                    <td className="p-4">{grand.crpTotal}</td>
                    <td className="p-4 bg-slate-100">{grand.grandTotal}</td>
                    <td className="p-4"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Official Signatures */}
            <div className="mt-16 flex justify-between px-6 text-xs sm:text-sm font-bold pt-4">
              <span>Signature of the Centre In-Charge</span>
              <span>Signature of the AMO</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
