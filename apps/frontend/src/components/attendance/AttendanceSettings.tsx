import React, { useState } from "react";
import { Save, RotateCcw, QrCode, Bell, Clock, Shield, Scan } from "lucide-react";
import { DEFAULT_ATT_SETTINGS, type AttendanceSettings as AttendanceSettingsData } from "../../lib/attendanceData";

interface AttendanceSettingsProps {
  role: string;
  settings: AttendanceSettingsData;
  setSettings: React.Dispatch<React.SetStateAction<AttendanceSettingsData>>;
}

interface SettingRowProps {
  label: string;
  sub?: string;
  children: React.ReactNode;
}

function SettingRow({ label, sub, children }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button 
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 rounded-full transition-colors flex items-center ${checked ? "bg-primary" : "bg-border"}`}
      style={{ height: "22px" }}
    >
      <span className={`absolute w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? "left-5" : "left-1"}`} />
    </button>
  );
}

/**
 * AttendanceSettings
 * 
 * Provides an interface for administrators to configure global attendance rules,
 * such as late thresholds, QR code enablement, and notifications.
 * 
 * @param {AttendanceSettingsProps} props - The component props.
 * @returns {React.ReactElement} The rendered settings component.
 */
export default function AttendanceSettings({ role, settings, setSettings }: AttendanceSettingsProps) {
  const [saved, setSaved] = useState(false);

  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <p className="text-base font-semibold text-foreground">Admin Access Required</p>
        <p className="text-sm text-muted-foreground mt-1">Only administrators can configure attendance settings.</p>
      </div>
    );
  }

  const set = <K extends keyof AttendanceSettingsData>(k: K, v: AttendanceSettingsData[K]) => { 
    setSettings((s) => ({ ...s, [k]: v })); 
    setSaved(false); 
  };

  const handleSave = () => setSaved(true);
  const handleReset = () => { 
    setSettings(DEFAULT_ATT_SETTINGS); 
    setSaved(false); 
  };

  return (
    <section className="max-w-2xl space-y-6">
      {/* Timing */}
      <article className="rounded-xl border border-border bg-card overflow-hidden">
        <header className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground m-0">Timing Rules</h2>
        </header>
        <div className="px-4">
          <SettingRow label="Late Threshold" sub="Students arriving after this many minutes are marked Late">
            <div className="flex items-center gap-2">
              <label htmlFor="setting-late-threshold" className="sr-only">Late Threshold Minutes</label>
              <input 
                id="setting-late-threshold"
                type="number" 
                min={1} 
                max={60} 
                value={settings.lateThresholdMins}
                onChange={(e) => set("lateThresholdMins", Number(e.target.value))}
                className="w-16 text-sm text-center rounded-lg border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20" 
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </SettingRow>
          <SettingRow label="Auto-Absent After" sub="Mark student absent if not arrived after this threshold">
            <div className="flex items-center gap-2">
              <label htmlFor="setting-auto-absent" className="sr-only">Auto Absent Minutes</label>
              <input 
                id="setting-auto-absent"
                type="number" 
                min={10} 
                max={120} 
                value={settings.autoAbsentAfterMins}
                onChange={(e) => set("autoAbsentAfterMins", Number(e.target.value))}
                className="w-16 text-sm text-center rounded-lg border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20" 
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </SettingRow>
          <SettingRow label="Lock After Submit" sub="Prevent edits once attendance is submitted">
            <Toggle checked={settings.lockAfterSubmit} onChange={(v) => set("lockAfterSubmit", v)} />
          </SettingRow>
        </div>
      </article>

      {/* QR */}
      <article className="rounded-xl border border-border bg-card overflow-hidden">
        <header className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground m-0">QR Attendance</h2>
        </header>
        <div className="px-4">
          <SettingRow label="Enable QR Attendance" sub="Allow teachers to scan student QR codes to mark attendance">
            <Toggle checked={settings.qrEnabled} onChange={(v) => set("qrEnabled", v)} />
          </SettingRow>
        </div>
      </article>

      {/* Alerts */}
      <article className="rounded-xl border border-border bg-card overflow-hidden">
        <header className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground m-0">Alerts & Notifications</h2>
        </header>
        <div className="px-4">
          <SettingRow label="Low Attendance Threshold" sub="Trigger alert when student attendance drops below this %">
            <div className="flex items-center gap-2">
              <label htmlFor="setting-low-attendance" className="sr-only">Low Attendance Threshold Percentage</label>
              <input 
                id="setting-low-attendance"
                type="number" 
                min={50} 
                max={100} 
                value={settings.lowAttendanceThreshold}
                onChange={(e) => set("lowAttendanceThreshold", Number(e.target.value))}
                className="w-16 text-sm text-center rounded-lg border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20" 
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </SettingRow>
          <SettingRow label="Notify Parents" sub="Send SMS/WhatsApp to parent on student absence">
            <Toggle checked={settings.notifyParents} onChange={(v) => set("notifyParents", v)} />
          </SettingRow>
          <SettingRow label="Require Note for Absent" sub="Teacher must add a note when marking a student absent">
            <Toggle checked={settings.requireNoteForAbsent} onChange={(v) => set("requireNoteForAbsent", v)} />
          </SettingRow>
        </div>
      </article>

      {/* Advanced Features */}
      <article className="rounded-xl border border-border bg-card overflow-hidden">
        <header className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
          <Scan className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground m-0">Advanced Features</h2>
        </header>
        <div className="px-4">
          <SettingRow label="Offline Mode" sub="Allow teachers to mark attendance without internet; syncs when reconnected">
            <Toggle checked={settings.offlineEnabled ?? true} onChange={(v) => set("offlineEnabled", v)} />
          </SettingRow>
          <SettingRow label="Geo-location Tagging" sub="Record teacher's GPS coordinates when submitting attendance">
            <Toggle checked={settings.geoTagging ?? false} onChange={(v) => set("geoTagging", v)} />
          </SettingRow>
          <SettingRow label="Facial Recognition" sub="AI-powered face scan for attendance (coming soon)">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Coming Soon</span>
          </SettingRow>
          <SettingRow label="Daily Auto-Lock" sub="Automatically lock attendance after end-of-day submission">
            <Toggle checked={settings.lockAfterSubmit} onChange={(v) => set("lockAfterSubmit", v)} />
          </SettingRow>
          <SettingRow label="Audit Logging" sub="Record all edits and submissions in an audit trail (always on)">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Active</span>
          </SettingRow>
        </div>
      </article>

      {/* Actions */}
      <div className="flex gap-3">
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? "Saved!" : "Save Settings"}
        </button>
        <button 
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
        </button>
      </div>
    </section>
  );
}
