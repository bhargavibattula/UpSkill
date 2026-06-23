"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Megaphone, Loader2, Info, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow, format } from "date-fns";
import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

async function fetchPublicAnnouncements(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/announcements?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

const PRIORITY_STYLES: Record<string, { bg: string, text: string, icon: ReactNode }> = {
  URGENT: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" /> },
  MANDATORY: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" /> },
  UPDATE: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: <Info className="w-3.5 h-3.5 mr-1" /> },
  INFO: { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-400", icon: <Info className="w-3.5 h-3.5 mr-1" /> },
};

export default function AnnouncementsListClient() {
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [viewAnnouncement, setViewAnnouncement] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["public_announcements", { search, priority, page }],
    queryFn: () => fetchPublicAnnouncements({ search, priority, page: String(page), limit: "12" }),
  });

  // Filter out inactive or expired for the public view just in case, 
  // although the API might return everything. Actually, the public should only see active.
  const publicAnnouncements = data?.data?.filter((a: any) => 
    a.isActive && (!a.expiryDate || new Date(a.expiryDate) > new Date())
  ) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4 bg-muted/20 border-b border-border/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-brand-600" /> State Directives & Circulars
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search circulars..." 
                  className="pl-9 h-10 w-full"
                  value={search} 
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
                />
              </div>
              <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm w-full sm:w-auto dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:border-slate-700"
                value={priority} 
                onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              >
                <option value="">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="MANDATORY">Mandatory</option>
                <option value="UPDATE">Update</option>
                <option value="INFO">Info</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
             <div className="flex items-center justify-center py-20">
               <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
             </div>
          ) : !publicAnnouncements.length ? (
             <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center">
               <Megaphone className="w-16 h-16 mb-4 opacity-20" />
               <h3 className="text-lg font-medium text-foreground">No circulars found</h3>
               <p className="text-sm mt-1 max-w-sm">We couldn't find any official announcements matching your search criteria.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicAnnouncements.map((circular: any) => {
                const style = PRIORITY_STYLES[circular.priority] || PRIORITY_STYLES.INFO;
                return (
                  <div 
                    key={circular._id} 
                    className="flex flex-col bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-brand-200 cursor-pointer group"
                    onClick={() => setViewAnnouncement(circular)}
                  >
                    <div className="p-5 flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${style.bg} ${style.text}`}>
                          {style.icon}
                          {circular.priority}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDistanceToNow(new Date(circular.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mb-2 group-hover:text-brand-600 transition-colors line-clamp-2">
                        {circular.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {circular.description}
                      </p>
                    </div>
                    <div className="px-5 py-3 bg-muted/30 border-t flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground/70">
                        {format(new Date(circular.createdAt), "MMMM d, yyyy")}
                      </span>
                      <span className="text-xs font-semibold text-brand-600 group-hover:translate-x-1 transition-transform">
                        Read more â†’
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t">
              <p className="text-sm text-muted-foreground">Showing page {page} of {data.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewAnnouncement} onOpenChange={() => setViewAnnouncement(null)}>
        <DialogContent className="max-w-3xl border-0 p-0 overflow-hidden shadow-2xl">
          {viewAnnouncement && (
            <>
              <div className={`p-6 border-b ${PRIORITY_STYLES[viewAnnouncement.priority]?.bg}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-white/80 ${PRIORITY_STYLES[viewAnnouncement.priority]?.text}`}>
                    {PRIORITY_STYLES[viewAnnouncement.priority]?.icon}
                    {viewAnnouncement.priority} DIRECTIVE
                  </span>
                  <span className="text-sm text-foreground/70 flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4" />
                    Published {format(new Date(viewAnnouncement.createdAt), "MMMM d, yyyy")}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-foreground leading-tight">{viewAnnouncement.title}</h2>
              </div>
              <div className="p-8">
                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-foreground/90">
                  {viewAnnouncement.description}
                </div>
                
                <div className="mt-8 pt-6 border-t flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                      {viewAnnouncement.createdBy?.name?.charAt(0) || "S"}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{viewAnnouncement.createdBy?.name || "System Administrator"}</p>
                      <p className="text-xs">Official Authority</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setViewAnnouncement(null)}>Close</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
