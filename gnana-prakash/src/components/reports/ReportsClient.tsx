"use client";
import { useState } from "react";
import { FileText, Download, Loader2, BarChart3, Users, MapPin, UtensilsCrossed, Image, ClipboardList, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

const REPORT_TYPES = [
  { id: "attendance", label: "Attendance Report", icon: ClipboardList, color: "text-brand-600", bg: "bg-brand-50 dark:bg-brand-950", desc: "Day-wise attendance summary for all programs" },
  { id: "participant", label: "Participant Report", icon: Users, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950", desc: "Complete participant registration details" },
  { id: "venue", label: "Venue Report", icon: MapPin, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950", desc: "Infrastructure and occupancy statistics" },
  { id: "food", label: "Food Report", icon: UtensilsCrossed, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950", desc: "Meal consumption and quantity data" },
  { id: "photo", label: "Photo Report", icon: Image, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950", desc: "Uploaded and approved media summary" },
  { id: "consolidated", label: "Consolidated Report", icon: BarChart3, color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-800", desc: "Full program report with all modules" },
];
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const flattenObject = (obj: any, prefix = ""): any => {
  return Object.keys(obj).reduce((acc: any, k) => {
    // Ignore internal fields
    if (k.startsWith("_") || k === "__v") return acc;
    
    const pre = prefix.length ? prefix + "_" : "";
    if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) {
      if (obj[k].name) acc[pre + k] = obj[k].name;
      else if (obj[k].programName) acc[pre + k] = obj[k].programName;
      else Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
};

import { toast } from "@/lib/hooks/use-toast";

export default function ReportsClient() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [filters, setFilters] = useState({ programId: "", district: "", from: "", to: "" });

  const { data: districts } = useQuery({
    queryKey: ["districts"],
    queryFn: async () => { const res = await fetch("/api/districts"); return res.json(); }
  });

  const { data: programs } = useQuery({
    queryKey: ["programs_list"],
    queryFn: async () => { 
      const res = await fetch(`/api/programs?limit=100`); 
      return res.json(); 
    }
  });
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [previewingType, setPreviewingType] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  const previewReport = async (type: string, label: string) => {
    setLoadingPreview(true);
    setPreviewTitle(label);
    setPreviewingType(type);
    try {
      const qs = new URLSearchParams({ type, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) }).toString();
      const res = await fetch(`/api/reports?${qs}`);
      if (res.ok) {
        const data = await res.json();
        const flatData = data.map((item: any) => flattenObject(item));
        setPreviewData(flatData);
      } else {
        alert("Failed to load preview");
      }
    } catch (e) {
      alert("An error occurred while loading preview");
    } finally {
      setLoadingPreview(false);
    }
  };


  const exportExcel = (data: any[], type: string) => {
    if (!data || data.length === 0) {
      toast({ title: "No Data Found", description: "No data matches the selected filters.", variant: "destructive" });
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data.map(item => flattenObject(item)));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${type}-report-${Date.now()}.xlsx`);
    toast({ title: "Excel Exported", description: `Successfully exported ${type} report to Excel.`, variant: "success" });
  };

  const exportPdf = (data: any[], type: string) => {
    if (!data || data.length === 0) {
      toast({ title: "No Data Found", description: "No data matches the selected filters.", variant: "destructive" });
      return;
    }
    const doc = new jsPDF();
    const flatData = data.map(item => flattenObject(item));
    const head = [Object.keys(flatData[0]).map(k => k.replace(/_/g, " ").toUpperCase())];
    const body = flatData.map(item => Object.values(item).map(v => String(v || "")));
    
    doc.setFontSize(16);
    doc.text(`${type.toUpperCase()} REPORT`, 14, 15);
    autoTable(doc, {
      head,
      body,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 65, 140] },
      horizontalPageBreak: true
    });
    doc.save(`${type}-report-${Date.now()}.pdf`);
    toast({ title: "PDF Exported", description: `Successfully exported ${type} report to PDF.`, variant: "success" });
  };

  const generate = async (type: string, format: "pdf" | "excel") => {
    setGenerating(`${type}-${format}`);
    try {
      const qs = new URLSearchParams({ type, format, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) }).toString();
      const res = await fetch(`/api/reports?${qs}`);
      if (res.ok) {
        const data = await res.json();
        if (format === "excel") exportExcel(data, type);
        else exportPdf(data, type);
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast({ title: "Generation Failed", description: errJson.error || "Failed to generate the report.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Generation Error", description: e.message || "An error occurred while generating the report.", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Program</label>
              <select className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:border-slate-700"
                value={filters.programId} onChange={e => setFilters(p => ({ ...p, programId: e.target.value }))}>
                <option value="">All Programs</option>
                {programs?.data?.map((p: any) => (
                  <option key={p._id} value={p._id}>{p.programName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">District</label>
              <select className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:border-slate-700"
                value={filters.district} onChange={e => setFilters(p => ({ ...p, district: e.target.value }))}>
                <option value="">All Districts</option>
                {districts?.map((d: any) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">From Date</label>
              <input type="date" className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={filters.from} onChange={e => setFilters(p => ({ ...p, from: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">To Date</label>
              <input type="date" className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={filters.to} onChange={e => setFilters(p => ({ ...p, to: e.target.value }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_TYPES.map(({ id, label, icon: Icon, color, bg, desc }) => (
          <Card key={id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs h-8"
                  disabled={!!generating} onClick={() => previewReport(id, label)}>
                  <Eye className="w-3 h-3" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs h-8"
                  disabled={!!generating} onClick={() => generate(id, "pdf")}>
                  {generating === `${id}-pdf` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  PDF
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs h-8"
                  disabled={!!generating} onClick={() => generate(id, "excel")}>
                  {generating === `${id}-excel` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading Modal */}
      {loadingPreview && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-80 p-6 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <p className="text-sm font-medium">Fetching preview data...</p>
          </Card>
        </div>
      )}

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl border bg-card">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-lg font-bold">{previewTitle} Preview</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Showing {previewData.length} records based on active filters
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setPreviewData(null)}
                className="h-8 w-8 p-0 rounded-full"
              >
                âœ•
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-6">
              {previewData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 stroke-[1.5] mb-2" />
                  <p className="text-sm">No data found matching the selected filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm border-collapse text-left">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        {Object.keys(previewData[0]).map((key) => (
                          <th 
                            key={key} 
                            className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap text-xs border-r last:border-r-0"
                          >
                            {key.replace(/_/g, " ").toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr 
                          key={idx} 
                          className="border-b hover:bg-muted/30 transition-colors last:border-b-0"
                        >
                          {Object.values(row).map((val: any, valIdx) => (
                            <td 
                              key={valIdx} 
                              className="px-4 py-3 text-xs whitespace-nowrap border-r last:border-r-0"
                            >
                              {String(val ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            <div className="border-t p-4 bg-muted/20 flex justify-between gap-3 rounded-b-xl">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  disabled={previewData.length === 0}
                  onClick={() => {
                    generate(previewingType, "pdf");
                  }}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  disabled={previewData.length === 0}
                  onClick={() => {
                    generate(previewingType, "excel");
                  }}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Excel
                </Button>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPreviewData(null)}
                className="h-8 text-xs"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
