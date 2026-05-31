import React, { useState } from "react";
import { Save, FileText } from "lucide-react";
import { getObject, saveObject } from "../../lib/db";
import { type ExaminationsSettings, DEFAULT_EXAMINATIONS_SETTINGS } from "../../lib/settingsTypes";

const INPUT = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (val: boolean) => void;
}

/**
 * Custom switch toggle component.
 *
 * @returns Component layout.
 */
function Toggle({ label, description, value, onChange }: ToggleProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={`${label}: ${description || ""}`}
        onClick={() => onChange(!value)}
        style={{ width: 40, height: 22, background: value ? "hsl(var(--primary))" : "hsl(var(--border))", borderRadius: 999, position: "relative", flexShrink: 0, transition: "background 0.2s" }}
      >
        <span style={{ width: 17, height: 17, top: 2.5, left: value ? 19 : 3, position: "absolute", borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </button>
    </div>
  );
}

/** @see {@link ExaminationsSettings} is imported from settingsTypes.ts */

/**
 * Panel managing configuration variables for grading, exams, and certificates.
 *
 * @returns The ExaminationsSettings component.
 */
export default function ExaminationsSettings(): React.ReactElement {
  const [data, setData] = useState<ExaminationsSettings>(() => getObject<ExaminationsSettings>("examinations_settings", DEFAULT_EXAMINATIONS_SETTINGS));
  const [saved, setSaved] = useState<boolean>(false);

  const upd = (f: keyof ExaminationsSettings, v: ExaminationsSettings[keyof ExaminationsSettings]) => {
    setData((d) => ({ ...d, [f]: v }));
    setSaved(false);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4" aria-labelledby="exams-settings-title">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        </div>
        <h3 id="exams-settings-title" className="text-[13px] font-bold text-foreground">Examinations Module Settings</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="pass-mark" className={LABEL}>Pass Mark</label>
          <input
            id="pass-mark"
            type="number"
            className={INPUT}
            value={data.passMark}
            onChange={(e) => upd("passMark", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="max-mark" className={LABEL}>Max Mark</label>
          <input
            id="max-mark"
            type="number"
            className={INPUT}
            value={data.maxMark}
            onChange={(e) => upd("maxMark", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="grading-sys" className={LABEL}>Grading System</label>
          <select
            id="grading-sys"
            className={INPUT + " cursor-pointer"}
            value={data.gradingSystem}
            onChange={(e) => upd("gradingSystem", e.target.value)}
          >
            <option value="percentage">Percentage (0–100)</option>
            <option value="gpa">GPA (4.0 scale)</option>
            <option value="letter">Letter Grade (A–F)</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label htmlFor="cert-template" className={LABEL}>Certificate Template</label>
          <select
            id="cert-template"
            className={INPUT + " cursor-pointer"}
            value={data.certificateTemplate}
            onChange={(e) => upd("certificateTemplate", e.target.value)}
          >
            <option value="default">Default</option>
            <option value="islamic">Islamic Style</option>
            <option value="formal">Formal</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
      </div>

      <div className="space-y-2 pt-1" role="group" aria-label="Exam registry feature flags toggles">
        <Toggle label="Show Student Rankings" description="Display rank/position on result cards" value={data.showRankings} onChange={(v) => upd("showRankings", v)} />
        <Toggle label="Allow Exam Retakes" description="Students can retake failed exams" value={data.allowRetake} onChange={(v) => upd("allowRetake", v)} />
        <Toggle label="Auto-publish Results" description="Results visible to students immediately after grading" value={data.autoPublishResults} onChange={(v) => upd("autoPublishResults", v)} />
        <Toggle label="Notify on Result Publication" description="Send notification to students/guardians when results are out" value={data.notifyOnResult} onChange={(v) => upd("notifyOnResult", v)} />
        <Toggle label="AI-assisted Grading" description="Use AI to help grade subjective answers" value={data.aiGrading} onChange={(v) => upd("aiGrading", v)} />
        <Toggle label="Distinguish Honours" description="Award honours/distinction for high scorers" value={data.distinguishHonours} onChange={(v) => upd("distinguishHonours", v)} />
        <Toggle label="Exam Reminders" description="Notify students and guardians before upcoming exams" value={data.examReminders} onChange={(v) => upd("examReminders", v)} />
      </div>

      <button
        type="button"
        onClick={() => {
          saveObject("examinations_settings", data);
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
      >
        <Save className="w-3.5 h-3.5" aria-hidden="true" /> {saved ? "Saved!" : "Save Settings"}
      </button>
    </section>
  );
}
