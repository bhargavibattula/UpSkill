"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Users, Loader2, MoreHorizontal, Pencil, Trash2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import ParticipantForm from "./ParticipantForm";
import { PARTICIPANT_CATEGORIES } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";

async function fetchParticipants(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/participants?${qs}`);
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function deleteParticipant(id: string) {
  const res = await fetch(`/api/participants/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

const CATEGORY_GROUP_COLOR: Record<string, string> = {
  Teachers: "info", Trainers: "success", Staff: "warning",
};

export default function ParticipantsClient() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editParticipant, setEditParticipant] = useState<Record<string, unknown> | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["participants", { search, category, page }],
    queryFn: () => fetchParticipants({ search, category, page: String(page), limit: "20" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteParticipant,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["participants"] }); toast({ title: "Participant Deleted", variant: "success" }); },
    onError: (err: any) => { toast({ title: "Delete Failed", description: err.message, variant: "destructive" }); },
  });

  const getCategoryGroup = (cat: string) => PARTICIPANT_CATEGORIES.find(c => c.value === cat)?.group || "Staff";

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-base">All Participants</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-none w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Search by name or ID..." className="pl-9 h-9 w-56 text-sm"
                  value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {PARTICIPANT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <Button size="sm" className="gap-2 whitespace-nowrap" onClick={() => { setEditParticipant(null); setShowForm(true); }}>
                <Plus className="w-4 h-4" /> Add Participant
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
             <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>
          ) : !data?.data?.length ? (
             <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
               <Users className="w-12 h-12 mb-3 opacity-20" />
               <p className="font-medium">No participants found</p>
             </div>
          ) : (
             <Table>
               <TableHeader>
                 <TableRow className="bg-muted/40">
                   <TableHead>Employee ID</TableHead>
                   <TableHead>Name</TableHead>
                   <TableHead>Designation</TableHead>
                   <TableHead>Category</TableHead>
                   <TableHead>District</TableHead>
                   <TableHead>Mobile</TableHead>
                   <TableHead>Residential</TableHead>
                   <TableHead>Certificate</TableHead>
                   <TableHead className="w-12"></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {data.data.map((p: Record<string, any>) => (
                   <TableRow key={p._id}>
                     <TableCell className="font-mono text-xs font-medium text-brand-600">{p.employeeId}</TableCell>
                     <TableCell>
                       <div>
                         <p className="font-medium text-sm">{p.name}</p>
                         {p.schoolName && <p className="text-xs text-muted-foreground">{p.schoolName}</p>}
                       </div>
                     </TableCell>
                     <TableCell className="text-sm">{p.designation}</TableCell>
                     <TableCell>
                       <Badge variant={(CATEGORY_GROUP_COLOR[getCategoryGroup(p.category)] || "secondary") as any} className="text-xs">
                         {PARTICIPANT_CATEGORIES.find(c => c.value === p.category)?.label || p.category}
                       </Badge>
                     </TableCell>
                     <TableCell className="text-sm">{p.district?.name || p.district}</TableCell>
                     <TableCell className="text-sm font-mono">{p.mobile}</TableCell>
                     <TableCell>
                       <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.isResidential ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                         {p.isResidential ? "Yes" : "No"}
                       </span>
                     </TableCell>
                     <TableCell>
                       {p.certificateIssued
                         ? <Award className="w-4 h-4 text-amber-500" />
                         : <span className="text-xs text-muted-foreground">Pending</span>}
                     </TableCell>
                     <TableCell>
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuItem className="gap-2" onSelect={(e) => { e.preventDefault(); setEditParticipant(p); setShowForm(true); }}>
                             <Pencil className="w-3.5 h-3.5" /> Edit
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem className="gap-2 text-destructive" onSelect={(e) => { e.preventDefault(); deleteMutation.mutate(p._id); }}>
                             <Trash2 className="w-3.5 h-3.5" /> Delete
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                     </TableCell>
                   </TableRow>
                 ))}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editParticipant ? "Edit Participant" : "Add Participant"}</DialogTitle>
          </DialogHeader>
          <ParticipantForm defaultValues={editParticipant || undefined}
            onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ["participants"] }); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
