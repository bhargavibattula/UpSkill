"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/hooks/use-toast";
import { Plus, Search, Filter, MoreHorizontal, Eye, Pencil, Trash2, GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProgramForm from "./ProgramForm";
import { formatDate, getStatusColor, truncate } from "@/lib/utils";

async function fetchPrograms(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/programs?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch programs");
  return res.json();
}

async function deleteProgram(id: string) {
  const res = await fetch(`/api/programs/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

export default function ProgramsClient() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editProgram, setEditProgram] = useState<Record<string, unknown> | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["programs", { search, status, page }],
    queryFn: () => fetchPrograms({ search, status, page: String(page), limit: "10" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProgram,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["programs"] }); toast({ title: "Program Deleted", description: "The program has been removed successfully.", variant: "success" }); },
    onError: (err: any) => { toast({ title: "Delete Failed", description: err.message || "Could not delete the program.", variant: "destructive" }); },
  });

  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "success", DRAFT: "secondary", COMPLETED: "info", CANCELLED: "destructive",
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base">All Programs</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-none w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Search programs..." className="pl-9 h-9 w-full sm:w-64 text-sm"
                  value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <Button size="sm" className="gap-2 whitespace-nowrap" onClick={() => { setEditProgram(null); setShowForm(true); }}>
                <Plus className="w-4 h-4" /> Add Program
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
              <GraduationCap className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">No programs found</p>
              <p className="text-sm mt-1">Create your first training program</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Program</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((p: Record<string, any>) => (
                  <TableRow key={p._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{truncate(p.programName, 40)}</p>
                        <p className="text-xs text-muted-foreground">{p.department}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{p.trainingYear}</TableCell>
                    <TableCell className="text-sm">
                      {Array.isArray(p.district)
                        ? p.district.map((d: any) => typeof d === "object" ? d?.name : d).filter(Boolean).join(", ") || "â€”"
                        : (p.district?.name || p.district || "â€”")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {Array.isArray(p.venue)
                        ? p.venue.map((v: any) => typeof v === "object" ? v?.name : v).filter(Boolean).join(", ") || "â€”"
                        : (p.venue?.name || p.venue || "â€”")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(p.startDate)} â€“ {formatDate(p.endDate)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{p.totalDays}</TableCell>
                    <TableCell>
                      <Badge variant={(STATUS_COLORS[p.status] || "secondary") as any} className="text-xs">
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2"><Eye className="w-3.5 h-3.5" />View</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onSelect={(e) => { e.preventDefault(); setEditProgram(p); setShowForm(true); }}>
                            <Pencil className="w-3.5 h-3.5" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-destructive" onSelect={(e) => { e.preventDefault(); deleteMutation.mutate(p._id); }}>
                            <Trash2 className="w-3.5 h-3.5" />Delete
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
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 10) + 1}â€“{Math.min(page * 10, data.total)} of {data.total}
              </p>
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
            <DialogTitle>{editProgram ? "Edit Program" : "Create New Program"}</DialogTitle>
          </DialogHeader>
          <ProgramForm defaultValues={editProgram || undefined} onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ["programs"] }); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
