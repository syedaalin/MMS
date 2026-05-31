import React from "react";
import { motion } from "framer-motion";
import { UserPlus, Calendar, ClipboardList, Star } from "lucide-react";

interface ActionItem {
  label: string;
  icon: React.ElementType;
  desc: string;
}

const actions: ActionItem[] = [
  { label: "Add Student", icon: UserPlus, desc: "Register a new student" },
  { label: "New Session", icon: Calendar, desc: "Schedule a class session" },
  { label: "Take Attendance", icon: ClipboardList, desc: "Mark today's attendance" },
  { label: "Award Hasanat", icon: Star, desc: "Give hasanat points" },
];

/**
 * QuickActions Component
 *
 * Displays a grid of quick action buttons for common administrative tasks.
 *
 * @returns {React.ReactElement} The quick actions section.
 */
export default function QuickActions() {
  return (
    <section aria-label="Quick Actions" className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.06, duration: 0.35 }}
            aria-label={action.label}
            className="group flex flex-col items-center gap-2.5 p-5 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.04] transition-all duration-300"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/8 group-hover:bg-primary/12 flex items-center justify-center transition-colors">
              <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground m-0">{action.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 m-0">{action.desc}</p>
            </div>
          </motion.button>
        );
      })}
    </section>
  );
}
