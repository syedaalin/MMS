import React, { useState } from "react";
import { Save, Calendar } from "lucide-react";
import { getObject, saveObject } from "../../lib/db";
import { type SessionsSettings, DEFAULT_SESSIONS_SETTINGS } from "../../lib/settingsTypes";

const INPUT = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (newValue: boolean) => void;
}

/**
 * A reusable toggle switch component.
 * @param props The toggle properties.
 * @returns React element.
 */
function Toggle({ label, description, value, onChange }: ToggleProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-label={`Toggle ${label}`}
        style={{
          width: 40,
          height: 22,
          background: value ? "hsl(var(--primary))" : "hsl(var(--border))",
          borderRadius: 999,
          position: "relative",
          flexShrink: 0,
          transition: "background 0.2s"
        }}
      >
        <span
          style={{
            width: 17,
            height: 17,
            top: 2.5,
            left: value ? 19 : 3,
            position: "absolute",
            borderRadius: "50%",
            background: "white",
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
          }}
        />
      </button>
    </div>
  );
}

/** @see {@link SessionsSettings} is imported from settingsTypes.ts */

/**
 * Component for configuring sessions settings.
 * Allows editing session duration, session type defaults, overlays, archiving, and alerts.
 * @returns React element.
 */
export default function SessionsSettings(): React.JSX.Element {
  const [data, setData] = useState<SessionsSettings>(() =>
    getObject<SessionsSettings>("sessions_settings", DEFAULT_SESSIONS_SETTINGS)
  );
  const [saved, setSaved] = useState<boolean>(false);

  const upd = <K extends keyof SessionsSettings>(f: K, v: SessionsSettings[K]): void => {
    setData((d) => ({ ...d, [f]: v }));
    setSaved(false);
  };

  const handleSave = (): void => {
    saveObject("sessions_settings", data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Calendar className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-[13px] font-bold text-foreground">Sessions Module Settings</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL} htmlFor="defaultDuration">Default Duration (months)</label>
          <input
            id="defaultDuration"
            type="number"
            className={INPUT}
            value={data.defaultDuration}
            onChange={(e) => upd("defaultDuration", e.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="defaultSessionType">Default Session Type</label>
          <select
            id="defaultSessionType"
            className={`${INPUT} cursor-pointer`}
            value={data.defaultSessionType}
            onChange={(e) => upd("defaultSessionType", e.target.value)}
          >
            <option value="annual">Annual</option>
            <option value="semester">Semester</option>
            <option value="trimester">Trimester</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="academicYear">Academic Year</label>
          <input
            id="academicYear"
            type="text"
            className={INPUT}
            value={data.academicYear}
            onChange={(e) => upd("academicYear", e.target.value)}
            placeholder="2025-2026"
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="sessionStart">Session Starts (Month)</label>
          <select
            id="sessionStart"
            className={`${INPUT} cursor-pointer`}
            value={data.sessionStart}
            onChange={(e) => upd("sessionStart", e.target.value)}
          >
            {["january", "february", "march", "april", "may", "june",
              "july", "august", "september", "october", "november", "december"].map((m) => (
              <option key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <Toggle
          label="Allow Overlapping Sessions"
          description="Multiple active sessions can run at the same time"
          value={data.allowOverlap}
          onChange={(v) => upd("allowOverlap", v)}
        />
        <Toggle
          label="Auto-archive Old Sessions"
          description="Completed sessions are automatically archived"
          value={data.archiveOldSessions}
          onChange={(v) => upd("archiveOldSessions", v)}
        />
        <Toggle
          label="Require Budget Plan"
          description="Session must have a budget before activation"
          value={data.requireBudget}
          onChange={(v) => upd("requireBudget", v)}
        />
        <Toggle
          label="Timetable Conflict Check"
          description="Warn when class schedules overlap"
          value={data.timetableConflictCheck}
          onChange={(v) => upd("timetableConflictCheck", v)}
        />
        <Toggle
          label="Notify on Session Start"
          description="Send notification when a new session begins"
          value={data.notifyOnSessionStart}
          onChange={(v) => upd("notifyOnSessionStart", v)}
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        <Save className="w-3.5 h-3.5" />
        <span>{saved ? "Saved!" : "Save Settings"}</span>
      </button>
    </section>
  );
}
