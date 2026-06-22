"use client";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

async function fetchPendingRequests() {
  const res = await fetch("/api/admin/registration-requests?status=PENDING&limit=3");
  if (!res.ok) throw new Error("Failed to load");
  return res.json();
}

export default function AdminNotificationBell() {
  const { data } = useQuery({
    queryKey: ["pending_registrations_widget"],
    queryFn: fetchPendingRequests,
    refetchInterval: 60000,
  });

  const totalPending = data?.total || 0;
  const recentRequests = data?.data || [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-4 h-4" />
          {totalPending > 0 && (
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-1 ring-background">
              {totalPending > 9 ? "9+" : totalPending}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex flex-wrap items-center justify-between gap-2">
          <span>Notifications</span>
          {totalPending > 0 && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{totalPending} New</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {totalPending > 0 ? (
          <div className="max-h-64 overflow-y-auto">
            {recentRequests.map((req: any) => (
              <DropdownMenuItem key={req._id} asChild className="p-3 cursor-pointer">
                <Link href="/super-admin/registration-requests" className="flex flex-col gap-1 items-start">
                  <div className="flex justify-between w-full">
                    <span className="font-semibold text-sm">{req.fullName}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(req.submittedAt))} ago
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate w-full">
                    Requested Role: {req.requestedRole}
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No new notifications
          </div>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="p-2 cursor-pointer text-center text-brand-600 font-medium">
          <Link href="/super-admin/registration-requests" className="w-full text-center">
            View All Registration Requests
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
