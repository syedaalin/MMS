import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Award, ChevronDown, ChevronRight } from "lucide-react";
import { Question } from "../../lib/assessmentData";
import { AnalyticsTest, AnalyticsResult } from "./PerformanceAnalytics";

function pct(obtained: number, total: number): number {
  return total > 0 ? Math.round((obtained / total) * 100) : 0;
}

interface GradeResult {
  label: string;
  cls: string;
}

function grade(p: number): GradeResult {
  if (p >= 90) return { label: "A+", cls: "text-emerald-600 bg-emerald-50" };
  if (p >= 80) return { label: "A",  cls: "text-emerald-600 bg-emerald-50" };
  if (p >= 70) return { label: "B",  cls: "text-blue-600 bg-blue-50" };
  if (p >= 60) return { label: "C",  cls: "text-amber-600 bg-amber-50" };
  if (p >= 50) return { label: "D",  cls: "text-orange-600 bg-orange-50" };
  return { label: "F", cls: "text-red-600 bg-red-50" };
}

interface ResultRowProps {
  result: AnalyticsResult;
  test: AnalyticsTest;
  questions: Question[];
}

/**
 * Renders a row displaying a student's grade summary and expandable questions/answers detail.
 *
 * @param props - Component props.
 * @param props.result - Individual student test result.
 * @param props.test - Target test record.
 * @param props.questions - Master questions list.
 * @returns Student result row element.
 */
function ResultRow({ result, test, questions }: ResultRowProps): React.ReactElement {
  const [open, setOpen] = useState<boolean>(false);
  const totalMarks = test.totalMarks ?? 100;
  const p = pct(result.marksObtained, totalMarks);
  const g = grade(p);

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Show detailed grading results for ${result.studentName}`}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors text-left"
      >
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-foreground">
            {result.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">{result.studentName}</p>
            {result.class && <p className="text-[10px] text-muted-foreground">{result.class}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-[13px] font-bold text-foreground">{result.marksObtained}/{totalMarks}</p>
            <p className="text-[10px] text-muted-foreground">{p}%</p>
          </div>
          <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-lg ${g.cls}`}>{g.label}</span>
          {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2" role="list" aria-label={`Questions detail for ${result.studentName}`}>
              {test.questionIds?.map((qid, i) => {
                const q = questions.find((x) => x.id === qid);
                if (!q) return null;
                const studentAns = result.answers?.[qid];
                const correct = studentAns === q.answer;
                return (
                  <div
                    key={qid}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg text-[11px] ${correct ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"}`}
                    role="listitem"
                  >
                    {correct ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" aria-label="Correct answer" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" aria-label="Incorrect answer" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${correct ? "text-emerald-800" : "text-red-800"}`}>Q{i + 1}: {q.text}</p>
                      {!correct && q.type !== "short" && (
                        <p className="mt-0.5 text-red-600">
                          Student: <strong>{studentAns || "—"}</strong> · Correct: <strong>{q.answer}</strong>
                        </p>
                      )}
                      {q.type === "short" && (
                        <p className="text-muted-foreground mt-0.5 italic">Short answer — manual grading needed</p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold">{correct ? `+${q.marks}` : "0"}/{q.marks}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AutoGradingProps {
  tests: AnalyticsTest[];
  results: AnalyticsResult[];
  questions: Question[];
}

interface StatsSummary {
  avg: number;
  highest: number;
  lowest: number;
}

/**
 * AutoGrading analysis page component.
 *
 * @param props - Component props.
 * @param props.tests - Configured tests list.
 * @param props.results - Scoring result submissions.
 * @param props.questions - Quiz questions bank.
 * @returns The AutoGrading component.
 */
export default function AutoGrading({ tests, results, questions }: AutoGradingProps): React.ReactElement {
  const [selectedTest, setSelectedTest] = useState<string>(tests[0]?.id || "");
  const test = tests.find((t) => t.id === selectedTest);
  const testResults = results.filter((r) => r.testId === selectedTest);

  const stats = useMemo<StatsSummary | null>(() => {
    if (!test || testResults.length === 0) return null;
    const totalMarks = test.totalMarks ?? 100;
    const avg = Math.round(testResults.reduce((s, r) => s + pct(r.marksObtained, totalMarks), 0) / testResults.length);
    const highest = Math.max(...testResults.map((r) => r.marksObtained));
    const lowest = Math.min(...testResults.map((r) => r.marksObtained));
    return { avg, highest, lowest };
  }, [test, testResults]);

  return (
    <section className="space-y-5" aria-labelledby="auto-grading-title">
      {/* Test selector */}
      <div>
        <span id="auto-grading-title" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Select Test</span>
        <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Select test to review grading">
          {tests.map((t) => {
            const isSelected = selectedTest === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedTest(t.id)}
                className={`px-3.5 py-2 rounded-lg border text-[12px] font-semibold transition-all ${isSelected ? "border-primary bg-primary/5 text-primary" : "border-border bg-card hover:bg-muted text-foreground"}`}
              >
                {t.name}
                <span className="ml-1.5 text-[10px] text-muted-foreground">({results.filter((r) => r.testId === t.id).length} results)</span>
              </button>
            );
          })}
        </div>
      </div>

      {test && (
        <>
          {/* Stats bar */}
          {stats && (
            <div className="grid grid-cols-4 gap-3" role="status" aria-label="Grading statistics summary">
              {[
                { label: "Submitted", value: testResults.length, icon: Clock, cls: "text-primary" },
                { label: "Class Avg", value: `${stats.avg}%`, icon: Award, cls: "text-amber-600" },
                { label: "Highest", value: `${stats.highest}/${test.totalMarks ?? 100}`, icon: CheckCircle2, cls: "text-emerald-600" },
                { label: "Lowest", value: `${stats.lowest}/${test.totalMarks ?? 100}`, icon: XCircle, cls: "text-red-500" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-3.5">
                    <Icon className={`w-4 h-4 ${s.cls} mb-1.5`} aria-hidden="true" />
                    <p className="text-[18px] font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Results table */}
          <section className="rounded-xl border border-border bg-card overflow-hidden" aria-label="Graded Submissions Results">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-foreground">{test.name} — Results</h3>
              <span className="text-[11px] text-muted-foreground">{testResults.length} submission{testResults.length !== 1 ? "s" : ""}</span>
            </div>
            {testResults.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground" role="status">No results yet for this test.</div>
            ) : (
              <div role="list" aria-label="Student results list">
                {testResults
                  .sort((a, b) => b.marksObtained - a.marksObtained)
                  .map((r) => <ResultRow key={r.id} result={r} test={test} questions={questions} />)}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
