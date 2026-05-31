import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, ClipboardList, BarChart2, Layers, FileText, PenTool, Settings, LayoutDashboard } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";

// Exam system
import ExamsList from "../components/examination/ExamsList";
import ExamForm from "../components/examination/ExamForm";
import EnterMarks from "../components/examination/EnterMarks";
import ResultsView from "../components/examination/ResultsView";

// Question bank system
import QuestionBank from "../components/assessment/QuestionBank";
import GenerateTest from "../components/assessment/GenerateTest";
import PerformanceAnalytics from "../components/assessment/PerformanceAnalytics";
import ExaminationsSettings from "../components/examination/ExaminationsSettings";
import ModuleReports from "../components/reports/ModuleReports";
import KPISummary from "../components/reports/KPISummary";

import { QUESTIONS, CATEGORIES, TESTS, Test } from "../lib/assessmentData";
import { EXAMS, EXAM_RESULTS, Exam, ExamResult } from "../lib/examinationData";
import { getCollection, saveCollection } from "../lib/db";

const PAGE_TABS = [
  { id: "operations",    label: "Operations",    icon: LayoutDashboard },
  { id: "analytics",     label: "Analytics",     icon: BarChart2 },
  { id: "configuration", label: "Configuration", icon: Settings },
];

const EXAMINATION_SETTINGS_SUB_TABS = [
  { id: "fields", label: "Fields & Preferences" },
];

const OPS_SUB_TABS = [
  { id: "exams",     label: "Exams",          icon: BookOpen },
  { id: "marks",     label: "Enter Marks",     icon: PenTool },
  { id: "results",   label: "Results",         icon: FileText },
  { id: "bank",      label: "Question Bank",   icon: ClipboardList },
  { id: "generate",  label: "AI Generator",    icon: Sparkles },
];

const ANALYTICS_SUB_TABS = [
  { id: "analytics", label: "Performance Charts", icon: BarChart2 },
  { id: "reports",   label: "Reports",            icon: ClipboardList },
];

/**
 * Examinations page component.
 * Manages examinations, marking, question banks, AI test generation, and performance analytics.
 * 
 * @returns {React.ReactElement} The Examinations page component.
 */
export default function Examinations() {
  const [activeTab, setActiveTab] = useState("operations");
  const [activeSubTab, setActiveSubTab] = useState("exams");
  const [activeAnalyticsSubTab, setActiveAnalyticsSubTab] = useState("analytics");
  const [subTab, setSubTab] = useState("fields");

  // Exams state
  const [exams, setExams] = useState<Exam[]>(() => getCollection("exams", EXAMS));
  const [examResults, setExamResults] = useState<ExamResult[]>(() => getCollection("exam_results", EXAM_RESULTS));
  const [showExamForm, setShowExamForm] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);

  // Question bank state
  const [questions, setQuestions] = useState(() => getCollection("questions", QUESTIONS));
  const [categories] = useState(CATEGORIES);
  const [tests, setTests] = useState(() => getCollection("tests", TESTS));

  useEffect(() => {
    saveCollection("exams", exams);
  }, [exams]);

  useEffect(() => {
    saveCollection("exam_results", examResults);
  }, [examResults]);

  useEffect(() => {
    saveCollection("questions", questions);
  }, [questions]);

  useEffect(() => {
    saveCollection("tests", tests);
  }, [tests]);

  const handleSaveExam = (exam: Exam) => {
    setExams((prev) => {
      const exists = prev.find((e) => e.id === exam.id);
      return exists ? prev.map((e) => e.id === exam.id ? exam : e) : [...prev, exam];
    });
    setShowExamForm(false);
    setEditExam(null);
  };

  const handleSaveResults = (examId: string, newResults: ExamResult[]) => {
    setExamResults((prev) => {
      const filtered = prev.filter((r) => r.examId !== examId);
      return [...filtered, ...newResults];
    });
  };

  const effectiveTab = PAGE_TABS.find((t) => t.id === activeTab) ? activeTab : "operations";
  const effectiveSubTab = OPS_SUB_TABS.find((t) => t.id === activeSubTab) ? activeSubTab : "exams";
  const effectiveAnalyticsSubTab = ANALYTICS_SUB_TABS.find((t) => t.id === activeAnalyticsSubTab) ? activeAnalyticsSubTab : "analytics";

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Examinations Portal</title>
      <meta name="description" content="Manage exams schedules, record student marks, and view report cards and certificates." />
      <PageHeader
        icon={Layers}
        title="Examinations"
        subtitle="Create exams, enter marks, view results & certificates"
      />

      <div className="space-y-4">
        <KPISummary category="academic" />
      </div>

      {/* Primary Tabs */}
      <div className="flex border-b border-border overflow-x-auto gap-0">
        {PAGE_TABS.map((t) => {
          const Icon = t.icon;
          const active = effectiveTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tabs for Operations */}
      {effectiveTab === "operations" && (
        <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl w-fit border border-border/30 overflow-x-auto max-w-full">
          {OPS_SUB_TABS.map((t) => {
            const active = effectiveSubTab === t.id;
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

      {/* Sub-tabs for Analytics */}
      {effectiveTab === "analytics" && (
        <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl w-fit border border-border/30 overflow-x-auto max-w-full">
          {ANALYTICS_SUB_TABS.map((t) => {
            const active = effectiveAnalyticsSubTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveAnalyticsSubTab(t.id)}
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

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={effectiveTab + "-" + (effectiveTab === "operations" ? effectiveSubTab : effectiveAnalyticsSubTab)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {effectiveTab === "configuration" && (
            <div className="space-y-4">
              <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
                {EXAMINATION_SETTINGS_SUB_TABS.map((t) => (
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
              {subTab === "fields" && <ExaminationsSettings />}
            </div>
          )}

          {effectiveTab === "analytics" && effectiveAnalyticsSubTab === "reports" && <ModuleReports category="academic" />}
          {effectiveTab === "analytics" && effectiveAnalyticsSubTab === "analytics" && (
            <PerformanceAnalytics
              tests={tests}
              results={examResults.map((r) => {
                const exam = exams.find((e) => e.id === r.examId);
                return {
                  ...r,
                  testId: r.examId,
                  studentName: r.studentId,
                  marksObtained: r.marksObtained,
                };
              })}
              questions={questions}
              categories={categories}
            />
          )}

          {effectiveTab === "operations" && effectiveSubTab === "exams" && (
            <ExamsList
              exams={exams}
              onNew={() => { setEditExam(null); setShowExamForm(true); }}
              onEdit={(e: Exam) => { setEditExam(e); setShowExamForm(true); }}
            />
          )}
          {effectiveTab === "operations" && effectiveSubTab === "marks" && (
            <EnterMarks
              exams={exams}
              results={examResults}
              onSaveResults={handleSaveResults}
            />
          )}
          {effectiveTab === "operations" && effectiveSubTab === "results" && (
            <ResultsView
              exams={exams}
              results={examResults}
            />
          )}
          {effectiveTab === "operations" && effectiveSubTab === "bank" && (
            <QuestionBank questions={questions} categories={categories} onUpdate={setQuestions} />
          )}
          {effectiveTab === "operations" && effectiveSubTab === "generate" && (
            <GenerateTest
              questions={questions}
              categories={categories}
              tests={tests}
              onCreateTest={(t: Test) => setTests((p) => [...p, t])}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Exam form modal */}
      <AnimatePresence>
        {showExamForm && (
          <ExamForm
            exam={editExam}
            onClose={() => { setShowExamForm(false); setEditExam(null); }}
            onSave={handleSaveExam}
          />
        )}
      </AnimatePresence>
    </div>
  );
}