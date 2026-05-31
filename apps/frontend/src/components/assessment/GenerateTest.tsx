import React, { useState } from "react";
import { Sparkles, X, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { DIFFICULTY, Question, Category, Test } from "../../lib/assessmentData";

const INPUT = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

interface AIGeneratingProps {
  onDone: () => void;
}

/**
 * Animated step loader for mock AI generation.
 *
 * @returns Component layout.
 */
function AIGenerating({ onDone }: AIGeneratingProps): React.ReactElement {
  const [step, setStep] = React.useState<number>(0);
  const steps = ["Analysing question bank…", "Applying difficulty filters…", "Balancing categories…", "Finalising test paper…"];

  React.useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => {
        if (s >= steps.length - 1) {
          clearInterval(t);
          setTimeout(onDone, 400);
          return s;
        }
        return s + 1;
      });
    }, 700);
    return () => clearInterval(t);
  }, [onDone, steps.length]);

  return (
    <div className="py-8 text-center space-y-4" role="status" aria-live="polite">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-7 h-7 text-primary animate-pulse" aria-hidden="true" />
      </div>
      <p className="text-sm font-bold text-foreground">AI is generating your test…</p>
      <div className="max-w-xs mx-auto space-y-2">
        {steps.map((s, i) => (
          <div key={s} className={`flex items-center gap-2 text-[12px] transition-all ${i <= step ? "text-foreground" : "text-muted-foreground/40"}`}>
            {i < step ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
            ) : i === step ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" aria-hidden="true" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-border flex-shrink-0" aria-hidden="true" />
            )}
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TestConfig {
  name: string;
  categoryIds: string[];
  difficulty: "easy" | "medium" | "hard" | "any";
  numQuestions: number;
  duration: number;
  shuffle: boolean;
}

export interface GeneratedTestSaveData {
  id: string;
  name: string;
  categoryId: string | null;
  categoryIds?: string[];
  difficulty: "easy" | "medium" | "hard" | "mixed";
  questionIds: string[];
  totalMarks: number;
  duration: number;
  createdDate?: string;
  createdAt: string;
  status?: string;
}

interface GenerateTestProps {
  questions: Question[];
  categories: Category[];
  tests: Test[];
  onCreateTest: (test: GeneratedTestSaveData) => void;
}

/**
 * AI-driven test paper generator component.
 *
 * @param props - Component props.
 * @param props.questions - Currently registered questions in bank.
 * @param props.categories - Categories details.
 * @param props.tests - Existing tests.
 * @param props.onCreateTest - Callback when test is generated and saved.
 * @returns The GenerateTest component.
 */
export default function GenerateTest({ questions, categories, tests, onCreateTest }: GenerateTestProps): React.ReactElement {
  const [step, setStep] = useState<string>("config"); // config | generating | preview | done
  const [config, setConfig] = useState<TestConfig>({ name: "", categoryIds: [], difficulty: "medium", numQuestions: 10, duration: 30, shuffle: true });
  const [generatedQIds, setGeneratedQIds] = useState<string[]>([]);

  const upd = (f: keyof TestConfig, v: TestConfig[keyof TestConfig]) => setConfig((d) => ({ ...d, [f]: v }));
  const toggleCat = (id: string) => setConfig((d) => ({ ...d, categoryIds: d.categoryIds.includes(id) ? d.categoryIds.filter((x) => x !== id) : [...d.categoryIds, id] }));

  const handleGenerate = () => {
    setStep("generating");
  };

  const onGeneratingDone = () => {
    // Pick questions matching criteria
    let pool = questions.filter((q) => {
      const mCat = config.categoryIds.length === 0 || config.categoryIds.includes(q.categoryId);
      const mDiff = config.difficulty === "any" || q.difficulty === config.difficulty;
      return mCat && mDiff;
    });
    if (config.shuffle) {
      pool = [...pool].sort(() => Math.random() - 0.5);
    }
    const picked = pool.slice(0, config.numQuestions).map((q) => q.id);
    setGeneratedQIds(picked);
    setStep("preview");
  };

  const handleSave = () => {
    const totalMarks = generatedQIds.reduce((s, id) => {
      const q = questions.find((x) => x.id === id);
      return s + (q?.marks || 0);
    }, 0);

    const diffVal: "easy" | "medium" | "hard" | "mixed" = 
      config.difficulty === "any" ? "mixed" : (config.difficulty as "easy" | "medium" | "hard");

    onCreateTest({
      id: `test${Date.now()}`,
      name: config.name || "Generated Test",
      categoryId: config.categoryIds.length === 1 ? config.categoryIds[0] : null,
      categoryIds: config.categoryIds,
      difficulty: diffVal,
      questionIds: generatedQIds,
      totalMarks,
      duration: config.duration,
      createdDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      status: "active",
    });
    setStep("done");
  };

  const getCat = (id: string): Category | undefined => categories.find((c) => c.id === id);

  if (step === "done") {
    return (
      <div className="py-16 text-center space-y-4" role="status" aria-live="polite">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" aria-hidden="true" />
        </div>
        <p className="text-base font-bold text-foreground">Test Created!</p>
        <p className="text-sm text-muted-foreground">The test is now live and visible in the Tests tab.</p>
        <button
          type="button"
          onClick={() => setStep("config")}
          className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
        >
          Generate Another
        </button>
      </div>
    );
  }

  return (
    <article className="max-w-2xl mx-auto space-y-5" aria-labelledby="ai-generator-title">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h2 id="ai-generator-title" className="text-[15px] font-bold text-foreground">AI Test Generator</h2>
          <p className="text-[12px] text-muted-foreground">Auto-select questions from your bank</p>
        </div>
      </div>

      {step === "generating" && <AIGenerating onDone={onGeneratingDone} />}

      {step === "config" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          <div>
            <label htmlFor="config-name" className={LABEL}>Test Name</label>
            <input
              id="config-name"
              className={INPUT}
              value={config.name}
              onChange={(e) => upd("name", e.target.value)}
              placeholder="e.g. Tajweed Monthly Test"
            />
          </div>

          <div>
            <span className={LABEL}>Categories (leave empty for all)</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Select categories">
              {categories.map((c) => {
                const active = config.categoryIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCat(c.id)}
                    className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-all ${active ? "text-white border-transparent" : "border-border bg-muted text-foreground hover:bg-muted/80"}`}
                    style={active ? { background: c.color, borderColor: c.color } : {}}
                  >
                    <span>{c.icon}</span> <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="config-difficulty" className={LABEL}>Difficulty</label>
              <select
                id="config-difficulty"
                className={INPUT + " cursor-pointer"}
                value={config.difficulty}
                onChange={(e) => upd("difficulty", e.target.value)}
              >
                <option value="any">Any</option>
                {Object.entries(DIFFICULTY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="config-num" className={LABEL}>No. of Questions</label>
              <input
                id="config-num"
                type="number"
                className={INPUT}
                value={config.numQuestions}
                onChange={(e) => upd("numQuestions", +e.target.value)}
                min={1}
                max={questions.length}
              />
            </div>
            <div>
              <label htmlFor="config-duration" className={LABEL}>Duration (min)</label>
              <input
                id="config-duration"
                type="number"
                className={INPUT}
                value={config.duration}
                onChange={(e) => upd("duration", +e.target.value)}
                min={5}
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.shuffle}
              onChange={(e) => upd("shuffle", e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-foreground">Shuffle question order</span>
          </label>

          {/* Pool preview */}
          {(() => {
            const pool = questions.filter((q) => {
              const mCat = config.categoryIds.length === 0 || config.categoryIds.includes(q.categoryId);
              const mDiff = config.difficulty === "any" || q.difficulty === config.difficulty;
              return mCat && mDiff;
            });
            const valid = pool.length >= config.numQuestions;
            return (
              <div
                className={`flex items-center gap-2 text-[12px] rounded-lg px-3 py-2 ${valid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                role="status"
              >
                {valid ? (
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{pool.length} questions available in pool (need {config.numQuestions})</span>
              </div>
            );
          })()}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!config.numQuestions || questions.filter((q) => {
              const mCat = config.categoryIds.length === 0 || config.categoryIds.includes(q.categoryId);
              const mDiff = config.difficulty === "any" || q.difficulty === config.difficulty;
              return mCat && mDiff;
            }).length < config.numQuestions}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" /> Generate Test with AI
          </button>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4" aria-label="Test Preview">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-bold text-foreground">Preview — {config.name || "Generated Test"}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{generatedQIds.length} questions</span>
                <span className="text-[11px] text-muted-foreground" aria-hidden="true">·</span>
                <span className="text-[11px] text-muted-foreground">{config.duration} min</span>
              </div>
            </div>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1" role="list" aria-label="Preview questions list">
              {generatedQIds.map((id, i) => {
                const q = questions.find((x) => x.id === id);
                if (!q) return null;
                const cat = getCat(q.categoryId);
                const diff = DIFFICULTY[q.difficulty];
                return (
                  <div key={id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50" role="listitem">
                    <span className="text-[11px] font-bold text-muted-foreground w-5 flex-shrink-0 mt-0.5">Q{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-foreground leading-snug">{q.text}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {cat && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: cat.color }}>
                            {cat.name}
                          </span>
                        )}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${diff?.cls}`}>
                          {diff?.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{q.marks} mk{q.marks !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGeneratedQIds((p) => p.filter((x) => x !== id))}
                      aria-label={`Remove question Q${i + 1} from test`}
                      className="p-1 rounded hover:bg-muted text-muted-foreground flex-shrink-0"
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("config")}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90"
            >
              <Save className="w-4 h-4" aria-hidden="true" /> Save & Publish Test
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
