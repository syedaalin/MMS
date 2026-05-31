import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line,
} from "recharts";
import { AlertTriangle, Trophy } from "lucide-react";
import { DIFFICULTY, Question, Category } from "../../lib/assessmentData";

function pct(obtained: number, total: number): number {
  return total > 0 ? Math.round((obtained / total) * 100) : 0;
}

export interface AnalyticsTest {
  id: string;
  name: string;
  totalMarks?: number;
  questionIds?: string[];
  difficulty?: string;
}

export interface AnalyticsResult {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  marksObtained: number;
  answers?: Record<string, string>;
  class?: string;
}

interface PerformanceAnalyticsProps {
  tests: AnalyticsTest[];
  results: AnalyticsResult[];
  questions: Question[];
  categories: Category[];
}

interface StudentStatItem {
  name: string;
  class: string;
  scores: number[];
  totalPts: number;
  maxPts: number;
  avg: number;
  overall: number;
}

interface CategoryPerformance {
  name: string;
  icon: string;
  color: string;
  accuracy: number;
  correct: number;
  total: number;
}

/**
 * Component for rendering detailed visual performance analytics and statistics.
 *
 * @param props - Component props.
 * @param props.tests - Assessment test or exams records.
 * @param props.results - Scoring results list.
 * @param props.questions - Master questions list.
 * @param props.categories - Category tags.
 * @returns The PerformanceAnalytics component.
 */
