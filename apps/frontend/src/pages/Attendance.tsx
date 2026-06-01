import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck, ClipboardEdit, BookOpen, BarChart2, Settings,
  ShieldCheck, ClipboardList, LayoutDashboard
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import AttendanceFilters from "../components/attendance/AttendanceFilters";
import MarkAttendance from "../components/attendance/MarkAttendance";
import AttendanceRecords from "../components/attendance/AttendanceRecords";
import AttendanceAnalytics from "../components/attendance/AttendanceAnalytics";
import AttendanceSettings from "../components/attendance/AttendanceSettings";
import AuditLog from "../components/attendance/AuditLog";
import ModuleReports from "../components/reports/ModuleReports";
import KPISummary from "../components/reports/KPISummary";
import { getCollection, saveCollection, getObject, saveObject } from "../lib/db";
import { ATTENDANCE_RECORDS, DEFAULT_ATT_SETTINGS } from "../lib/attendanceData";

const ATTENDANCE_SETTINGS_SUB_TABS = [
  { id: "fields", label: "Fields" },
  { id: "preferences", label: "Preferences" },
];

const ROLES = ["admin", "teacher", "accountant"] as const;
const ROLE_BADGE = {
  admin:      "bg-primary/10 text-primary",
  teacher:    "bg-amber-50 text-amber-700",
  accountant: "bg-blue-50 text-blue-700",
};

const DEFAULT_FILTERS = {
  sessionId: "",
  classId: "",
  teacherId: "",
  date: new Date().toISOString().slice(0, 10),
};

const PAGE_TABS = [
  { id: "operations",    label: "Operations",    icon: LayoutDashboard },
  { id: "analytics",     label: "Analytics",     icon: BarChart2 },
  { id: "configuration", label: "Configuration", icon: Settings },
];

/**
 * Attendance page component.
 * Allows tracking, managing, and analyzing student attendance.
 * 
 * @returns {React.ReactElement} The Attendance page component.
 */
export default function Attendance() {
  const [role, setRole]       = useState<typeof ROLES[number]>("admin");
  const [activeTab, setActiveTab] = useState("operations");
  const [activeOpsTab, setActiveOpsTab] = useState("mark");
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState("charts");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [records, setRecords] = useState(() => getCollection("attendance_records", ATTENDANCE_RECORDS));
  const [settings, setSettings] = useState(() => getObject("attendance_settings", DEFAULT_ATT_SETTINGS));
  const [subTab, setSubTab]   = useState("fields");

  useEffect(() => {
    saveCollection("attendance_records", records);
  }, [records]);

  useEffect(() => {
    saveObject("attendance_settings", settings);
  }, [settings]);

  const visibleTopTabs = PAGE_TABS.filter((t) => {
    if (t.id === "configuration") return role === "admin";
    if (t.id === "analytics") return role === "admin" || role === "teacher";
    return true;
  });

  const visibleOperationsTabs = [
    { id: "mark",      label: "Mark Attendance", icon: ClipboardEdit, roles: ["admin", "teacher"] },
    { id: "records",   label: "Records",         icon: BookOpen,      roles: ["admin", "teacher", "accountant"] },
    { id: "audit",     label: "Audit Log",       icon: ClipboardList, roles: ["admin"] },
  ].filter((t) => t.roles.includes(role));

  const visibleAnalyticsTabs = [
    { id: "charts",    label: "Analytics Charts", icon: BarChart2, roles: ["admin", "teacher"] },
    { id: "reports",   label: "Reports",          icon: ClipboardList, roles: ["admin", "teacher"] },
  ].filter((t) => t.roles.includes(role));

  const effectiveTab = visibleTopTabs.find((t) => t.id === activeTab) ? activeTab : "operations";
  const effectiveOpsTab = visibleOperationsTabs.find((t) => t.id === activeOpsTab) ? activeOpsTab : (visibleOperationsTabs[0]?.id || "records");
  const effectiveAnalyticsTab = visibleAnalyticsTabs.find((t) => t.id === activeAnalyticsTab) ? activeAnalyticsTab : (visibleAnalyticsTabs[0]?.id || "reports");

  const renderContent = () => {
    if (effectiveTab === "configuration") {
      return (
        <div className="space-y-4">
          <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
            {ATTENDANCE_SETTINGS_SUB_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  subTab === t.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <AttendanceSettings role={role} settings={settings} setSettings={setSettings} mode={subTab as "fields" | "preferences"} />
        </div>
      );
    }

    if (effectiveTab === "analytics") {
      return (
        <div className="space-y-5">
          <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl w-fit border border-border/30 overflow-x-auto max-w-full">
            {visibleAnalyticsTabs.map((t) => {
              const active = effectiveAnalyticsTab === t.id;
              return (
                <button key={t.id} onClick={() => setActiveAnalyticsTab(t.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {t.label}
                </button>
              );
            })}
          </div>

          {effectiveAnalyticsTab === "charts" ? (
            <AttendanceAnalytics filters={filters} records={records} />
          ) : (
            <ModuleReports category="attendance" role={role} />
          )}
        </div>
      );
    }

    // Operations Tab
    return (
      <div className="space-y-5">
        {visibleOperationsTabs.length > 1 && (
          <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl w-fit border border-border/30 overflow-x-auto max-w-full">
            {visibleOperationsTabs.map((t) => {
              const active = effectiveOpsTab === t.id;
              return (
                <button key={t.id} onClick={() => setActiveOpsTab(t.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {t.label}
                </button>
              );
            })}
          </div>
        )}

        {(() => {
          switch (effectiveOpsTab) {
            case "mark":    return <MarkAttendance filters={filters} role={role} records={records} setRecords={setRecords} />;
            case "records": return <AttendanceRecords filters={filters} role={role} records={records} setRecords={setRecords} />;
            case "audit":   return <AuditLog filters={filters} />;
            default:        return null;
          }
        })()}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Attendance Tracker</title>
      <meta name="description" content="Track student daily attendance, view real-time class stats, and perform attendance auditing." />
      <PageHeader
        icon={UserCheck}
        title="Attendance"
        subtitle="Track, manage and analyse student attendance across all sessions and classes"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Role switcher */}
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1">View as:</span>
              {ROLES.map((r) => (
                <button key={r} onClick={() => setRole(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${role === r ? ROLE_BADGE[r] : "text-muted-foreground hover:text-foreground"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="space-y-4">
        <KPISummary category="attendance" role={role} />
      </div>

      {/* Primary Tabs */}
      {visibleTopTabs.length > 1 && (
        <div className="flex border-b border-border overflow-x-auto gap-0">
          {visibleTopTabs.map((t) => {
            const Icon = t.icon;
            const active = effectiveTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Role info banner */}
      {role !== "admin" && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${ROLE_BADGE[role]} border border-current/20`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-bold capitalize">{role} view:</span>
          {role === "teacher"    && "Can mark and view attendance for assigned classes. No admin settings access."}
          {role === "accountant" && "View-only access to attendance records."}
        </div>
      )}

      {/* Global Filters */}
      <AttendanceFilters filters={filters} onChange={setFilters} />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={effectiveTab + "-" + effectiveOpsTab + "-" + role}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}