"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Download, 
  Printer, 
  Eye, 
  RefreshCw, 
  Calendar,
  AlertTriangle,
  UserCheck,
  Activity,
  FileText
} from "lucide-react";
import { toast } from "@/lib/hooks/use-toast";

interface AuditLogEntry {
  _id: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  module: string;
  description: string;
  entityId?: string;
  entityType?: string;
  ipAddress?: string;
  deviceInfo?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  createdAt: string;
}

interface Stats {
  totalOverall: number;
  todayCount: number;
  failedLogins: number;
  activeUsers: number;
}

const MODULES = [
  "ALL",
  "Authentication",
  "Users",
  "Districts",
  "Mandals",
  "Venues",
  "Programs",
  "Attendance",
  "Food",
  "Photos",
  "Videos",
  "System Admin"
];

const ROLES = [
  "ALL",
  "SUPER_ADMIN",
  "STATE_ADMIN",
  "DISTRICT_ADMIN",
  "MANDAL_ADMIN",
  "VENUE_ADMIN",
  "TEACHER",
  "PARTICIPANT",
  "UNKNOWN"
];

const ACTIONS = [
  "ALL",
  "LOGIN",
  "LOGOUT",
  "FAILED_LOGIN_ATTEMPT",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DELETED",
  "USER_ACTIVATED",
  "USER_DEACTIVATED",
  "ROLE_CHANGED",
  "DISTRICT_CREATED",
  "DISTRICT_UPDATED",
  "DISTRICT_DELETED",
  "MANDAL_CREATED",
  "MANDAL_UPDATED",
  "MANDAL_DELETED",
  "VENUE_CREATED",
  "VENUE_UPDATED",
  "VENUE_DELETED",
  "PROGRAM_CREATED",
  "PROGRAM_UPDATED",
  "PROGRAM_DELETED",
  "PROGRAM_PUBLISHED",
  "PROGRAM_CANCELLED",
  "ATTENDANCE_MARKED",
  "ATTENDANCE_UPDATED",
  "FOOD_RECORD_ADDED",
  "FOOD_RECORD_UPDATED",
  "MEDIA_UPLOAD_REQUEST",
  "MEDIA_APPROVE",
  "MEDIA_REJECT",
  "MEDIA_DELETE",
  "MEDIA_METADATA_UPDATE",
  "SETTINGS_CHANGED"
];

