"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Building2, MapPin, Users, ClipboardList,
  UtensilsCrossed, Image, Video, BarChart3, Settings, LogOut,
  GraduationCap, FileText, Tag, Layers, ChevronDown, Shield, Bell, Target
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types";
import { getRoleColor } from "@/lib/utils";
import { useState, useEffect } from "react";

const NAV_CONFIG: Record<string, { label: string; icon: React.ElementType; href: string; badge?: string }[]> = {
  SUPER_ADMIN: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/super-admin" },
    { label: "Districts", icon: MapPin, href: "/super-admin/districts" },
    { label: "Mandals", icon: Building2, href: "/super-admin/mandals" },
    { label: "Venues", icon: Building2, href: "/super-admin/venues" },
    { label: "Programs", icon: GraduationCap, href: "/super-admin/programs" },
    { label: "Participants", icon: Users, href: "/super-admin/participants" },
    { label: "Attendance", icon: ClipboardList, href: "/super-admin/attendance" },
    { label: "Food Records", icon: UtensilsCrossed, href: "/super-admin/food" },
    { label: "Image Gallery", icon: Image, href: "/gallery" },
    { label: "Analytics", icon: BarChart3, href: "/super-admin/analytics" },
    { label: "Reports", icon: FileText, href: "/super-admin/reports" },
    { label: "Users", icon: Shield, href: "/super-admin/users" },
    { label: "Target Attendance", icon: Target, href: "/super-admin/custom-fields" },
    { label: "Audit Logs", icon: ClipboardList, href: "/super-admin/audit" },
  ],
  STATE_ADMIN: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/state-admin" },
    { label: "Programs", icon: GraduationCap, href: "/state-admin/programs" },
    { label: "Image Gallery", icon: Image, href: "/gallery" },
    { label: "Analytics", icon: BarChart3, href: "/state-admin/analytics" },
    { label: "Reports", icon: FileText, href: "/state-admin/reports" },
  ],
  DISTRICT_ADMIN: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/district-admin" },
    { label: "Venues", icon: Building2, href: "/district-admin/venues" },
    { label: "Programs", icon: GraduationCap, href: "/district-admin/programs" },
    { label: "Participants", icon: Users, href: "/district-admin/participants" },
    { label: "Attendance", icon: ClipboardList, href: "/district-admin/attendance" },
    { label: "Image Gallery", icon: Image, href: "/gallery" },
    { label: "Reports", icon: FileText, href: "/district-admin/reports" },
    { label: "Analytics", icon: BarChart3, href: "/district-admin/analytics" },
  ],
  MANDAL_ADMIN: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/mandal-admin" },
    { label: "Programs", icon: GraduationCap, href: "/mandal-admin/programs" },
    { label: "Participants", icon: Users, href: "/mandal-admin/participants" },
    { label: "Attendance", icon: ClipboardList, href: "/mandal-admin/attendance" },
    { label: "Food Records", icon: UtensilsCrossed, href: "/mandal-admin/food" },
    { label: "Image Gallery", icon: Image, href: "/gallery" },
  ],
  VENUE_ADMIN: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/mandal-admin" },
    { label: "Programs", icon: GraduationCap, href: "/mandal-admin/programs" },
    { label: "Participants", icon: Users, href: "/mandal-admin/participants" },
    { label: "Attendance", icon: ClipboardList, href: "/mandal-admin/attendance" },
    { label: "Food Records", icon: UtensilsCrossed, href: "/mandal-admin/food" },
    { label: "Image Gallery", icon: Image, href: "/gallery" },
  ],
  TEACHER: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/teacher" },
    { label: "My Trainings", icon: GraduationCap, href: "/teacher/trainings" },
    { label: "Attendance", icon: ClipboardList, href: "/teacher/attendance" },
    { label: "Image Gallery", icon: Image, href: "/gallery" },
    { label: "Certificates", icon: FileText, href: "/teacher/certificates" },
  ],
  TRAINER: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/trainer" },
    { label: "Assigned Programs", icon: GraduationCap, href: "/trainer/programs" },
    { label: "Attendance", icon: ClipboardList, href: "/trainer/attendance" },
    { label: "Image Gallery", icon: Image, href: "/gallery" },
    { label: "Feedback", icon: FileText, href: "/trainer/feedback" },
  ],
  STAFF: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/staff" },
    { label: "Assigned Programs", icon: GraduationCap, href: "/staff/trainings" },
    { label: "Image Gallery", icon: Image, href: "/gallery" },
  ],
  STUDENT: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/student" },
    { label: "My Enrollments", icon: GraduationCap, href: "/student/enrollments" },
    { label: "Attendance", icon: ClipboardList, href: "/student/attendance" },
    { label: "Image Gallery", icon: Image, href: "/gallery" },
    { label: "My Certificates", icon: FileText, href: "/student/certificates" },
  ],
};

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeId: string;
  avatar?: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  // Fetch session from our custom endpoint instead of using broken useSession()
  useEffect(() => {
    fetch("/api/auth/custom-session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(console.error);
  }, []);

  const role = user?.role as UserRole;
  const navItems = NAV_CONFIG[role] || [];
  const userName = user?.name || "User";
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/custom-logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      // Even if the request fails, try to redirect
      router.push("/login");
    }
  };

  return (
    <aside className={cn("flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 sticky top-0", collapsed ? "w-16" : "w-64")}>
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border select-none">
        <div 
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center cursor-pointer hover:bg-brand-700 transition-colors"
          onClick={() => collapsed ? setCollapsed(false) : router.push(navItems[0]?.href || "/")}
          title={collapsed ? "Expand sidebar" : "Go to Dashboard"}
        >
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <>
            <div 
              className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push(navItems[0]?.href || "/")}
            >
              <p className="text-sm font-bold text-sidebar-foreground truncate">Gnana Prakash</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">TMS Portal</p>
            </div>
            <div 
              className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors ml-auto cursor-pointer p-1 rounded hover:bg-sidebar-accent/50"
              onClick={() => setCollapsed(!collapsed)}
              title="Collapse sidebar"
            >
              <ChevronDown className={cn("w-4 h-4 transition-transform", collapsed ? "-rotate-90" : "rotate-90")} />
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <Link key={item.href} href={item.href}
              className={cn("sidebar-item", isActive && "active", collapsed && "justify-center px-2")}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && item.badge && <Badge variant="info" className="text-xs py-0 px-1.5">{item.badge}</Badge>}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-xs bg-brand-700 text-white">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{userName}</p>
              <p className={cn("text-xs px-1.5 py-0.5 rounded-full inline-block mt-0.5", getRoleColor(role))}>{role?.replace("_", " ")}</p>
            </div>
            <button onClick={handleLogout}
              className="text-sidebar-foreground/50 hover:text-rose-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout}
            className="w-full flex justify-center text-sidebar-foreground/50 hover:text-rose-400 transition-colors p-1">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
