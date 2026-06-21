"use client";
import { Bell, Moon, Sun, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePathname } from "next/navigation";
import AdminNotificationBell from "@/components/shared/AdminNotificationBell";

interface TopBarProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  showBell?: boolean;
}

export default function TopBar({ title, subtitle, showSearch, showBell }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const displaySearch = showSearch !== undefined ? showSearch : !pathname?.startsWith("/super-admin");
  const displayBell = showBell !== undefined ? showBell : !pathname?.startsWith("/super-admin");

  return (
    <header className="sticky top-0 z-30 flex min-h-16 py-3 items-center gap-4 border-b bg-background/95 backdrop-blur-sm pr-4 pl-16 md:px-6">
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {displaySearch && (
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 h-8 w-56 text-xs bg-muted border-0" />
          </div>
        )}
        {displayBell && (
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
            <Bell className="w-4 h-4" />
          </Button>
        )}
        {pathname?.startsWith("/super-admin") && (
          <AdminNotificationBell />
        )}
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  );
}
