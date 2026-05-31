import React from "react";
import { motion } from "framer-motion";
import {
  UserPlus, CalendarPlus, DollarSign,
  Star, FileText, Printer, BarChart3, UserCheck,
} from "lucide-react";
import { UserRole } from "../../lib/dashboardData";
import { getObject } from "../../lib/db";
import { type GlobalSettings, DEFAULT_GLOBAL_SETTINGS } from "../../lib/settingsTypes";

interface ActionSetItem {
  label: string;
  icon: React.ElementType;
  color: "emerald" | "blue" | "amber" | "violet" | "slate";
  desc: string;
  moduleId: string;
}

const ACTION_SETS: Record<string, ActionSetItem[]> = {
  admin: [
    { label: "Add Student",      icon: UserPlus,      color: "emerald", desc: "Enrol a new student",     moduleId: "enrollment" },
    { label: "Create Session",   icon: CalendarPlus,  color: "blue",    desc: "Schedule a class",        moduleId: "sessions" },
    { label: "Record Payment",   icon: DollarSign,    color: "amber",   desc: "Log a fee payment",       moduleId: "finance" },
    { label: "Take Attendance",  icon: UserCheck,     color: "violet",  desc: "Mark today's attendance", moduleId: "attendance" },
    { label: "Award Hasanat",    icon: Star,          color: "amber",   desc: "Give reward points",      moduleId: "hasanat" },
    { label: "Generate Report",  icon: BarChart3,     color: "slate",   desc: "Export data report",      moduleId: "reports" },
  ],
  teacher: [
    { label: "Take Attendance",  icon: UserCheck,     color: "emerald", desc: "Mark today's attendance", moduleId: "attendance" },
    { label: "Award Hasanat",    icon: Star,          color: "amber",   desc: "Give reward points",      moduleId: "hasanat" },
    { label: "Add Student",      icon: UserPlus,      color: "blue",    desc: "Enrol a new student",     moduleId: "enrollment" },
    { label: "Create Session",   icon: CalendarPlus,  color: "violet",  desc: "Schedule a class",        moduleId: "sessions" },
  ],
  accountant: [
    { label: "Record Payment",   icon: DollarSign,    color: "emerald", desc: "Log a fee payment",       moduleId: "finance" },
    { label: "Generate Report",  icon: BarChart3,     color: "blue",    desc: "Export data report",      moduleId: "reports" },
    { label: "Print Receipt",    icon: Printer,       color: "amber",   desc: "Print payment receipt",   moduleId: "finance" },
    { label: "View Ledger",      icon: FileText,      color: "violet",  desc: "Open fee ledger",         moduleId: "accounting" },
  ],
};

const COLOR: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  blue:    "bg-blue-50 text-blue-700",
  amber:   "bg-amber-50 text-amber-700",
  violet:  "bg-violet-50 text-violet-700",
  slate:   "bg-slate-100 text-slate-600",
};

interface QuickActionsPanelProps {
  role: UserRole | string;
}

/**
 * QuickActionsPanel Component
 *
 * Displays a grid of role-specific quick actions to navigate
 * directly to frequent tasks.
 *
 * @param {QuickActionsPanelProps} props - The component properties.
 * @returns {React.ReactElement} The quick actions panel.
 */
export default function QuickActionsPanel({ role }: QuickActionsPanelProps) {
  const settings = getObject<GlobalSettings>("global_settings", DEFAULT_GLOBAL_SETTINGS);
  const enabledModules = settings.enabledModules || {};

  const allActions = ACTION_SETS[role] || ACTION_SETS.admin;
  const actions = allActions.filter(a => enabledModules[a.moduleId] !== false);

  if (actions.length === 0) return null;

  return (
    <section aria-labelledby="quick-actions-panel-heading" className="bg-card rounded-xl border border-border p-5">
      <h3 id="quick-actions-panel-heading" className="text-sm font-semibold text-foreground mb-4 m-0">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              aria-label={action.label}
              className="group flex flex-col items-start gap-2.5 p-3.5 rounded-xl border border-border hover:border-primary/20 hover:shadow-md hover:shadow-primary/[0.04] transition-all duration-200 text-left"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${COLOR[action.color]}`} aria-hidden="true">
                <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground m-0">{action.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 m-0">{action.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
