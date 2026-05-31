import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, X, Filter, Edit2, Trash2, Save, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { DIFFICULTY, QUESTION_TYPES, Question, Category } from "../../lib/assessmentData";

const INPUT = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

interface QuestionModalProps {
  question: Question | null;
  categories: Category[];
  onClose: () => void;
  onSave: (q: Question) => void;
}

const EMPTY_Q: Omit<Question, "id"> = {
  categoryId: "",
  type: "mcq",
  difficulty: "easy",
  text: "",
  options: ["", "", "", ""],
  answer: "",
  marks: 2,
  tags: [],
};

/**
 * QuestionModal component for adding or editing a question.
 *
 * @param props - Component props.
 * @param props.question - The question being edited, or null for a new question.
 * @param props.categories - List of categories available.
 * @param props.onClose - Callback when modal is closed.
 * @param props.onSave - Callback when question is saved.
 * @returns Question modal dialog.
 */
function QuestionModal({ question, categories, onClose, onSave }: QuestionModalProps): React.ReactElement {
  const [data, setData] = useState<Partial<Question>>(() => {
    if (question) {
      return {
        ...question,
        options: question.options && question.options.length ? [...question.options] : ["", "", "", ""],
      };
    }
    return { ...EMPTY_Q };
  });

  const upd = (f: keyof Question, v: Question[keyof Question]) => setData((d) => ({ ...d, [f]: v }));
  const updOption = (i: number, v: string) => setData((d) => {
    const opts = d.options ? [...d.options] : ["", "", "", ""];
    opts[i] = v;
    return { ...d, options: opts };
  });

  const isMcq = data.type === "mcq";
  const isTF = data.type === "true_false";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="question-modal-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg z-10 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h3 id="question-modal-title" className="text-sm font-bold">{question ? "Edit Question" : "Add Question"}</h3>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="modal-category" className={LABEL}>Category *</label>
              <select
                id="modal-category"
                className={INPUT + " cursor-pointer"}
                value={data.categoryId || ""}
                onChange={(e) => upd("categoryId", e.target.value)}
              >
                <option value="">Select…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="modal-type" className={LABEL}>Type</label>
              <select
                id="modal-type"
                className={INPUT + " cursor-pointer"}
                value={data.type || "mcq"}
                onChange={(e) => upd("type", e.target.value)}
              >
                {Object.entries(QUESTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="modal-difficulty" className={LABEL}>Difficulty</label>
              <select
                id="modal-difficulty"
                className={INPUT + " cursor-pointer"}
                value={data.difficulty || "easy"}
                onChange={(e) => upd("difficulty", e.target.value)}
              >
                {Object.entries(DIFFICULTY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="modal-text" className={LABEL}>Question Text *</label>
            <textarea
              id="modal-text"
              className={INPUT + " resize-none"}
              rows={3}
              value={data.text || ""}
              onChange={(e) => upd("text", e.target.value)}
              placeholder="Enter question…"
            />
          </div>

          {isMcq && data.options && (
            <div>
              <span className={LABEL}>Options (mark correct one)</span>
              <div className="space-y-2" role="radiogroup" aria-label="Question options">
                {data.options.slice(0, 4).map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="answer"
                      value={opt}
                      checked={data.answer === opt}
                      onChange={() => upd("answer", opt)}
                      className="accent-primary w-4 h-4 flex-shrink-0"
                      aria-label={`Mark option ${i + 1} as correct`}
                    />
                    <input
                      type="text"
                      className={INPUT}
                      value={opt}
                      onChange={(e) => updOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      aria-label={`Option ${i + 1} text`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {isTF && (
            <div>
              <span className={LABEL}>Correct Answer</span>
              <div className="flex gap-3" role="group" aria-label="True or False correct answer selector">
                {["True", "False"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { upd("answer", v); upd("options", ["True", "False"]); }}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${data.answer === v ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted text-muted-foreground"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {data.type === "short" && (
            <div>
              <label htmlFor="modal-answer" className={LABEL}>Model Answer</label>
              <textarea
                id="modal-answer"
                className={INPUT + " resize-none"}
                rows={2}
                value={data.answer || ""}
                onChange={(e) => upd("answer", e.target.value)}
                placeholder="Model answer for grading reference…"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="modal-marks" className={LABEL}>Marks</label>
              <input
                id="modal-marks"
                type="number"
                className={INPUT}
                value={data.marks || 2}
                onChange={(e) => upd("marks", +e.target.value)}
                min={1}
              />
            </div>
            <div>
              <label htmlFor="modal-tags" className={LABEL}>Tags (comma-separated)</label>
              <input
                id="modal-tags"
                className={INPUT}
                value={Array.isArray(data.tags) ? data.tags.join(", ") : ""}
                onChange={(e) => upd("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
                placeholder="e.g. tajweed, noon"
              />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border flex justify-end gap-2.5 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
          <button
            type="button"
            onClick={() => onSave({ ...data, id: question?.id || `q${Date.now()}` } as Question)}
            disabled={!data.text || !data.categoryId}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" /> Save Question
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface QuestionBankProps {
  questions: Question[];
  categories: Category[];
  onUpdate: (questions: Question[]) => void;
}

/**
 * QuestionBank manager component.
 *
 * @param props - Component props.
 * @param props.questions - Currently registered questions list.
 * @param props.categories - Topic categories.
 * @param props.onUpdate - Callback to update questions list.
 * @returns The QuestionBank component.
 */
export default function QuestionBank({ questions, categories, onUpdate }: QuestionBankProps): React.ReactElement {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [search, setSearch] = useState<string>("");
  const [filterCats, setFilterCats] = useState<string[]>([]);
  const [filterDiff, setFilterDiff] = useState<string[]>([]);

  const filtered = useMemo<Question[]>(() => questions.filter((q) => {
    const mS = !search || q.text.toLowerCase().includes(search.toLowerCase());
    const mC = filterCats.length === 0 || filterCats.includes(q.categoryId);
    const mD = filterDiff.length === 0 || filterDiff.includes(q.difficulty);
    return mS && mC && mD;
  }), [questions, search, filterCats, filterDiff]);

  const handleSave = (q: Question) => {
    const exists = questions.find((x) => x.id === q.id);
    onUpdate(exists ? questions.map((x) => x.id === q.id ? q : x) : [...questions, q]);
    setShowModal(false);
    setEditQ(null);
  };

  const getCat = (id: string): Category | undefined => categories.find((c) => c.id === id);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions…"
            aria-label="Search questions"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium ${filterCats.length ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card hover:bg-muted"}`}>
              <Filter className="w-3.5 h-3.5" aria-hidden="true" /> Category {filterCats.length > 0 && `(${filterCats.length})`} <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border border-border rounded-xl shadow-lg p-1 z-50">
            <DropdownMenuLabel className="text-xs font-semibold px-2 py-1.5">Filter by Category</DropdownMenuLabel>
            <DropdownMenuSeparator className="h-px bg-border my-1" />
            {categories.map((c) => (
              <DropdownMenuCheckboxItem
                key={c.id}
                checked={filterCats.includes(c.id)}
                onCheckedChange={() => setFilterCats((p) => p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id])}
                className="text-xs px-2 py-1.5 hover:bg-muted rounded-lg cursor-pointer"
              >
                {c.icon} {c.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium ${filterDiff.length ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card hover:bg-muted"}`}>
              <Filter className="w-3.5 h-3.5" aria-hidden="true" /> Difficulty {filterDiff.length > 0 && `(${filterDiff.length})`} <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 bg-card border border-border rounded-xl shadow-lg p-1 z-50">
            <DropdownMenuLabel className="text-xs font-semibold px-2 py-1.5">Difficulty</DropdownMenuLabel>
            <DropdownMenuSeparator className="h-px bg-border my-1" />
            {Object.entries(DIFFICULTY).map(([k, v]) => (
              <DropdownMenuCheckboxItem
                key={k}
                checked={filterDiff.includes(k)}
                onCheckedChange={() => setFilterDiff((p) => p.includes(k) ? p.filter((x) => x !== k) : [...p, k])}
                className="text-xs px-2 py-1.5 hover:bg-muted rounded-lg cursor-pointer"
              >
                {v.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          onClick={() => { setEditQ(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Question
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground" role="status" aria-label="Question stats">
        <span><strong className="text-foreground">{filtered.length}</strong> questions</span>
        {Object.entries(DIFFICULTY).map(([k, v]) => (
          <span key={k}><strong className="text-foreground">{questions.filter((q) => q.difficulty === k).length}</strong> {v.label.toLowerCase()}</span>
        ))}
      </div>

      {/* Question list */}
      <div className="space-y-3" role="list" aria-label="Questions bank">
        {filtered.map((q, i) => {
          const cat = getCat(q.categoryId);
          const diff = DIFFICULTY[q.difficulty];
          const qType = QUESTION_TYPES[q.type];
          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-border bg-card p-4 group hover:shadow-sm transition-all"
              role="listitem"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {cat && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: cat.color }}>
                        {cat.icon} {cat.name}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diff?.cls}`}>{diff?.label}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{qType?.icon} {qType?.label}</span>
                    <span className="text-[10px] font-bold text-foreground bg-muted px-2 py-0.5 rounded-full">{q.marks} mk{q.marks !== 1 ? "s" : ""}</span>
                  </div>
                  <p className="text-[13px] font-semibold text-foreground leading-snug">{q.text}</p>
                  {q.type === "mcq" && q.options && q.options.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {q.options.filter(Boolean).map((o, oi) => (
                        <span key={oi} className={`text-[11px] px-2 py-0.5 rounded-md border ${o === q.answer ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold" : "bg-muted text-muted-foreground border-border"}`}>
                          {o === q.answer ? "✓ " : ""}{o}
                        </span>
                      ))}
                    </div>
                  )}
                  {q.type === "true_false" && (
                    <p className="text-[11px] mt-1.5 text-emerald-600 font-semibold">✓ {q.answer}</p>
                  )}
                  {q.tags && q.tags.length > 0 && (
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      {q.tags.map((t) => <span key={t} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">#{t}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => { setEditQ(q); setShowModal(true); }}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Edit question"
                    aria-label={`Edit question: ${q.text}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate(questions.filter((x) => x.id !== q.id))}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-destructive"
                    title="Delete question"
                    aria-label={`Delete question: ${q.text}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-14 text-center rounded-xl border-2 border-dashed border-border" role="status">
            <p className="text-sm font-medium text-muted-foreground">No questions found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && <QuestionModal question={editQ} categories={categories} onClose={() => { setShowModal(false); setEditQ(null); }} onSave={handleSave} />}
      </AnimatePresence>
    </div>
  );
}
