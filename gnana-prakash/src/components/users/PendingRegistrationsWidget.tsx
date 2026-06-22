"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Check, X, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { toast } from "@/lib/hooks/use-toast";

async function fetchPendingRequests() {
  const res = await fetch("/api/admin/registration-requests?status=PENDING&limit=5");
  if (!res.ok) throw new Error("Failed to load");
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

async function rejectRequest(id: string) {
  const res = await fetch(`/api/admin/registration-requests/${id}/reject`, { 
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rejectionReason: "Rejected from dashboard widget" })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Rejection failed");
  }
  return res.json();
}

export default function PendingRegistrationsWidget() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["pending_registrations_widget"],
    queryFn: fetchPendingRequests,
    refetchInterval: 60000,
  });

  const approveMutation = useMutation({
    mutationFn: approveRequest,
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["pending_registrations_widget"] }); 
      qc.invalidateQueries({ queryKey: ["registration_requests"] }); 
      toast({ title: "Approved", description: "Registration approved.", variant: "success" }); 
    },
    onError: (err: any) => { toast({ title: "Approval Failed", description: err.message, variant: "destructive" }); },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectRequest,
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["pending_registrations_widget"] }); 
      qc.invalidateQueries({ queryKey: ["registration_requests"] }); 
      toast({ title: "Rejected", description: "Registration request rejected.", variant: "success" }); 
    },
    onError: (err: any) => { toast({ title: "Rejection Failed", description: err.message, variant: "destructive" }); },
  });

  const pendingRequests = data?.data || [];
  const totalPending = data?.total || 0;

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-md text-amber-600 dark:text-amber-400">
              <UserPlus className="w-4 h-4" />
            </div>
            Pending Registrations
            {totalPending > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                {totalPending}
              </span>
            )}
          </CardTitle>
          <Link href="/super-admin/registration-requests">
            <Button variant="ghost" size="sm" className="text-xs h-8 text-amber-600 hover:text-amber-700">
              Manage All
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="divide-y divide-border/50">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))
          ) : pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground min-h-[200px]">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <UserPlus className="w-5 h-5 opacity-40" />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs mt-1">No pending registration requests.</p>
            </div>
          ) : (
            pendingRequests.map((req: any) => (
              <div key={req._id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold truncate text-foreground/90">{req.fullName}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{req.requestedRole} Â· {req.email}</p>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-medium">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(req.submittedAt), { addSuffix: true })}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="w-8 h-8 rounded-full text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    title="Approve"
                    onClick={() => approveMutation.mutate(req._id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    {approveMutation.isPending && approveMutation.variables === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="w-8 h-8 rounded-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    title="Reject"
                    onClick={() => rejectMutation.mutate(req._id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    {rejectMutation.isPending && rejectMutation.variables === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
