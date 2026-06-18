"use client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Info, AlertTriangle, Bell, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ReactNode } from "react";

const PRIORITY_STYLES: Record<string, { bg: string, text: string, icon: ReactNode }> = {
  URGENT: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" /> },
  MANDATORY: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" /> },
  UPDATE: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: <Info className="w-3.5 h-3.5 mr-1" /> },
  INFO: { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-400", icon: <Info className="w-3.5 h-3.5 mr-1" /> },
};

async function fetchLatestCirculars() {
  const res = await fetch("/api/announcements/latest");
  if (!res.ok) throw new Error("Failed to load");
  return res.json();
}

export default function CircularsWidget() {
  const { data: circulars, isLoading } = useQuery({
    queryKey: ["latest_circulars"],
    queryFn: fetchLatestCirculars,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-300 overflow-hidden group">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <div className="p-1.5 bg-brand-100 dark:bg-brand-900/40 rounded-md text-brand-600 dark:text-brand-400">
              <Bell className="w-4 h-4" />
            </div>
            Official Circulars
          </CardTitle>
          <Link href="/announcements">
            <Button variant="ghost" size="sm" className="text-xs h-8 text-brand-600 hover:text-brand-700 group-hover:bg-brand-50 dark:hover:bg-brand-900/20 px-2">
              View All State Directives
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="divide-y divide-border/50">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))
          ) : !circulars || circulars.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground min-h-[200px]">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Bell className="w-5 h-5 opacity-40" />
              </div>
              <p className="text-sm font-medium text-foreground/70">No active circulars</p>
              <p className="text-xs mt-1">There are currently no official announcements.</p>
            </div>
          ) : (
            circulars.map((circular: any) => {
              const style = PRIORITY_STYLES[circular.priority] || PRIORITY_STYLES.INFO;
              
              return (
                <div key={circular._id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-12 h-12 rounded overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={circular.imageUrl || "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=100&q=80"} 
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${style.bg} ${style.text}`}>
                          {style.icon}
                          {circular.priority}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold truncate text-foreground/90 mb-1" title={circular.title}>
                        {circular.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {circular.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground font-medium">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(circular.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
