"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Shield, Loader2, MoreHorizontal, UserCheck, UserX, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getRoleColor, formatDate } from "@/lib/utils";

async function fetchUsers(params: Record<string, string>) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v))).toString();
  const res = await fetch(`/api/users?${qs}`);
  return res.json();
}

export default function UsersClient() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Record<string, any> | null>(null);
  const qc = useQueryClient();

  const handleEdit = (user: Record<string, any>) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setShowForm(true);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["users", { search, role, page }],
    queryFn: () => fetchUsers({ search, role, page: String(page), limit: "20" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-base">User Management</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 sm:flex-none w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-9 h-9 w-56 text-sm" value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:border-slate-700"
                value={role} onChange={e => setRole(e.target.value)}>
                <option value="">All Roles</option>
                {["SUPER_ADMIN","STATE_ADMIN","DISTRICT_ADMIN","MANDAL_ADMIN","VENUE_ADMIN","TEACHER","TRAINER","STAFF"].map(r => (
                  <option key={r} value={r}>{r.replace("_", " ")}</option>
                ))}
              </select>
              <Button size="sm" className="gap-2 whitespace-nowrap" onClick={handleAdd}>
                <Plus className="w-4 h-4" /> Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>
          ) : !data?.data?.length ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Shield className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>User</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((user: Record<string, any>) => {
                  const initials = user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs bg-brand-100 text-brand-700">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{user.employeeId}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{user.district?.name || "â€”"}</TableCell>
                      <TableCell className="text-sm font-mono">{user.mobile}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2 whitespace-nowrap" onClick={() => handleEdit(user)}><Pencil className="w-3.5 h-3.5" />Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 whitespace-nowrap" onClick={() => toggleActive.mutate({ id: user._id, isActive: !user.isActive })}>
                              {user.isActive ? <><UserX className="w-3.5 h-3.5" />Deactivate</> : <><UserCheck className="w-3.5 h-3.5" />Activate</>}
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

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setSelectedUser(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedUser ? "Edit User" : "Add New User"}</DialogTitle></DialogHeader>
          <UserForm 
            user={selectedUser} 
            onSuccess={() => { 
              setShowForm(false); 
              setSelectedUser(null);
              qc.invalidateQueries({ queryKey: ["users"] }); 
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserForm({ user, onSuccess }: { user?: Record<string, any> | null; onSuccess: () => void }) {
  const [data, setData] = useState({
    employeeId: user?.employeeId || "",
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    mobile: user?.mobile || "",
    role: user?.role || "TEACHER",
    designation: user?.designation || "",
    department: user?.department || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const url = user ? `/api/users/${user._id}` : "/api/users";
      const method = user ? "PUT" : "POST";
      
      const payload = { ...data };
      if (user) {
        delete (payload as any).password;
      }

      const res = await fetch(url, { 
        method, 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });
      
      if (!res.ok) { 
        const err = await res.json(); 
        setError(err.error || "Failed"); 
        return; 
      }
      onSuccess();
    } catch { 
      setError("Network error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const set = (k: string, v: string) => setData(p => ({ ...p, [k]: v }));

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1"><label className="text-sm font-medium">Employee ID *</label><Input value={data.employeeId} onChange={e => set("employeeId", e.target.value)} required /></div>
        <div className="space-y-1"><label className="text-sm font-medium">Full Name *</label><Input value={data.name} onChange={e => set("name", e.target.value)} required /></div>
        <div className="space-y-1"><label className="text-sm font-medium">Email *</label><Input type="email" value={data.email} onChange={e => set("email", e.target.value)} required /></div>
        <div className="space-y-1"><label className="text-sm font-medium">Mobile *</label><Input value={data.mobile} onChange={e => set("mobile", e.target.value)} required /></div>
        
        {!user && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Password *</label>
            <Input type="password" value={data.password} onChange={e => set("password", e.target.value)} required minLength={8} />
          </div>
        )}
        
        <div className="space-y-1"><label className="text-sm font-medium">Role *</label>
          <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:border-slate-700" value={data.role} onChange={e => set("role", e.target.value)}>
            {["SUPER_ADMIN","STATE_ADMIN","DISTRICT_ADMIN","MANDAL_ADMIN","VENUE_ADMIN","TEACHER","TRAINER","STAFF"].map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
          </select>
        </div>
        <div className="space-y-1"><label className="text-sm font-medium">Designation</label><Input value={data.designation} onChange={e => set("designation", e.target.value)} /></div>
        <div className="space-y-1"><label className="text-sm font-medium">Department</label><Input value={data.department} onChange={e => set("department", e.target.value)} /></div>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading} className="gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />} 
          {user ? "Save Changes" : "Create User"}
        </Button>
      </div>
    </form>
  );
}
