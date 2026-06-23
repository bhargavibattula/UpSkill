"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/hooks/use-toast";
import { Search, Loader2, CheckCircle2, XCircle, Clock, FileText, UserPlus, Shield, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow, format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

async function fetchRequests(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/admin/registration-requests?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function approveRequest(id: string) {
  const res = await fetch(`/api/admin/registration-requests/${id}/approve`, { method: "PUT" });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Approval failed");
  }
  return res.json();
}

async function rejectRequest({ id, reason }: { id: string, reason: string }) {
  const res = await fetch(`/api/admin/registration-requests/${id}/reject`, { 
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rejectionReason: reason })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Rejection failed");
  }
  return res.json();
}

export default function RegistrationRequestsClient() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [viewRequest, setViewRequest] = useState<any>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["registration_requests", { search, status, role, page }],
    queryFn: () => fetchRequests({ search, status, role, page: String(page), limit: "15" }),
  });

  const approveMutation = useMutation({
    mutationFn: approveRequest,
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["registration_requests"] }); 
      toast({ title: "Approved", description: "Registration approved successfully. User account created.", variant: "success" }); 
      setViewRequest(null);
    },
    onError: (err: any) => { toast({ title: "Approval Failed", description: err.message, variant: "destructive" }); },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectRequest,
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["registration_requests"] }); 
      toast({ title: "Rejected", description: "Registration request rejected.", variant: "success" }); 
      setRejectId(null);
      setRejectReason("");
      setViewRequest(null);
    },
    onError: (err: any) => { toast({ title: "Rejection Failed", description: err.message, variant: "destructive" }); },
  });

  // Since the API uses pagination, we can only show total counts from the API response
  // We can fetch summary stats without filters to populate the cards
  const { data: statsData } = useQuery({
    queryKey: ["registration_stats"],
    queryFn: () => fetchRequests({ limit: "1000" }), // basic fetch for stats (can be optimized with a real stats endpoint later)
  });

  const stats = {
    total: statsData?.data?.length || 0,
    pending: statsData?.data?.filter((r: any) => r.status === "PENDING").length || 0,
    approved: statsData?.data?.filter((r: any) => r.status === "APPROVED").length || 0,
    rejected: statsData?.data?.filter((r: any) => r.status === "REJECTED").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl">
              <UserPlus className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <h3 className="text-2xl font-bold">{stats.pending}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Approved</p>
              <h3 className="text-2xl font-bold">{stats.approved}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
              <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rejected</p>
              <h3 className="text-2xl font-bold">{stats.rejected}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-base">Registration Requests</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-none w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Search name or email..." 
                  className="pl-9 h-9 w-56 text-sm"
                  value={search} 
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
                />
              </div>
              <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:border-slate-700"
                value={status} 
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:border-slate-700"
                value={role} 
                onChange={(e) => { setRole(e.target.value); setPage(1); }}
              >
                <option value="">All Roles</option>
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="DISTRICT_ADMIN">District Admin</option>
                <option value="STATE_ADMIN">State Admin</option>
              </select>
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
               <FileText className="w-12 h-12 mb-3 opacity-20" />
               <p className="font-medium">No requests found</p>
             </div>
          ) : (
             <Table>
               <TableHeader>
                 <TableRow className="bg-muted/40">
                   <TableHead>Applicant Name</TableHead>
                   <TableHead>Email</TableHead>
                   <TableHead>Mobile</TableHead>
                   <TableHead>Requested Role</TableHead>
                   <TableHead>Submitted Date</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead className="w-12 text-center">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {data.data.map((r: any) => (
                   <TableRow key={r._id}>
                     <TableCell className="font-medium">{r.fullName}</TableCell>
                     <TableCell className="text-sm">{r.email}</TableCell>
                     <TableCell className="text-sm">{r.mobileNumber}</TableCell>
                     <TableCell>
                       <Badge variant="outline" className="text-xs bg-slate-50">{r.requestedRole}</Badge>
                     </TableCell>
                     <TableCell className="text-sm text-muted-foreground">
                       {format(new Date(r.submittedAt), "MMM d, yyyy")}
                     </TableCell>
                     <TableCell>
                       {r.status === "PENDING" && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>}
                       {r.status === "APPROVED" && <Badge variant="success">Approved</Badge>}
                       {r.status === "REJECTED" && <Badge variant="destructive">Rejected</Badge>}
                     </TableCell>
                     <TableCell>
                       <Button variant="ghost" size="sm" onClick={() => setViewRequest(r)}>
                         <Eye className="w-4 h-4 mr-1" /> View
                       </Button>
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

      {/* View Request Modal */}
      <Dialog open={!!viewRequest} onOpenChange={() => setViewRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registration Request Details</DialogTitle>
          </DialogHeader>
          {viewRequest && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Full Name</p>
                  <p className="font-semibold">{viewRequest.fullName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Email</p>
                  <p className="font-semibold">{viewRequest.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Mobile</p>
                  <p className="font-semibold">{viewRequest.mobileNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Requested Role</p>
                  <div className="font-semibold"><Badge variant="outline">{viewRequest.requestedRole}</Badge></div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Submitted</p>
                  <p className="font-semibold">{formatDistanceToNow(new Date(viewRequest.submittedAt), { addSuffix: true })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  <div className="font-semibold">
                    {viewRequest.status === "PENDING" && <span className="text-amber-600 font-bold">Pending</span>}
                    {viewRequest.status === "APPROVED" && <span className="text-emerald-600 font-bold">Approved</span>}
                    {viewRequest.status === "REJECTED" && <span className="text-rose-600 font-bold">Rejected</span>}
                  </div>
                </div>
                {viewRequest.rejectionReason && (
                  <div className="col-span-2 mt-2 p-3 bg-rose-50 border border-rose-100 rounded-md">
                    <p className="text-xs text-rose-800 font-semibold mb-1">Rejection Reason:</p>
                    <p className="text-sm text-rose-900">{viewRequest.rejectionReason}</p>
                  </div>
                )}
              </div>
              
              {viewRequest.status === "PENDING" && (
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" 
                    onClick={() => approveMutation.mutate(viewRequest._id)}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve & Create Account"}
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => { setRejectId(viewRequest._id); setViewRequest(null); }}
                  >
                    Reject Request
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={!!rejectId} onOpenChange={() => { setRejectId(null); setRejectReason(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this registration request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Textarea 
                placeholder="e.g., Invalid credentials, role not authorized..." 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => { setRejectId(null); setRejectReason(""); }}>Cancel</Button>
              <Button 
                variant="destructive" 
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                onClick={() => rejectId && rejectMutation.mutate({ id: rejectId, reason: rejectReason })}
              >
                {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
