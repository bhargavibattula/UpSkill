"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MapPin, Users, Wifi, Utensils, BedDouble, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import VenueForm from "./VenueForm";
import { toast } from "@/lib/hooks/use-toast";

async function fetchVenues(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/venues?${qs}`);
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function deleteVenue(id: string) {
  const res = await fetch(`/api/venues/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

export default function VenuesClient() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editVenue, setEditVenue] = useState<Record<string, unknown> | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["venues", { search, page }],
    queryFn: () => fetchVenues({ search, page: String(page), limit: "12" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVenue,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["venues"] }); toast({ title: "Venue Deleted", variant: "success" }); },
    onError: (err: any) => { toast({ title: "Delete Failed", description: err.message, variant: "destructive" }); },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search venues..." className="pl-9 h-9 w-64 text-sm" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Button size="sm" className="gap-2" onClick={() => { setEditVenue(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Add Venue
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-48 items-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      ) : !data?.data?.length ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border rounded-xl bg-card">
          <MapPin className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-medium">No venues found</p>
          <p className="text-sm mt-1">Add a new venue or try a different search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.data?.map((venue: Record<string, any>) => (
            <Card key={venue._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-950 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-brand-600" />
                      </div>
                      <CardTitle className="text-sm truncate">{venue.name}</CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground truncate pl-10">{venue.address}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onSelect={(e) => { e.preventDefault(); setEditVenue(venue); setShowForm(true); }}>
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-destructive" onSelect={(e) => { e.preventDefault(); deleteMutation.mutate(venue._id); }}>
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {venue.district?.name && <Badge variant="secondary" className="text-xs">{venue.district.name}</Badge>}
                  {venue.mandal?.name && <Badge variant="outline" className="text-xs">{venue.mandal.name}</Badge>}
                  {venue.accommodation?.isResidential && <Badge variant="info" className="text-xs">Residential</Badge>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> Capacity: <span className="font-medium text-foreground">{venue.infrastructure?.capacity || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BedDouble className="w-3 h-3" /> Beds: <span className="font-medium text-foreground">{venue.accommodation?.totalBeds || 0}</span>
                  </div>
                  {venue.infrastructure?.wifi && (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <Wifi className="w-3 h-3" /> WiFi Available
                    </div>
                  )}
                  {venue.infrastructure?.diningHall && (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <Utensils className="w-3 h-3" /> Dining Hall
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Contact: <span className="text-foreground font-medium">{venue.contactPerson}</span></span>
                  <span className="text-muted-foreground">{venue.contactNumber}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Showing {data.data?.length} of {data.total} venues</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editVenue ? "Edit Venue" : "Add New Venue"}</DialogTitle>
          </DialogHeader>
          <VenueForm defaultValues={editVenue || undefined}
            onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ["venues"] }); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
