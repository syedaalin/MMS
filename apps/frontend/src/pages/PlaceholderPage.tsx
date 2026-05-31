import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import {
  UserCheck, BarChart3, ClipboardList,
} from "lucide-react";

const PAGE_CONFIG = {
  "/enrollments": {
    title: "Enrollments",
    subtitle: "Manage student session enrollments and registrations",
    icon: ClipboardList,
    color: "text-blue-600",
    bg: "bg-blue-50",
    eta: "Coming in next sprint",
  },
  "/attendance": {
    title: "Attendance",
    subtitle: "Track daily student and teacher attendance",
    icon: UserCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    eta: "Coming in next sprint",
  },
  "/reports": {
    title: "Reports",
    subtitle: "Advanced analytics and exportable reports",
    icon: BarChart3,
    color: "text-violet-600",
    bg: "bg-violet-50",
    eta: "Coming soon",
  },
};

/**
 * PlaceholderPage Component
 *
 * Renders a stylized placeholder page for system features that are still under development
 * (e.g., Reports, Enrollments, Attendance). Displays development progress, target release estimates,
 * and relevant placeholder icons based on the active browser path.
 *
 * @returns React element representing the placeholder page.
 */
export default function PlaceholderPage() {
  const location = useLocation();
  const pathname = location.pathname;
  const cfg = (pathname in PAGE_CONFIG)
    ? PAGE_CONFIG[pathname as keyof typeof PAGE_CONFIG]
    : {
        title: "Coming Soon",
        subtitle: "This section is being built.",
        icon: ClipboardList,
        color: "text-primary",
        bg: "bg-primary/10",
        eta: "Coming soon",
      };
  const Icon = cfg.icon;

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center min-h-[65vh] text-center"
      >
        {/* Icon */}
        <div className={`w-20 h-20 rounded-3xl ${cfg.bg} flex items-center justify-center mb-6 shadow-sm`}>
          <Icon className={`w-10 h-10 ${cfg.color}`} />
        </div>

        {/* Text */}
        <h1 className="text-2xl font-bold text-foreground">{cfg.title}</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">{cfg.subtitle}</p>

        {/* ETA chip */}
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-muted-foreground">{cfg.eta}</span>
        </div>

        {/* Feature list */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg w-full">
          {[
            { label: "Data Entry", done: false },
            { label: "Reports", done: false },
            { label: "Exports", done: false },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-card border border-border text-left">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${f.done ? "bg-emerald-500" : "bg-border"}`} />
              <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}