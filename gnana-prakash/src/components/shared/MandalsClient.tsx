"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MapPin, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/hooks/use-toast";

async function fetchMandals(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/mandals?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchDistricts() {
  const res = await fetch(`/api/districts`);
  if (!res.ok) throw new Error("Failed to fetch districts");
  return res.json();
}

async function deleteMandal(id: string) {
  const res = await fetch(`/api/mandals/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

export default function MandalsClient() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editMandal, setEditMandal] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["mandals", { search }],
    queryFn: () => fetchMandals({ search }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMandal,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mandals"] }); toast({ title: "Mandal Deleted", variant: "success" }); },
    onError: (err: any) => { toast({ title: "Delete Failed", description: err.message, variant: "destructive" }); },
  });

  const filteredData = data?.filter((m: any) => m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-base">Management Module</CardTitle>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9 h-9 w-full sm:w-48 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Button size="sm" className="gap-2 whitespace-nowrap" onClick={() => { setEditMandal(null); setShowForm(true); }}>
                <Plus className="w-4 h-4" />Add New
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
             <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>
          ) : filteredData.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
               <MapPin className="w-12 h-12 mb-3 opacity-20" />
               <p className="font-medium">No mandals found</p>
             </div>
          ) : (
             <Table>
               <TableHeader>
                 <TableRow className="bg-muted/40">
                   <TableHead>Mandal Name</TableHead>
                   <TableHead>Code</TableHead>
                   <TableHead>District</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead className="w-12"></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredData.map((m: any) => (
                   <TableRow key={m._id}>
                     <TableCell className="font-medium">{m.name}</TableCell>
                     <TableCell className="font-mono text-xs">{m.code}</TableCell>
                     <TableCell className="text-sm">{m.district?.name || "—"}</TableCell>
                     <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${m.isActive !== false ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {m.isActive !== false ? "Active" : "Inactive"}
                        </span>
                     </TableCell>
                     <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onSelect={(e) => { e.preventDefault(); setEditMandal(m); setShowForm(true); }}>
                              <Pencil className="w-3.5 h-3.5" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 text-destructive" onSelect={(e) => { e.preventDefault(); deleteMutation.mutate(m._id); }}>
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
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editMandal ? "Edit Mandal" : "Add Mandal"}</DialogTitle></DialogHeader>
          <MandalForm defaultValues={editMandal || undefined} onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ["mandals"] }); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MandalForm({ defaultValues, onSuccess }: { defaultValues?: any, onSuccess: () => void }) {
  const [data, setData] = useState({ 
    name: defaultValues?.name || "", 
    code: defaultValues?.code || "", 
    district: typeof defaultValues?.district === 'object' ? defaultValues?.district?._id : defaultValues?.district || "",
    isActive: defaultValues?.isActive !== false 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { data: districts } = useQuery({ queryKey: ["districts"], queryFn: fetchDistricts });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      if (!data.district) throw new Error("District is required");
      const url = defaultValues?._id ? `/api/mandals/${defaultValues._id}` : "/api/mandals";
      const method = defaultValues?._id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const err = await res.json(); const errMsg = err.error || "Failed"; setError(errMsg); toast({ title: "Save Failed", description: errMsg, variant: "destructive" }); return; }
      toast({ title: defaultValues?._id ? "Mandal Updated" : "Mandal Created", variant: "success" });
      onSuccess();
    } catch(err: any) { setError(err.message || "Network error"); toast({ title: "Error", description: err.message, variant: "destructive" }); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm">{error}</div>}
      <div className="space-y-1.5">
        <Label>District *</Label>
        <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={data.district} onChange={e => setData({...data, district: e.target.value})} required>
          <option value="">Select District</option>
          {districts?.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>Mandal Name *</Label>
        <Input value={data.name} onChange={e => setData({...data, name: e.target.value})} required placeholder="e.g. Vijayawada Rural" />
      </div>
      <div className="space-y-1.5">
        <Label>Mandal Code *</Label>
        <Input value={data.code} onChange={e => setData({...data, code: e.target.value.toUpperCase()})} required placeholder="e.g. VJW-R" />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <input type="checkbox" id="isActive" checked={data.isActive} onChange={e => setData({...data, isActive: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
        <label htmlFor="isActive" className="text-sm font-medium">Active Mandal</label>
      </div>
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading} className="gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />} {defaultValues?._id ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
