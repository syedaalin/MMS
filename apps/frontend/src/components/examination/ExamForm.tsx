import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, BookOpen } from "lucide-react";
import { CLASSES, Exam } from "../../lib/examinationData";
import { toTitleCase } from "../../lib/utils";

const INPUT = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

const SUBJECTS = ["Tajweed", "Hifz", "Islamic Studies", "Arabic", "Aqeedah", "Quran Recitation", "Fiqh"];

const EMPTY: Omit<Exam, "id"> = {
  name: "",
  subject: "",
  totalMarks: 100,
  passingMarks: 50,
  date: "",
  duration: 60,
  classIds: [],
  description: "",
  status: "upcoming",
};

interface ExamFormProps {
  exam: Exam | null;
  onClose: () => void;
  onSave: (exam: Exam) => void;
}

/**
 * Modal form dialog for creating or updating exam records.
 *
 * @param props - Component props.
 * @param props.exam - Selected exam metadata if editing, otherwise null for creation.
 * @param props.onClose - Action callback to close dialog.
 * @param props.onSave - Callback when saving form changes.
 * @returns The ExamForm component.
 */
export default function ExamForm({ exam, onClose, onSave }: ExamFormProps): React.ReactElement {
  const [data, setData] = useState<Partial<Exam>>(() => {
    return exam ? { ...exam } : { ...EMPTY };
  });

  const upd = <K extends keyof Exam>(f: K, v: Exam[K]) => setData((d: Partial<Exam>) => ({ ...d, [f]: v }));
  const toggleClass = (id: string) =>
    setData((d: Partial<Exam>) => {
      const classIds = d.classIds ? [...d.classIds] : [];
      return {
        ...d,
        classIds: classIds.includes(id) ? classIds.filter((x) => x !== id) : [...classIds, id],
      };
    });

  const valid = !!(data.name && data.subject && data.date && data.classIds && data.classIds.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="exam-form-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg z-10 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" aria-hidden="true" />
            </div>
            <h3 id="exam-form-title" className="text-sm font-bold">{exam ? "Edit Exam" : "Create Exam"}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label htmlFor="exam-name" className={LABEL}>Exam Name *</label>
            <input
              id="exam-name"
              className={INPUT}
              value={data.name || ""}
              onChange={(e) => upd("name", e.target.value)}
              placeholder="e.g. Tajweed Mid-Term"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="exam-subject" className={LABEL}>Subject *</label>
              <select
                id="exam-subject"
                className={INPUT + " cursor-pointer"}
                value={data.subject || ""}
                onChange={(e) => upd("subject", e.target.value)}
                required
              >
                <option value="">Select subject…</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="exam-status" className={LABEL}>Status</label>
              <select
                id="exam-status"
                className={INPUT + " cursor-pointer"}
                value={data.status || "upcoming"}
                onChange={(e) => upd("status", e.target.value as Exam["status"])}
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="exam-total" className={LABEL}>Total Marks</label>
              <input
                id="exam-total"
                type="number"
                className={INPUT}
                value={data.totalMarks ?? 100}
                onChange={(e) => upd("totalMarks", +e.target.value)}
                min={1}
              />
            </div>
            <div>
              <label htmlFor="exam-passing" className={LABEL}>Passing Marks</label>
              <input
                id="exam-passing"
                type="number"
                className={INPUT}
                value={data.passingMarks ?? 50}
                onChange={(e) => upd("passingMarks", +e.target.value)}
                min={1}
                max={data.totalMarks ?? 100}
              />
            </div>
            <div>
              <label htmlFor="exam-duration" className={LABEL}>Duration (min)</label>
              <input
                id="exam-duration"
                type="number"
                className={INPUT}
                value={data.duration ?? 60}
                onChange={(e) => upd("duration", +e.target.value)}
                min={5}
              />
            </div>
          </div>

          <div>
            <label htmlFor="exam-date" className={LABEL}>Exam Date *</label>
            <input
              id="exam-date"
              type="date"
              className={INPUT}
              value={data.date || ""}
              onChange={(e) => upd("date", e.target.value)}
              required
            />
          </div>

          <div>
            <span className={LABEL}>Assign to Classes *</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Assign to classes list">
              {CLASSES.map((cls) => {
                const active = !!(data.classIds && data.classIds.includes(cls.id));
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => toggleClass(cls.id)}
                    className={`px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-all ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    {cls.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="exam-desc" className={LABEL}>Description</label>
            <textarea
              id="exam-desc"
              className={INPUT + " resize-none"}
              rows={2}
              value={data.description || ""}
              onChange={(e) => upd("description", e.target.value)}
              placeholder="Optional notes about this exam…"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
          <button
            type="button"
            onClick={() => valid && onSave({ ...data, name: toTitleCase(data.name || ""), id: exam?.id || `ex${Date.now()}` } as Exam)}
            disabled={!valid}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" /> {exam ? "Save Changes" : "Create Exam"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
