import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, UserCheck, BarChart2, Settings, LayoutDashboard } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import EnrollmentWizard from "../components/enrollment/EnrollmentWizard";
import EnrollmentList from "../components/enrollment/EnrollmentList";
import EnrollmentDetail from "../components/enrollment/EnrollmentDetail";
import EligibilityCheck from "../components/enrollment/EligibilityCheck";
import EnrollmentReports from "../components/enrollment/EnrollmentReports";
import EnrollmentsSettings from "../components/enrollment/EnrollmentsSettings";
import ModuleReports from "../components/reports/ModuleReports";
import KPISummary from "../components/reports/KPISummary";
import ErrorBoundary from "../components/ui/ErrorBoundary";
import { SAMPLE_ENROLLMENTS, Enrollment } from "../lib/enrollmentData";
import { STUDENTS } from "../lib/studentsData";
import { getCollection, saveCollection } from "../lib/db";

const TABS = [
  { id: "operations",    label: "Operations",    icon: LayoutDashboard },
  { id: "analytics",     label: "Analytics",     icon: BarChart2 },
  { id: "configuration", label: "Configuration", icon: Settings },
];

const SUB_TABS = [
  { id: "list",        label: "Enrollment List",  icon: ClipboardList },
  { id: "new",         label: "New Enrollment",   icon: Plus },
  { id: "eligibility", label: "Eligibility Check", icon: UserCheck },
];

const ROLE_OPTIONS = ["admin", "staff", "accountant"];

const ENROLLMENT_SETTINGS_SUB_TABS = [
  { id: "fields", label: "Fields & Preferences" },
];

/**
 * Enrollments management page.
 * Allows managing student enrollment into sessions and classes with Dashboard and Settings tabs.
 * 
 * @returns {React.ReactElement} The Enrollments page component.
 */
export default function Enrollments() {
  const [tab, setTab]                 = useState("operations");
  const [activeSubTab, setActiveSubTab] = useState("list");
  const [role, setRole]               = useState("admin");
  const [enrollments, setEnrollments] = useState<Enrollment[]>(() => getCollection("enrollments", SAMPLE_ENROLLMENTS));
  const [viewing, setViewing]         = useState<Enrollment | null>(null);
  const [subTab, setSubTab]           = useState("fields");

  useEffect(() => {
    saveCollection("enrollments", enrollments);
  }, [enrollments]);

  // Reset activeSubTab to list if role changes to accountant (since new and eligibility are restricted)
  useEffect(() => {
    if (role === "accountant" && (activeSubTab === "new" || activeSubTab === "eligibility")) {
      setActiveSubTab("list");
    }
  }, [role, activeSubTab]);

  const handleComplete = (enrollment: Enrollment) => {
    setEnrollments((prev) => [enrollment, ...prev]);
    
    // Update student's enrolledSessions in localStorage
    const currentStudents = getCollection("students", STUDENTS);
    const updatedStudents = currentStudents.map((s) => {
      if (s.id === enrollment.studentId) {
        const enrolled = s.enrolledSessions || [];
        if (!enrolled.includes(enrollment.sessionId)) {
          return { ...s, enrolledSessions: [...enrolled, enrollment.sessionId] };
        }
      }
      return s;
    });
    saveCollection("students", updatedStudents);

    setActiveSubTab("list");
  };

  const handleCancel = (id: string) => {
    setEnrollments((prev) => prev.map((e) =>
      e.id === id
        ? { ...e, status: "cancelled" as const, timeline: [...(e.timeline || []), { ts: new Date().toISOString(), event: "Enrollment cancelled", by: role }] }
        : e
    ));
  };

  const handleStatusChange = (id: string, newStatus: Enrollment["status"]) => {
    setEnrollments((prev) => prev.map((e) =>
      e.id === id
        ? { ...e, status: newStatus, timeline: [...(e.timeline || []), { ts: new Date().toISOString(), event: `Status → ${newStatus}`, by: role }] }
        : e
    ));
    if (viewing?.id === id) setViewing((v) => v ? { ...v, status: newStatus } : v);
  };

  // Stats bar
  const total     = enrollments.length;
  const confirmed = enrollments.filter((e) => e.status === "confirmed").length;
  const pending   = enrollments.filter((e) => e.status === "pending").length;
  const revenue   = enrollments.filter((e) => e.status !== "cancelled").reduce((s, e) => s + (e.finalFee || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Enrollments Portal</title>
      <meta name="description" content="Review and register class enrollments, verify student class allocations, and generate admissions reports." />
      <PageHeader
        icon={ClipboardList}
        title="Enrollments"
        subtitle="Manage student enrollment into sessions and classes"
        actions={
          <div className="flex items-center gap-2">
            {/* Role switcher */}
            {tab !== "configuration" && (
              <div className="flex rounded-lg border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden text-[11px] font-bold shadow-sm">
                {ROLE_OPTIONS.map((r) => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`px-3 py-2 capitalize transition-colors ${role === r ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
                    {r}
                  </button>
                ))}
              </div>
            )}
            {role !== "accountant" && tab !== "configuration" && (
              <button onClick={() => { setTab("operations"); setActiveSubTab("new"); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="w-3.5 h-3.5" /> New Enrollment
              </button>
            )}
          </div>
        }
      />

      <div className="space-y-4">
        <ErrorBoundary>
          <KPISummary category="academic" />
        </ErrorBoundary>
      </div>

      {/* Primary Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map((t) => {
          const Icon   = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tabs for Operations */}
      {tab === "operations" && (
        <div className="flex gap-1.5 p-1 bg-card/45 backdrop-blur-xl border border-border/50 rounded-xl w-fit overflow-x-auto max-w-full shadow-sm">
          {SUB_TABS.filter((t) => !(role === "accountant" && (t.id === "new" || t.id === "eligibility"))).map((t) => {
            const active = activeSubTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveSubTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab + "-" + activeSubTab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          {tab === "analytics" && (
            <ErrorBoundary>
              <ModuleReports category="academic" role={role} />
            </ErrorBoundary>
          )}
          {tab === "operations" && activeSubTab === "new" && (
            <div className="max-w-2xl">
              <ErrorBoundary>
                <EnrollmentWizard
                  onComplete={handleComplete}
                  onCancel={() => setActiveSubTab("list")}
                />
              </ErrorBoundary>
            </div>
          )}

          {tab === "operations" && activeSubTab === "list" && (
            <ErrorBoundary>
              <EnrollmentList
                enrollments={enrollments}
                role={role}
                onView={(enr: Enrollment) => setViewing(enr)}
                onCancel={handleCancel}
              />
            </ErrorBoundary>
          )}

          {tab === "operations" && activeSubTab === "eligibility" && (
            <ErrorBoundary>
              <EligibilityCheck />
            </ErrorBoundary>
          )}

          {tab === "operations" && activeSubTab === "reports" && (
            <ErrorBoundary>
              <EnrollmentReports enrollments={enrollments} />
            </ErrorBoundary>
          )}

          {tab === "configuration" && (
            <ErrorBoundary>
              <div className="space-y-4">
                <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
                  {ENROLLMENT_SETTINGS_SUB_TABS.map((t) => (
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
                {subTab === "fields" && <EnrollmentsSettings />}
              </div>
            </ErrorBoundary>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Detail panel */}
      <AnimatePresence>
        {viewing && (
          <ErrorBoundary>
            <EnrollmentDetail
              enrollment={viewing}
              role={role}
              onClose={() => setViewing(null)}
              onStatusChange={handleStatusChange}
            />
          </ErrorBoundary>
        )}
      </AnimatePresence>
    </div>
  );
}