export default function PerformanceAnalytics({ tests, results, questions, categories }: PerformanceAnalyticsProps): React.ReactElement {
  // Per-student aggregated performance
  const studentStats = useMemo<StudentStatItem[]>(() => {
    const map: Record<string, { name: string; class: string; scores: number[]; totalPts: number; maxPts: number }> = {};
    results.forEach((r) => {
      const test = tests.find((t) => t.id === r.testId);
      if (!test) return;
      const totalMarks = test.totalMarks ?? 100;
      const p = pct(r.marksObtained, totalMarks);
      if (!map[r.studentId]) {
        map[r.studentId] = { name: r.studentName, class: r.class || "Class", scores: [], totalPts: 0, maxPts: 0 };
      }
      map[r.studentId].scores.push(p);
      map[r.studentId].totalPts += r.marksObtained;
      map[r.studentId].maxPts += totalMarks;
    });
    return Object.values(map).map((s) => {
      const avg = s.scores.length > 0 ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : 0;
      return {
        ...s,
        avg,
        overall: pct(s.totalPts, s.maxPts),
      };
    }).sort((a, b) => b.avg - a.avg);
  }, [tests, results]);

  // Per-category accuracy
  const catPerformance = useMemo<CategoryPerformance[]>(() => {
    return categories.map((cat) => {
      const catQIds = questions.filter((q) => q.categoryId === cat.id).map((q) => q.id);
      let correct = 0;
      let total = 0;
      results.forEach((r) => {
        catQIds.forEach((qid) => {
          if (r.answers?.[qid] !== undefined) {
            const q = questions.find((x) => x.id === qid);
            total++;
            if (r.answers[qid] === q?.answer) {
              correct++;
            }
          }
        });
      });
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      return { name: cat.name, icon: cat.icon, color: cat.color, accuracy, correct, total };
    }).filter((c) => c.total > 0);
  }, [categories, questions, results]);

  // Weak areas = categories with <60% accuracy
  const weakAreas = catPerformance.filter((c) => c.accuracy < 60).sort((a, b) => a.accuracy - b.accuracy);

  // Per-test class avg trend
  const trendData = tests.map((t) => {
    const tr = results.filter((r) => r.testId === t.id);
    const totalMarks = t.totalMarks ?? 100;
    const avg = tr.length > 0 ? Math.round(tr.reduce((s, r) => s + pct(r.marksObtained, totalMarks), 0) / tr.length) : 0;
    return { name: t.name.length > 16 ? t.name.slice(0, 16) + "…" : t.name, avg };
  });

  // Difficulty analysis
  const diffData = Object.entries(DIFFICULTY).map(([key, cfg]) => {
    const qIds = questions.filter((q) => q.difficulty === key).map((q) => q.id);
    let correct = 0;
    let total = 0;
    results.forEach((r) => {
      qIds.forEach((qid) => {
        if (r.answers?.[qid] !== undefined) {
          const q = questions.find((x) => x.id === qid);
          total++;
          if (r.answers[qid] === q?.answer) {
            correct++;
          }
        }
      });
    });
    return { name: cfg.label, accuracy: total > 0 ? Math.round((correct / total) * 100) : 0 };
  });

  const radarData = catPerformance.map((c) => ({ subject: `${c.icon} ${c.name}`, accuracy: c.accuracy }));

  return (
    <div className="space-y-6">
      {/* Weak areas alert */}
      {weakAreas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-200 bg-amber-50 p-4"
          role="alert"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <h3 className="text-[13px] font-bold text-amber-800">Weak Areas Detected</h3>
          </div>
          <div className="flex flex-wrap gap-2.5" role="list">
            {weakAreas.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 bg-white border border-amber-200 rounded-lg px-2.5 py-1.5" role="listitem">
                <span className="text-base" aria-hidden="true">{c.icon}</span>
                <div>
                  <p className="text-[12px] font-bold text-amber-800">{c.name}</p>
                  <p className="text-[10px] text-amber-600">{c.accuracy}% accuracy</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Class avg trend */}
        <section className="rounded-xl border border-border bg-card p-5" aria-label="Class Average Trend Chart">
          <h3 className="text-[13px] font-bold text-foreground mb-4">Class Average Trend</h3>
          <div className="h-[180px]" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`, "Avg Score"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Category accuracy radar */}
        <section className="rounded-xl border border-border bg-card p-5" aria-label="Category Accuracy Radar Chart">
          <h3 className="text-[13px] font-bold text-foreground mb-4">Category Accuracy</h3>
          {radarData.length >= 3 ? (
            <div className="h-[180px]" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                  <Radar dataKey="accuracy" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip formatter={(v) => [`${v}%`, "Accuracy"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground" role="status">Not enough categories for radar</div>
          )}
        </section>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Student performance bar */}
        <section className="rounded-xl border border-border bg-card p-5" aria-label="Student Performance Chart">
          <h3 className="text-[13px] font-bold text-foreground mb-4">Student Performance</h3>
          <div className="h-[180px]" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
              <BarChart data={studentStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip formatter={(v) => [`${v}%`, "Avg"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Difficulty accuracy */}
        <section className="rounded-xl border border-border bg-card p-5" aria-label="Accuracy by Difficulty Chart">
          <h3 className="text-[13px] font-bold text-foreground mb-4">Accuracy by Difficulty</h3>
          <div className="h-[180px]" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
              <BarChart data={diffData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`, "Accuracy"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Category breakdown table */}
      <section className="rounded-xl border border-border bg-card overflow-hidden" aria-label="Category Breakdown Summary">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-bold text-foreground">Category Breakdown</h3>
        </div>
        <div className="divide-y divide-border/50" role="list">
          {catPerformance.sort((a, b) => a.accuracy - b.accuracy).map((c) => (
            <div key={c.name} className="flex items-center gap-4 px-4 py-3" role="listitem">
              <span className="text-xl flex-shrink-0" aria-hidden="true">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[12px] font-semibold text-foreground">{c.name}</p>
                  <span className={`text-[11px] font-bold ${c.accuracy < 60 ? "text-red-600" : c.accuracy < 75 ? "text-amber-600" : "text-emerald-600"}`}>{c.accuracy}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden" aria-hidden="true">
                  <div className="h-full rounded-full transition-all" style={{ width: `${c.accuracy}%`, background: c.accuracy < 60 ? "#ef4444" : c.accuracy < 75 ? "#d97706" : "#10b981" }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{c.correct}/{c.total} correct answers</p>
              </div>
              {c.accuracy < 60 && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" aria-label="Warning: performance low" />}
              {c.accuracy >= 85 && <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" aria-label="Award: performance high" />}
            </div>
          ))}
        </div>
      </section>

      {/* Top performers */}
      {studentStats.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-5" aria-label="Student Leaderboard Summary">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <h3 className="text-[13px] font-bold text-foreground">Student Leaderboard</h3>
          </div>
          <div className="space-y-2.5" role="list">
            {studentStats.map((s, i) => {
              const medal = ["🥇","🥈","🥉"][i] || "";
              return (
                <div key={s.name} className="flex items-center gap-3" role="listitem">
                  <span className="text-base w-6 flex-shrink-0">{medal || <span className="text-[12px] font-bold text-muted-foreground">{i + 1}</span>}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[12px] font-semibold text-foreground">{s.name} <span className="text-muted-foreground font-normal">· {s.class}</span></p>
                      <p className="text-[12px] font-bold text-foreground">{s.avg}%</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden" aria-hidden="true">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${s.avg}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
