import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, Loader2 } from "lucide-react";
import { SESSION_TYPES, Session } from "../../lib/sessionsData";
import { toTitleCase } from "../../lib/utils";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
const LABEL = "text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

const EMPTY: Partial<Session> = { name: "", type: "Hifz", status: "active", startDate: "", endDate: "", baseFee: 0, currency: "PKR", description: "" };

interface SessionFormProps {
  session?: Session | null;
  onClose: () => void;
  onSave: (session: Session) => void;
}

/**
 * SessionForm Component
 *
 * A modal form for creating or editing a session.
 *
 * @param {SessionFormProps} props - The component props.
 * @returns {React.ReactElement}
 */
export default function SessionForm({ session, onClose, onSave }: SessionFormProps) {
  const [data, setData] = useState<Partial<Session>>(session ? { ...session } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const upd = <K extends keyof Session>(f: K, v: Session[K]) => setData((d) => ({ ...d, [f]: v }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    const saved = { ...data, name: toTitleCase(data.name || "") };
    onSave({
      ...saved,
      id: session?.id || `s${Date.now()}`,
      name: saved.name || "Untitled Session",
      type: saved.type || "Hifz",
      status: saved.status || "active",
      startDate: saved.startDate || "",
      endDate: saved.endDate || "",
      baseFee: Number(saved.baseFee) || 0,
      currency: saved.currency || "PKR",
      classes: session?.classes || [],
      timetable: session?.timetable || [],
      discounts: session?.discounts || [],
      budget: session?.budget || { totalRevenue: 0, collected: 0, expenses: [], incomes: [] },
      events: session?.events || [],
      tabarruk: session?.tabarruk || [],
    } as Session);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="session-form-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.form
        onSubmit={(e) => { e.preventDefault(); handleSave(); }}
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col z-10"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 id="session-form-title" className="text-base font-bold text-foreground m-0">{session ? "Edit Session" : "New Session"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 m-0">Fill in the session details below</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </header>

        <fieldset className="flex-1 overflow-y-auto px-6 py-5 space-y-4 border-none p-0 m-0">
          <div>
            <label className={LABEL} htmlFor="sessionName">Session Name *</label>
            <input id="sessionName" className={INPUT} value={data.name || ""} onChange={(e) => upd("name", e.target.value)} placeholder="e.g. Summer Hifz Programme 2025" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL} htmlFor="sessionType">Type</label>
              <select id="sessionType" className={INPUT + " cursor-pointer"} value={data.type || "Hifz"} onChange={(e) => upd("type", e.target.value as Session["type"])}>
                {SESSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="sessionStatus">Status</label>
              <select id="sessionStatus" className={INPUT + " cursor-pointer"} value={data.status || "active"} onChange={(e) => upd("status", e.target.value as Session["status"])}>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL} htmlFor="sessionStartDate">Start Date *</label>
              <input id="sessionStartDate" type="date" className={INPUT} value={data.startDate || ""} onChange={(e) => upd("startDate", e.target.value)} required />
            </div>
            <div>
              <label className={LABEL} htmlFor="sessionEndDate">End Date *</label>
              <input id="sessionEndDate" type="date" className={INPUT} value={data.endDate || ""} onChange={(e) => upd("endDate", e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL} htmlFor="sessionBaseFee">Base Fee *</label>
              <input id="sessionBaseFee" type="number" min="0" className={INPUT} value={data.baseFee || ""} onChange={(e) => upd("baseFee", Number(e.target.value))} placeholder="0" required />
            </div>
            <div>
              <label className={LABEL} htmlFor="sessionCurrency">Currency</label>
              <select id="sessionCurrency" className={INPUT + " cursor-pointer"} value={data.currency || "PKR"} onChange={(e) => upd("currency", e.target.value)}>
                {["PKR", "USD", "GBP", "AED", "SAR"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL} htmlFor="sessionDescription">Description</label>
            <textarea id="sessionDescription" className={INPUT + " min-h-[80px] resize-none"} value={data.description || ""} onChange={(e) => upd("description", e.target.value)} placeholder="Brief description of this session…" />
          </div>
        </fieldset>

        <footer className="px-6 py-4 border-t border-border flex justify-end gap-2.5 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
          <button
            type="submit"
            disabled={saving || !data.name || !data.startDate || !data.endDate}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
            {saving ? "Saving…" : session ? "Update" : "Create Session"}
          </button>
        </footer>
      </motion.form>
    </div>
  );
}
