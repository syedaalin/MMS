import React from "react";
import { LucideIcon } from "lucide-react";

interface ReportSummaryCardProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  sub?: string | null;
  color?: "primary" | "green" | "amber" | "red" | "blue" | "violet";
}

/**
 * ReportSummaryCard displays a single statistical metric card in reports.
 *
 * @param props - Component props.
 * @returns React.JSX.Element
 */
export default function ReportSummaryCard({
  icon: Icon,
  label,
  value,
  sub = null,
  color = "primary",
}: ReportSummaryCardProps): React.JSX.Element {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 text-primary shadow-sm shadow-primary/5",
    green:   "bg-emerald-500/10 text-emerald-600 shadow-sm shadow-emerald-500/5",
    amber:   "bg-amber-500/10 text-amber-600 shadow-sm shadow-amber-500/5",
    red:     "bg-rose-500/10 text-rose-600 shadow-sm shadow-rose-500/5",
    blue:    "bg-sky-500/10 text-sky-600 shadow-sm shadow-sky-500/5",
    violet:  "bg-indigo-500/10 text-indigo-600 shadow-sm shadow-indigo-500/5",
  };
  
  return (
    <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 p-4 flex items-center gap-3.5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group">
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${colors[color] || colors.primary}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0">
        <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">{label}</span>
        <p className="text-lg font-black text-foreground leading-none tracking-tight">{value}</p>
        {sub && <p className="text-[10px] font-semibold text-muted-foreground mt-1 opacity-70 truncate">{sub}</p>}
      </div>
    </div>
  );
}