export default function AuditClient() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalOverall: 0,
    todayCount: 0,
    failedLogins: 0,
    activeUsers: 0
  });

  // Filters
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        search,
        module: moduleFilter,
        action: actionFilter,
        role: roleFilter,
        startDate,
        endDate
      });

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Only Super Administrators can access system audit logs."
          });
          return;
        }
        throw new Error("Failed to fetch logs");
      }

      const data = await res.json();
      setLogs(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error fetching logs",
        description: err.message || "An unexpected error occurred."
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, moduleFilter, actionFilter, roleFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Debounced search trigger could go here, but simple button/change is okay.
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setModuleFilter("ALL");
    setActionFilter("ALL");
    setRoleFilter("ALL");
    setStartDate("");
    setEndDate("");
    setPage(1);
    toast({
      title: "Filters Reset",
      description: "Showing all audit records."
    });
  };

  // Export handlers
  const getFilteredDataForExport = async (): Promise<AuditLogEntry[]> => {
    try {
      const params = new URLSearchParams({
        export: "true",
        search,
        module: moduleFilter,
        action: actionFilter,
        role: roleFilter,
        startDate,
        endDate
      });
      const res = await fetch(`/api/audit?${params.toString()}`);
      if (!res.ok) throw new Error("Export request failed");
      const result = await res.json();
      return result.data || [];
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: err.message
      });
      return [];
    }
  };

  const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = async () => {
    toast({ title: "Generating CSV...", description: "Preparing log data." });
    const data = await getFilteredDataForExport();
    if (!data.length) return;

    let csv = "Timestamp,User,Role,Action,Module,Description,IP Address,Device Info\n";
    data.forEach(log => {
      const row = [
        new Date(log.createdAt).toLocaleString(),
        `"${log.userName.replace(/"/g, '""')}"`,
        log.role,
        log.action,
        log.module,
        `"${log.description.replace(/"/g, '""')}"`,
        log.ipAddress || "N/A",
        `"${(log.deviceInfo || "N/A").replace(/"/g, '""')}"`
      ];
      csv += row.join(",") + "\n";
    });

    downloadCSV(csv, `audit_logs_${Date.now()}.csv`);
    toast({ title: "CSV Download Started", description: "Successfully exported logs." });
  };

  const handleExportExcel = async () => {
    toast({ title: "Generating Excel compatibility...", description: "Preparing log data." });
    const data = await getFilteredDataForExport();
    if (!data.length) return;

    // Excel compatibility is achieved via tab-separated CSV or same BOM format
    let csv = "Timestamp\tUser\tRole\tAction\tModule\tDescription\tIP Address\tDevice Info\n";
    data.forEach(log => {
      const row = [
        new Date(log.createdAt).toLocaleString(),
        log.userName,
        log.role,
        log.action,
        log.module,
        log.description,
        log.ipAddress || "N/A",
        log.deviceInfo || "N/A"
      ];
      csv += row.join("\t") + "\n";
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_logs_${Date.now()}.xls`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Excel Download Started", description: "Successfully exported logs." });
  };

  const handleExportPDF = async () => {
    toast({ title: "Preparing print layout...", description: "Rendering table view." });
    const data = await getFilteredDataForExport();
    if (!data.length) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Pop-up Blocked",
        description: "Please allow pop-ups to print the PDF."
      });
      return;
    }

    const html = `
      <html>
        <head>
          <title>System Audit Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h1 { font-size: 20px; margin-bottom: 5px; }
            p { font-size: 12px; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #fafafa; }
          </style>
        </head>
        <body>
          <h1>System Audit Log Report</h1>
          <p>Generated on ${new Date().toLocaleString()} | Total Records: ${data.length}</p>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Module</th>
                <th>Description</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(log => `
                <tr>
                  <td>${new Date(log.createdAt).toLocaleString()}</td>
                  <td>${log.userName}</td>
                  <td>${log.role}</td>
                  <td>${log.action}</td>
                  <td>${log.module}</td>
                  <td>${log.description}</td>
                  <td>${log.ipAddress || "N/A"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Helper to generate diff comparison
  const getDiffs = (oldVal: any, newVal: any) => {
    if (!oldVal) oldVal = {};
    if (!newVal) newVal = {};
    const diffs: Array<{ field: string; oldVal: any; newVal: any; status: "added" | "removed" | "changed" }> = [];
    
    const keys = Array.from(new Set([...Object.keys(oldVal), ...Object.keys(newVal)]));
    
    for (const key of keys) {
      if (["password", "salt", "__v", "image", "url"].includes(key)) continue;

      const o = oldVal[key];
      const n = newVal[key];

      const oStr = o !== undefined && o !== null ? (typeof o === "object" ? JSON.stringify(o) : String(o)) : "";
      const nStr = n !== undefined && n !== null ? (typeof n === "object" ? JSON.stringify(n) : String(n)) : "";

      if (oStr !== nStr) {
        if (o === undefined || o === null) {
          diffs.push({ field: key, oldVal: "-", newVal: n, status: "added" });
        } else if (n === undefined || n === null) {
          diffs.push({ field: key, oldVal: o, newVal: "-", status: "removed" });
        } else {
          diffs.push({ field: key, oldVal: o, newVal: n, status: "changed" });
        }
      }
    }
    return diffs;
  };

  const diffItems = selectedLog ? getDiffs(selectedLog.oldValues, selectedLog.newValues) : [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Activities</span>
              <p className="text-3xl font-bold tracking-tight text-foreground">{stats.totalOverall.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Activity className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Logs</span>
              <p className="text-3xl font-bold tracking-tight text-foreground">{stats.todayCount.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Failed Logins</span>
              <p className="text-3xl font-bold tracking-tight text-foreground">{stats.failedLogins.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Audit Users</span>
              <p className="text-3xl font-bold tracking-tight text-foreground">{stats.activeUsers.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
              <UserCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Control Bar */}
      <Card className="border-primary/10 bg-card/40 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-primary/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Filter Activity Trail
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 text-xs">
                <Download className="w-3.5 h-3.5" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2 text-xs">
                <Download className="w-3.5 h-3.5" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2 text-xs">
                <Printer className="w-3.5 h-3.5" /> Print PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={fetchLogs} className="h-9 w-9 p-0">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          {/* Main Filter Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Search logs</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search user, description..." 
                  className="pl-9 h-9 text-sm" 
                  value={search} 
                  onChange={handleSearchChange} 
                />
              </div>
            </div>

            {/* Module Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Module</label>
              <select value={moduleFilter} 
                onChange={e => { setModuleFilter(e.target.value); setPage(1); }}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:border-slate-700"
              >
                {MODULES.map(m => (
                  <option key={m} value={m} className="bg-background text-foreground">{m === "ALL" ? "All Modules" : m}</option>
                ))}
              </select>
            </div>

            {/* Action Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Action Type</label>
              <select value={actionFilter} 
                onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:border-slate-700"
              >
                {ACTIONS.map(a => (
                  <option key={a} value={a} className="bg-background text-foreground">{a === "ALL" ? "All Actions" : a}</option>
                ))}
              </select>
            </div>

            {/* Role Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Role</label>
              <select value={roleFilter} 
                onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:border-slate-700"
              >
                {ROLES.map(r => (
                  <option key={r} value={r} className="bg-background text-foreground">{r === "ALL" ? "All Roles" : r.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker Section */}
          <div className="flex flex-col sm:flex-row items-end justify-between gap-4 pt-2 border-t border-primary/5">
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <div className="space-y-1.5 w-full sm:w-auto">
                <label className="text-xs font-medium text-muted-foreground block">Start Date</label>
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={e => { setStartDate(e.target.value); setPage(1); }} 
                  className="h-9 text-xs w-full sm:w-40" 
                />
              </div>
              <div className="space-y-1.5 w-full sm:w-auto">
                <label className="text-xs font-medium text-muted-foreground block">End Date</label>
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={e => { setEndDate(e.target.value); setPage(1); }} 
                  className="h-9 text-xs w-full sm:w-40" 
                />
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs h-9 w-full sm:w-auto">
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table Card */}
      <Card className="border-primary/10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-primary/10 bg-muted/40 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Module</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Loading audit logs...
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No matching audit records found.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => {
                    // Badge styles for different actions
                    let actionBadgeColor = "bg-muted text-muted-foreground";
                    if (log.action.includes("CREATE") || log.action.includes("ADDED")) actionBadgeColor = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
                    else if (log.action.includes("UPDATE") || log.action.includes("CHANGED")) actionBadgeColor = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
                    else if (log.action.includes("DELETE") || log.action.includes("REMOVED")) actionBadgeColor = "bg-rose-500/10 text-rose-500 border border-rose-500/20";
                    else if (log.action === "LOGIN" || log.action.includes("APPROVE")) actionBadgeColor = "bg-sky-500/10 text-sky-500 border border-sky-500/20";
                    else if (log.action === "FAILED_LOGIN_ATTEMPT" || log.action.includes("REJECT")) actionBadgeColor = "bg-red-500/10 text-red-500 border border-red-500/20";

                    return (
                      <tr key={log._id} className="border-b border-primary/5 hover:bg-muted/20 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground">{log.userName}</div>
                          <div className="text-xs text-muted-foreground">{log.userId}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-secondary-foreground/10">
                            {log.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-foreground">{log.module}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${actionBadgeColor}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground max-w-xs truncate" title={log.description}>
                          {log.description}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2.5 gap-1.5 hover:bg-primary/10 hover:text-primary transition-all text-xs"
                            onClick={() => {
                              setSelectedLog(log);
                              setShowModal(true);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {!loading && logs.length > 0 && (
            <div className="flex items-center justify-between py-4 px-6 border-t border-primary/10">
              <span className="text-xs text-muted-foreground">
                Showing page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong> ({total} total records)
              </span>
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  className="h-8 px-3 text-xs"
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  className="h-8 px-3 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details View Modal */}
      {showModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-3xl rounded-xl border border-primary/20 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-muted/40 border-b border-primary/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Activity Log Details</h3>
                <p className="text-xs text-muted-foreground">ID: {selectedLog._id}</p>
              </div>
              <button 
                onClick={() => { setShowModal(false); setSelectedLog(null); }}
                className="text-muted-foreground hover:text-foreground transition-colors text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Meta Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-lg border border-primary/5">
                <div>
                  <span className="text-xs text-muted-foreground block">Timestamp</span>
                  <span className="text-sm font-semibold text-foreground">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Action Type</span>
                  <span className="text-sm font-semibold text-foreground text-primary">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">IP Address</span>
                  <span className="text-sm font-mono text-foreground">{selectedLog.ipAddress || "N/A"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Module</span>
                  <span className="text-sm font-semibold text-foreground">{selectedLog.module}</span>
                </div>
              </div>

              {/* User and Device Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">User Information</h4>
                  <p className="text-sm text-foreground"><strong>Name:</strong> {selectedLog.userName}</p>
                  <p className="text-sm text-foreground"><strong>Role:</strong> {selectedLog.role.replace("_", " ")}</p>
                  <p className="text-xs text-muted-foreground"><strong>User ID:</strong> {selectedLog.userId}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client Device Info</h4>
                  <p className="text-sm text-foreground break-words">{selectedLog.deviceInfo || "No device info captured."}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1 pt-2 border-t border-primary/5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity Summary</h4>
                <p className="text-sm text-foreground bg-muted/30 p-3 rounded border border-primary/5 italic">
                  "{selectedLog.description}"
                </p>
              </div>

              {/* Entity Context */}
              {selectedLog.entityId && (
                <div className="space-y-1 pt-2 border-t border-primary/5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Referenced Object</h4>
                  <p className="text-sm text-foreground">
                    <strong>Type:</strong> {selectedLog.entityType || "N/A"} | <strong>ID:</strong> <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{selectedLog.entityId}</code>
                  </p>
                </div>
              )}

              {/* Diff Values Section */}
              {selectedLog.action.includes("UPDATE") || selectedLog.action.includes("CHANGED") || selectedLog.action.includes("METADATA_UPDATE") ? (
                <div className="space-y-3 pt-4 border-t border-primary/10">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data Changes (Before vs After)</h4>
                  {diffItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No property changes detected or details not logged.</p>
                  ) : (
                    <div className="border border-primary/10 rounded-lg overflow-x-auto">
                      <table className="w-full text-xs text-left min-w-[500px]">
                        <thead className="bg-muted/40 border-b border-primary/10 text-muted-foreground">
                          <tr>
                            <th className="py-2 px-3">Field</th>
                            <th className="py-2 px-3 bg-red-500/5 text-rose-500">Before</th>
                            <th className="py-2 px-3 bg-emerald-500/5 text-emerald-500">After</th>
                          </tr>
                        </thead>
                        <tbody>
                          {diffItems.map(diff => (
                            <tr key={diff.field} className="border-b border-primary/5 hover:bg-muted/10 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-foreground font-mono">{diff.field}</td>
                              <td className="py-2.5 px-3 bg-red-500/5 text-rose-500 font-mono break-all line-through decoration-rose-500/40">
                                {typeof diff.oldVal === "object" ? JSON.stringify(diff.oldVal) : String(diff.oldVal)}
                              </td>
                              <td className="py-2.5 px-3 bg-emerald-500/5 text-emerald-500 font-mono break-all font-semibold">
                                {typeof diff.newVal === "object" ? JSON.stringify(diff.newVal) : String(diff.newVal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (selectedLog.newValues && Object.keys(selectedLog.newValues).length > 0) || (selectedLog.oldValues && Object.keys(selectedLog.oldValues).length > 0) ? (
                <div className="space-y-3 pt-4 border-t border-primary/10">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payload Data</h4>
                  <pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-48 border border-primary/5">
                    {JSON.stringify(selectedLog.newValues || selectedLog.oldValues, (k, v) => {
                      if (["password", "salt", "__v", "image", "url"].includes(k)) return undefined;
                      return v;
                    }, 2)}
                  </pre>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-muted/40 border-t border-primary/10 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => { setShowModal(false); setSelectedLog(null); }}
                className="text-xs"
              >
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
