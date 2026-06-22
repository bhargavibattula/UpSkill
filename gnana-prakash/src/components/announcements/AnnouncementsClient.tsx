"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/hooks/use-toast";
import { Plus, Search, Megaphone, Loader2, MoreHorizontal, Pencil, Trash2, Eye, EyeOff, AlertTriangle, Info, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AnnouncementForm from "./AnnouncementForm";
import { formatDistanceToNow, format } from "date-fns";

async function fetchAnnouncements(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/announcements?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function deleteAnnouncement(id: string) {
  const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

async function togglePublishStatus({ id, isActive }: { id: string, isActive: boolean }) {
  const res = await fetch(`/api/announcements/${id}`, { 
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive })
  });
  if (!res.ok) throw new Error("Toggle failed");
  return res.json();
}

const PRIORITY_COLORS: Record<string, { bg: string, text: string, icon: React.ReactNode }> = {
  URGENT: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" /> },
  MANDATORY: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" /> },
  UPDATE: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: <Info className="w-3.5 h-3.5 mr-1" /> },
  INFO: { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-400", icon: <Info className="w-3.5 h-3.5 mr-1" /> },
};

export default function AnnouncementsClient() {
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editAnnouncement, setEditAnnouncement] = useState<any>(null);
  const [viewAnnouncement, setViewAnnouncement] = useState<any>(null);
  
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["announcements", { search, priority, page }],
    queryFn: () => fetchAnnouncements({ search, priority, page: String(page), limit: "15" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["announcements"] }); 
      toast({ title: "Circular Deleted", description: "The circular has been successfully removed.", variant: "success" }); 
    },
    onError: (err: any) => { toast({ title: "Delete Failed", description: err.message, variant: "destructive" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: togglePublishStatus,
    onSuccess: (data) => { 
      qc.invalidateQueries({ queryKey: ["announcements"] }); 
      toast({ 
        title: data.isActive ? "Circular Published" : "Circular Unpublished", 
        variant: "success" 
      }); 
    },
    onError: (err: any) => { toast({ title: "Toggle Failed", description: err.message, variant: "destructive" }); },
  });

  // Calculate statistics
  const stats = {
    total: data?.total || 0,
    active: data?.data?.filter((a: any) => a.isActive && (!a.expiryDate || new Date(a.expiryDate) > new Date())).length || 0,
    expired: data?.data?.filter((a: any) => a.expiryDate && new Date(a.expiryDate) < new Date()).length || 0,
    urgent: data?.data?.filter((a: any) => a.priority === "URGENT").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl">
              <Megaphone className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Circulars</p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <h3 className="text-2xl font-bold">{stats.active}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Expired</p>
              <h3 className="text-2xl font-bold">{stats.expired}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Urgent</p>
              <h3 className="text-2xl font-bold">{stats.urgent}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-base">Manage Circulars</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-none w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Search by title..." 
                  className="pl-9 h-9 w-56 text-sm"
                  value={search} 
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
                />
              </div>
              <select 
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                value={priority} 
                onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              >
                <option value="">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="MANDATORY">Mandatory</option>
                <option value="UPDATE">Update</option>
                <option value="INFO">Info</option>
              </select>
              <Button size="sm" className="gap-2 whitespace-nowrap" onClick={() => { setEditAnnouncement(null); setShowForm(true); }}>
                <Plus className="w-4 h-4" /> Create Circular
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
             <div className="flex items-center justify-center h-48">
               <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
             </div>
          ) : !data?.data?.length ? (
             <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
               <Megaphone className="w-12 h-12 mb-3 opacity-20" />
               <p className="font-medium">No circulars found</p>
               <p className="text-sm mt-1">Create a new circular to broadcast to users.</p>
             </div>
          ) : (
             <Table>
               <TableHeader>
                 <TableRow className="bg-muted/40">
                   <TableHead>Title</TableHead>
                   <TableHead>Priority</TableHead>
                   <TableHead>Publish Date</TableHead>
                   <TableHead>Expiry Date</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Created By</TableHead>
                   <TableHead className="w-12 text-center">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {data.data.map((a: any) => {
                   const isExpired = a.expiryDate && new Date(a.expiryDate) < new Date();
                   const priorityStyle = PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.INFO;
                   
                   return (
                     <TableRow key={a._id}>
                       <TableCell className="font-medium">
                         <div className="max-w-[250px] truncate" title={a.title}>{a.title}</div>
                       </TableCell>
                       <TableCell>
                         <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${priorityStyle.bg} ${priorityStyle.text}`}>
                           {priorityStyle.icon}
                           {a.priority}
                         </span>
                       </TableCell>
                       <TableCell className="text-sm text-muted-foreground">
                         {format(new Date(a.createdAt), "MMM d, yyyy")}
                       </TableCell>
                       <TableCell className="text-sm text-muted-foreground">
                         {a.expiryDate ? format(new Date(a.expiryDate), "MMM d, yyyy") : "Never"}
                       </TableCell>
                       <TableCell>
                         {isExpired ? (
                           <Badge variant="outline" className="text-xs text-muted-foreground">Expired</Badge>
                         ) : a.isActive ? (
                           <Badge variant="success" className="text-xs">Published</Badge>
                         ) : (
                           <Badge variant="secondary" className="text-xs">Draft</Badge>
                         )}
                       </TableCell>
                       <TableCell className="text-sm">{a.createdBy?.name || "System"}</TableCell>
                       <TableCell>
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem className="gap-2" onSelect={(e) => { e.preventDefault(); setViewAnnouncement(a); }}>
                               <Eye className="w-3.5 h-3.5" /> View Details
                             </DropdownMenuItem>
                             <DropdownMenuItem className="gap-2" onSelect={(e) => { e.preventDefault(); setEditAnnouncement(a); setShowForm(true); }}>
                               <Pencil className="w-3.5 h-3.5" /> Edit
                             </DropdownMenuItem>
                             <DropdownMenuItem 
                               className="gap-2" 
                               onSelect={(e) => { 
                                 e.preventDefault(); 
                                 toggleMutation.mutate({ id: a._id, isActive: !a.isActive }); 
                               }}
                             >
                               {a.isActive ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><CheckCircle2 className="w-3.5 h-3.5" /> Publish</>}
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem className="gap-2 text-destructive" onSelect={(e) => { e.preventDefault(); deleteMutation.mutate(a._id); }}>
                               <Trash2 className="w-3.5 h-3.5" /> Delete
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </TableCell>
                     </TableRow>
                   );
                 })}
               </TableBody>
             </Table>
          )}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">Page {page} of {data.totalPages} Â· {data.total} total</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editAnnouncement ? "Edit Circular" : "Create Official Circular"}</DialogTitle>
          </DialogHeader>
          <AnnouncementForm 
            defaultValues={editAnnouncement || undefined}
            onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ["announcements"] }); }} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewAnnouncement} onOpenChange={() => setViewAnnouncement(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Circular Details</DialogTitle>
          </DialogHeader>
          {viewAnnouncement && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${PRIORITY_COLORS[viewAnnouncement.priority]?.bg} ${PRIORITY_COLORS[viewAnnouncement.priority]?.text}`}>
                   {PRIORITY_COLORS[viewAnnouncement.priority]?.icon}
                   {viewAnnouncement.priority}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDistanceToNow(new Date(viewAnnouncement.createdAt), { addSuffix: true })}
                </span>
              </div>
              <h2 className="text-xl font-bold">{viewAnnouncement.title}</h2>
              {viewAnnouncement.imageUrl && (
                <div className="mb-4 rounded-lg overflow-hidden border bg-muted/30 max-h-[300px] flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={viewAnnouncement.imageUrl} alt={viewAnnouncement.title} className="max-w-full max-h-[300px] object-contain" />
                </div>
              )}
              <div className="p-4 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap border border-border">
                {viewAnnouncement.description}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
                <span>Created by: <strong className="text-foreground">{viewAnnouncement.createdBy?.name || "System"}</strong></span>
                <span>Expires: <strong className="text-foreground">{viewAnnouncement.expiryDate ? format(new Date(viewAnnouncement.expiryDate), "PPP") : "Never"}</strong></span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
