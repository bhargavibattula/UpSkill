"use client";
import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { Upload, Video, Loader2, Check, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatFileSize, VIDEO_CATEGORIES } from "@/lib/utils";

import { toast } from "@/lib/hooks/use-toast";

interface SessionUser { role: string; [key: string]: any; }

export default function VideosClient() {
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => {
    fetch("/api/auth/custom-session").then(r => r.json()).then(d => { if (d.user) setUser(d.user); }).catch(console.error);
  }, []);
  const role = user?.role;
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [uploadData, setUploadData] = useState({ program: "", title: "", category: "VENUE_TOUR" });
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["videos", { status, page }],
    queryFn: async () => {
      const qs = new URLSearchParams(Object.fromEntries(Object.entries({ status, page: String(page), limit: "12" }).filter(([,v]) => v))).toString();
      const res = await fetch(`/api/videos?${qs}`);
      return res.json();
    },
  });

  const onDrop = useCallback(async (files: File[]) => {
    if (!uploadData.title) {
      toast({ title: "Title Required", description: "Please enter a video title first.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", uploadData.title);
        formData.append("category", uploadData.category);
        if (uploadData.program) formData.append("program", uploadData.program);
        const res = await fetch("/api/videos", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
      }
      toast({ title: "Upload Successful", description: "Videos have been uploaded successfully.", variant: "success" });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message || "An error occurred during video upload.", variant: "destructive" });
    } finally {
      setUploading(false);
      qc.invalidateQueries({ queryKey: ["videos"] });
    }
  }, [uploadData, qc]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "video/*": [".mp4", ".webm", ".mov", ".avi"] }, maxSize: 500 * 1024 * 1024,
  });

  const approve = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/videos/${id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      if (!res.ok) throw new Error("Failed to update status");
      toast({ title: "Status Updated", description: `Video has been ${action === "approve" ? "approved" : "rejected"} successfully.`, variant: "success" });
      qc.invalidateQueries({ queryKey: ["videos"] });
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message || "Failed to update video status.", variant: "destructive" });
    }
  };

  const STATUS_BADGE: Record<string, string> = { APPROVED: "success", PENDING: "warning", REJECTED: "destructive" };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Upload Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input placeholder="Video Title *" className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
              value={uploadData.title} onChange={e => setUploadData(p => ({ ...p, title: e.target.value }))} />
            <input placeholder="Program ID (optional)" className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
              value={uploadData.program} onChange={e => setUploadData(p => ({ ...p, program: e.target.value }))} />
            <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
              value={uploadData.category} onChange={e => setUploadData(p => ({ ...p, category: e.target.value }))}>
              {VIDEO_CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
            </select>
          </div>
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-brand-500 bg-brand-50" : "border-muted hover:border-brand-400 hover:bg-muted/30"}`}>
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                <p className="text-sm text-muted-foreground">Uploading video...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Video className="w-8 h-8 text-muted-foreground" />
                <p className="font-medium text-sm">Drag & drop video files or click to browse</p>
                <p className="text-xs text-muted-foreground">MP4, WebM, MOV up to 500MB</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <span className="text-sm text-muted-foreground">{data?.total || 0} videos</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-40 items-center"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.data?.map((video: Record<string, any>) => (
            <div key={video._id} className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-slate-900 flex items-center justify-center relative">
                <Video className="w-12 h-12 text-slate-600" />
                <div className="absolute top-2 right-2">
                  <Badge variant={(STATUS_BADGE[video.status] || "secondary") as any} className="text-xs">{video.status}</Badge>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <p className="font-semibold text-sm truncate">{video.title}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{video.category?.replace("_", " ")}</span>
                  <span>{formatFileSize(video.size || 0)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(video.uploadDate)}</p>
                {role && ["SUPER_ADMIN","DISTRICT_ADMIN"].includes(role) && video.status === "PENDING" && (
                  <div className="flex gap-2.5 pt-2">
                    <Button size="sm" className="flex-1 gap-1.5 h-9 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200" onClick={() => approve(video._id, "approve")}>
                      <Check className="w-3.5 h-3.5" /> Approve
                    </Button>
                    <Button size="sm" className="flex-1 gap-1.5 h-9 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 transition-all duration-200" onClick={() => approve(video._id, "reject")}>
                      <X className="w-3.5 h-3.5" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
