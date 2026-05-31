import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Calendar } from "lucide-react";
import { getCollection } from "../../lib/db";
import { SESSIONS_DATA } from "../../lib/sessionsData";
import { INVOICES } from "../../lib/financeData";
import { STUDENTS } from "../../lib/studentsData";

interface RoleMeta {
  greeting: string;
  badge: string;
}

const ROLE_META: Record<string, RoleMeta> = {
  admin: {
    greeting: "Assalamu Alaikum, Admin",
    badge: "Administrator",
  },
  teacher: {
    greeting: "Assalamu Alaikum, Teacher",
    badge: "Teacher",
  },
  accountant: {
    greeting: "Assalamu Alaikum, Accountant",
    badge: "Accountant",
  },
};

interface WelcomeBannerProps {
  role?: "admin" | "teacher" | "accountant" | string;
}

/**
 * WelcomeBanner Component
 *
 * Displays a welcoming header for the dashboard with role-specific messaging
 * and the current date. Uses an attractive gradient background with subtle animations.
 *
 * @param {WelcomeBannerProps} props - The component properties.
 * @returns {React.ReactElement} The welcome banner header.
 */
export default function WelcomeBanner({ role = "admin" }: WelcomeBannerProps) {
  const meta = ROLE_META[role] || ROLE_META.admin;
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let subtitle = "Here's your complete madrasa overview for today.";
  
  if (role === "teacher") {
    try {
      const sessions = getCollection("sessions", SESSIONS_DATA);
      const teacherSessionsCount = sessions.filter((s) => (s.classes || []).some((c) => c.teacherId === "t1" || c.teacherName?.includes("Ibrahim"))).length;
      subtitle = `You have ${teacherSessionsCount} session${teacherSessionsCount === 1 ? "" : "s"} scheduled today.`;
    } catch (e) {
      subtitle = "You have sessions scheduled today.";
    }
  } else if (role === "accountant") {
    try {
      const invoices = getCollection("finance_invoices", INVOICES);
      let totalCollected = 0;
      let totalOutstanding = 0;
      let outstandingCount = 0;
      invoices.forEach((inv) => {
        if (inv.status === "cancelled") return;
        if (inv.status === "paid") {
          totalCollected += inv.finalAmt;
        } else if (inv.status === "partial") {
          totalCollected += inv.paidAmt || 0;
          totalOutstanding += (inv.finalAmt - (inv.paidAmt || 0));
          outstandingCount++;
        } else {
          totalOutstanding += inv.finalAmt;
          outstandingCount++;
        }
      });
      const totalTarget = totalCollected + totalOutstanding;
      const collectedPct = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;
      subtitle = `Fee collection stands at ${collectedPct}%. ${outstandingCount} payment${outstandingCount === 1 ? "" : "s"} remain outstanding.`;
    } catch (e) {
      subtitle = "Manage fee collections and outstanding payments.";
    }
  } else if (role === "admin") {
    try {
      const students = getCollection("students", STUDENTS);
      const activeCount = students.filter(s => s.status === "active").length;
      subtitle = `Here is your madrasa overview. Currently managing ${activeCount} active student${activeCount === 1 ? "" : "s"}.`;
    } catch (e) {
      subtitle = "Here's your complete madrasa overview for today.";
    }
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-emerald-800 to-emerald-900 p-6 md:p-7 text-primary-foreground"
    >
      {/* Rings */}
      <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full border border-white/[0.07]" aria-hidden="true" />
      <div className="absolute -top-12 -right-4  w-48 h-48 rounded-full border border-white/[0.05]" aria-hidden="true" />
      <div className="absolute bottom-0 left-1/4 w-56 h-56 rounded-full border border-white/[0.04] translate-y-1/2" aria-hidden="true" />

      {/* Star ornament */}
      <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-28 h-28 opacity-[0.07]" viewBox="0 0 200 200" fill="white" aria-hidden="true">
        <polygon points="100,10 118,70 180,70 130,108 148,168 100,132 52,168 70,108 20,70 82,70" />
        <polygon points="100,30 112,72 158,72 122,98 134,140 100,116 66,140 78,98 42,72 88,72" />
      </svg>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
            <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">{meta.badge}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight m-0">{meta.greeting}</h1>
          <p className="text-sm text-white/65 mt-1 max-w-lg mb-0">{subtitle}</p>
        </div>

        {/* Date pill */}
        <div className="flex-shrink-0 flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-2.5 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-white/70" aria-hidden="true" />
          <span className="text-[12px] font-medium text-white/80 whitespace-nowrap">{today}</span>
        </div>
      </div>
    </motion.header>
  );
}

