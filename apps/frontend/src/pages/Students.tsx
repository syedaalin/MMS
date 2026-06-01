import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, GraduationCap, Filter, ChevronDown, Users, Settings,
  LayoutDashboard, BarChart2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from "../components/ui/PageHeader";
import SearchBar from "../components/ui/SearchBar";
import FilterChips from "../components/ui/FilterChips";
import ActionButton from "../components/ui/ActionButton";
import ErrorBoundary from "../components/ui/ErrorBoundary";

// Students Imports
import StudentList from "../components/students/StudentList";
import StudentForm from "../components/students/StudentForm";
import StudentsSettingsPanel from "../components/students/StudentsSettings";
import { STUDENTS, Student } from "../lib/studentsData";
import { type StudentsSettings, DEFAULT_STUDENTS_SETTINGS } from "@mms/shared";

// Generic Reports & DB Utils
import ModuleReports from "../components/reports/ModuleReports";
import KPISummary from "../components/reports/KPISummary";
import { getCollection, saveCollection, getObject } from "../lib/db";

const PAGE_TABS = [
  { id: "operations",    label: "Operations",    icon: LayoutDashboard },
  { id: "analytics",     label: "Analytics",     icon: BarChart2 },
  { id: "configuration", label: "Configuration", icon: Settings },
];

const STUDENT_SETTINGS_SUB_TABS = [
  { id: "fields",      label: "Fields" },
  { id: "preferences", label: "Preferences" },
];

const STUDENT_STATUS_OPTIONS = ["active", "inactive", "suspended"];

/**
 * Students Directory and Records Page.
 * Implements the standard 3-tier tab system (Operations | Analytics | Configuration).
 */
