import React, { useState } from "react";
import { Save, Globe, Bell, Lock, Moon, Sun, Monitor, LucideIcon, LayoutDashboard, GraduationCap, Users, Calendar, UserPlus, UserCheck, FileText, DollarSign, Briefcase, Star, Shield, BarChart3, Boxes } from "lucide-react";
import { getObject, saveObject } from "../../lib/db";
import { type GlobalSettings as GlobalSettingsData, DEFAULT_GLOBAL_SETTINGS, SYSTEM_MODULES } from "../../lib/settingsTypes";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, GraduationCap, Users, Calendar, UserPlus, UserCheck, FileText, DollarSign, Briefcase, Star, Shield, BarChart3
};

const INPUT = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

interface SectionProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}

/**
 * A layout section component with an icon and heading.
 * @param props Component properties.
 * @returns React element.
 */
function Section({ icon: Icon, title, children }: SectionProps): React.JSX.Element {
  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-[13px] font-bold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (newValue: boolean) => void;
}

/**
 * A toggle switch component.
 * @param props Component properties.
 * @returns React element.
 */
function Toggle({ label, description, value, onChange }: ToggleProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-label={`Toggle ${label}`}
        className={`relative w-10 h-5.5 rounded-full transition-colors ${value ? "bg-primary" : "bg-border"}`}
        style={{ height: "22px" }}
      >
        <span
          className={`absolute w-4.5 h-4.5 rounded-full bg-white shadow transition-all`}
          style={{
            width: "17px",
            height: "17px",
            top: "2.5px",
            left: value ? "19px" : "3px"
          }}
        />
      </button>
    </div>
  );
}

/** @see {@link GlobalSettingsData} is imported from settingsTypes.ts */

/**
 * Component for configuring global application settings.
 * Includes general, appearance, notification, and security preferences.
 * @returns React element.
 */
export default function GlobalSettings(): React.JSX.Element {
  const [data, setData] = useState<GlobalSettingsData>(() => getObject<GlobalSettingsData>("global_settings", DEFAULT_GLOBAL_SETTINGS));
  const [saved, setSaved] = useState<boolean>(false);

  const upd = <K extends keyof GlobalSettingsData>(f: K, v: GlobalSettingsData[K]): void => {
    setData((d) => ({ ...d, [f]: v }));
    setSaved(false);
  };

  const handleSave = (): void => {
    saveObject("global_settings", data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updModule = (id: string, enabled: boolean): void => {
    const modules = { ...data.enabledModules, [id]: enabled };
    upd("enabledModules", modules);
  };

  return (
    <div className="max-w-2xl space-y-5">
      {/* Modules */}
      <Section icon={Boxes} title="System Modules">
        <div className="grid gap-4">
          <p className="text-[11px] text-muted-foreground italic -mt-2">
            Enable or disable specific features of the management system. Some core modules are required.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {SYSTEM_MODULES.map((m) => {
              const Icon = ICONS[m.icon] || Boxes;
              const isEnabled = data.enabledModules?.[m.id] ?? true;
              return (
                <div key={m.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${isEnabled ? "bg-card border-border shadow-sm" : "bg-muted/40 border-border/50 opacity-60"}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-foreground truncate">{m.label}</span>
                      {m.required ? (
                        <span className="text-[9px] font-black text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">Required</span>
                      ) : (
                        <Toggle
                          label=""
                          value={isEnabled}
                          onChange={(v) => updModule(m.id, v)}
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{m.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* General */}
      <Section icon={Globe} title="General">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL} htmlFor="language">Language</label>
            <select
              id="language"
              className={`${INPUT} cursor-pointer`}
              value={data.language}
              onChange={(e) => upd("language", e.target.value)}
            >
              <option value="en">English</option>
              <option value="ar">Arabic (عربي)</option>
              <option value="ur">Urdu (اردو)</option>
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="timezone">Timezone</label>
            <select
              id="timezone"
              className={`${INPUT} cursor-pointer`}
              value={data.timezone}
              onChange={(e) => upd("timezone", e.target.value)}
            >
              <option value="Asia/Karachi">Asia/Karachi (UTC+5)</option>
              <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
              <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
              <option value="Europe/London">Europe/London (UTC+0)</option>
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="dateFormat">Date Format</label>
            <select
              id="dateFormat"
              className={`${INPUT} cursor-pointer`}
              value={data.dateFormat}
              onChange={(e) => upd("dateFormat", e.target.value)}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
        {/* Currency → Finance Settings | Academic Year, Session Starts → Sessions Settings */}
      </Section>

      {/* Appearance */}
      <Section icon={Monitor} title="Appearance">
        <div>
          <span className={LABEL}>Theme</span>
          <div className="flex gap-2">
            {[
              { v: "light" as const, icon: Sun, label: "Light" },
              { v: "dark" as const, icon: Moon, label: "Dark" },
              { v: "system" as const, icon: Monitor, label: "System" }
            ].map(({ v, icon: Icon, label }) => (
              <button
                type="button"
                key={v}
                onClick={() => upd("theme", v)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-[12px] font-semibold transition-all ${
                  data.theme === v
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications">
        <div className="space-y-3">
          <Toggle
            label="Email Notifications"
            description="Receive system emails"
            value={data.emailNotifications}
            onChange={(v) => upd("emailNotifications", v)}
          />
          <Toggle
            label="SMS Notifications"
            description="Receive SMS alerts"
            value={data.smsNotifications}
            onChange={(v) => upd("smsNotifications", v)}
          />
          {/* attendanceAlerts → Attendance Settings, feeReminders → Finance Settings, examReminders → Examinations Settings */}
        </div>
      </Section>

      {/* Security */}
      <Section icon={Lock} title="Security">
        <div className="space-y-4">
          <Toggle
            label="Two-Factor Authentication"
            description="Require 2FA for admin login"
            value={data.twoFactor}
            onChange={(v) => upd("twoFactor", v)}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} htmlFor="sessionTimeout">Session Timeout (min)</label>
              <select
                id="sessionTimeout"
                className={`${INPUT} cursor-pointer`}
                value={data.sessionTimeout}
                onChange={(e) => upd("sessionTimeout", e.target.value)}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="480">8 hours</option>
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="passwordPolicy">Password Policy</label>
              <select
                id="passwordPolicy"
                className={`${INPUT} cursor-pointer`}
                value={data.passwordPolicy}
                onChange={(e) => upd("passwordPolicy", e.target.value)}
              >
                <option value="basic">Basic (6+ chars)</option>
                <option value="medium">Medium (8+ chars, numbers)</option>
                <option value="strong">Strong (12+, mixed)</option>
              </select>
            </div>
          </div>
        </div>
      </Section>

      <button
        type="button"
        onClick={handleSave}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        <Save className="w-3.5 h-3.5" />
        <span>{saved ? "Settings Saved!" : "Save Settings"}</span>
      </button>
    </div>
  );
}
