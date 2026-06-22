import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export default function StatCard({ title, value, subtitle, icon: Icon, iconColor = "text-brand-600", iconBg = "bg-brand-50 dark:bg-brand-950", trend, className }: StatCardProps) {
  return (
    <div className={cn("stat-card", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{typeof value === "number" ? value.toLocaleString() : value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend && (
            <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", trend.value >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl flex-shrink-0", iconBg)}>
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
      </div>
    </div>
  );
}