export default function Students() {
  const [activeTab, setActiveTab] = useState("operations");

  const settings = useMemo(() => getObject<StudentsSettings>("students_settings", DEFAULT_STUDENTS_SETTINGS), []);

  // STUDENT SUB-MODULE STATE & GR Number auto-generation/migration
  const [students, setStudents] = useState<Student[]>(() => {
    const raw = getCollection("students", STUDENTS);
    const template = settings.grNumberTemplate || "{seq}-{year}";
    const digits = settings.grNumberDigits || 4;
    const restartAnnually = settings.grNumberRestartAnnually !== false;

    let migrated = false;
    const migratedList = raw.map((s, idx) => {
      if (!s.grNumber) {
        migrated = true;
        const regDate = s.registeredDate || new Date().toISOString().split("T")[0];
        const year = regDate ? new Date(regDate).getFullYear() : new Date().getFullYear();

        let nextSeq = 1;
        if (restartAnnually) {
          const yearlyStudents = raw.slice(0, idx).filter((x) => {
            const xDate = x.registeredDate || "";
            if (xDate.startsWith(String(year))) return true;
            if (x.grNumber && x.grNumber.includes(String(year))) return true;
            return false;
          });
          nextSeq = yearlyStudents.length + 1;
        } else {
          nextSeq = idx + 1;
        }

        const seqStr = String(nextSeq).padStart(digits, "0");
        const autoGr = template.replace("{seq}", seqStr).replace("{year}", String(year));
        return { ...s, grNumber: autoGr };
      }
      return s;
    });

    if (migrated) {
      saveCollection("students", migratedList);
    }
    return migratedList;
  });

  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilterStatus, setStudentFilterStatus] = useState<string[]>([]);
  const [studentFilterGender, setStudentFilterGender] = useState("");
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [subTab, setSubTab] = useState("fields");

  useEffect(() => {
    saveCollection("students", students);
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = studentSearch.toLowerCase();
      return (
        (!q || s.name.toLowerCase().includes(q) || s.cnic?.includes(q) || s.fatherName?.toLowerCase().includes(q)) &&
        (studentFilterStatus.length === 0 || studentFilterStatus.includes(s.status)) &&
        (!studentFilterGender || s.gender === studentFilterGender)
      );
    });
  }, [students, studentSearch, studentFilterStatus, studentFilterGender]);

  const handleSaveStudent = (data: Student) => {
    if (editStudent) setStudents((ss) => ss.map((s) => s.id === data.id ? data : s));
    else setStudents((ss) => [...ss, data]);
    setShowStudentForm(false);
    setEditStudent(null);
  };

  const toggleStudentStatus = (s: string) =>
    setStudentFilterStatus((st) => st.includes(s) ? st.filter((x) => x !== s) : [...st, s]);

  const studentFilterChips = [
    ...studentFilterStatus.map((s) => ({ key: s, label: s, onRemove: () => toggleStudentStatus(s) })),
    ...(studentFilterGender ? [{ key: "gender", label: studentFilterGender, onRemove: () => setStudentFilterGender("") }] : []),
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Students Portal</title>
      <meta name="description" content="Manage students directory, register new students, edit details, and configure student records settings." />

      <PageHeader
        icon={GraduationCap}
        title="Students"
        subtitle="Manage student directory and records"
        actions={
          <ActionButton
            variant="primary"
            icon={UserPlus}
            onClick={() => { setEditStudent(null); setShowStudentForm(true); }}
          >
            Add Student
          </ActionButton>
        }
      />

      {/* KPI summaries tied to active subtab context */}
      <div className="space-y-4">
        <ErrorBoundary>
          <KPISummary category="students" />
        </ErrorBoundary>
      </div>

      {/* Primary 3-tier Tab Navigation */}
      <div className="flex border-b border-border overflow-x-auto">
        {PAGE_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === "operations" ? (
          <motion.div
            key="operations"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            <div className="flex flex-col sm:flex-row gap-3 bg-card/40 backdrop-blur-xl border border-border/50 p-3 rounded-2xl shadow-sm">
              <SearchBar
                value={studentSearch}
                onChange={setStudentSearch}
                placeholder="Search students directory…"
                className="flex-1"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      studentFilterStatus.length > 0
                        ? "border-primary/30 bg-primary/5 text-primary"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" /> Status
                    {studentFilterStatus.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {studentFilterStatus.length}
                      </span>
                    )}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel className="text-xs">Filter by status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {STUDENT_STATUS_OPTIONS.map((s) => (
                    <DropdownMenuCheckboxItem
                      key={s}
                      checked={studentFilterStatus.includes(s)}
                      onCheckedChange={() => toggleStudentStatus(s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      studentFilterGender
                        ? "border-primary/30 bg-primary/5 text-primary"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    {studentFilterGender
                      ? studentFilterGender.charAt(0).toUpperCase() + studentFilterGender.slice(1)
                      : "Gender"}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  {["", "male", "female", "other"].map((g) => (
                    <DropdownMenuCheckboxItem
                      key={g}
                      checked={studentFilterGender === g}
                      onCheckedChange={() => setStudentFilterGender(g)}
                    >
                      {g ? g.charAt(0).toUpperCase() + g.slice(1) : "All genders"}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <FilterChips
              chips={studentFilterChips}
              onClearAll={() => {
                setStudentFilterStatus([]);
                setStudentFilterGender("");
              }}
            />

            <ErrorBoundary>
              <StudentList
                students={filteredStudents}
                layout={settings.defaultViewLayout}
                onEdit={(s: Student) => { setEditStudent(s); setShowStudentForm(true); }}
                onDelete={(id: string) => setStudents((ss) => ss.filter((s) => s.id !== id))}
                onBulkDelete={(ids) => setStudents((ss) => ss.filter((s) => !ids.includes(s.id)))}
                onBulkStatusChange={(ids, status) => setStudents((ss) => ss.map((s) => ids.includes(s.id) ? { ...s, status } : s))}
              />
            </ErrorBoundary>
          </motion.div>
        ) : activeTab === "analytics" ? (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <ErrorBoundary>
              <ModuleReports category="students" />
            </ErrorBoundary>
          </motion.div>
        ) : (
          <motion.div
            key="configuration"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <ErrorBoundary>
              <div className="space-y-4">
                <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
                  {STUDENT_SETTINGS_SUB_TABS.map((t) => (
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
                {subTab === "fields" && <StudentsSettingsPanel mode="fields" />}
                {subTab === "preferences" && <StudentsSettingsPanel mode="preferences" />}
              </div>
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

      {/* overlays/modals */}
      <AnimatePresence>
        {/* Student Form Modal */}
        {showStudentForm && (
          <StudentForm
            student={editStudent ?? undefined}
            students={students}
            onClose={() => { setShowStudentForm(false); setEditStudent(null); }}
            onSave={handleSaveStudent as (data: object) => void}
          />
        )}
      </AnimatePresence>
    </div>
  );
}