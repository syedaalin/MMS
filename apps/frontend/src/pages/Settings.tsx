import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon, Globe, Palette, Database,
  Users, GraduationCap, ClipboardList, Calendar, UserCheck,
  DollarSign, FileText,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";

// System settings panels
import GlobalSettings from "../components/settings/GlobalSettings";
import BrandingSettings from "../components/settings/BrandingSettings";
import BackupRestore from "../components/settings/BackupRestore";

// Module settings panels
import { ContactConfigProvider, useContactConfig } from "../lib/ContactConfigContext";
import ContactsSettingsPanel from "../components/contacts/ContactsSettingsPanel";
import StudentsSettings from "../components/students/StudentsSettings";
import EnrollmentsSettings from "../components/enrollment/EnrollmentsSettings";
import SessionsSettings from "../components/sessions/SessionsSettings";
import AttendanceSettings from "../components/attendance/AttendanceSettings";
import FinanceSettings from "../components/finance/FinanceSettings";
import ExaminationsSettings from "../components/examination/ExaminationsSettings";

// Attendance helper
import { DEFAULT_ATT_SETTINGS } from "../lib/attendanceData";
import { getObject, saveObject } from "../lib/db";

/**
 * Context wrapper for ContactsSettingsPanel.
 */
function ContactsSettingsWrapper(): React.JSX.Element {
  return (
    <ContactConfigProvider>
      <ContactsSettingsConsumer />
    </ContactConfigProvider>
  );
}

function ContactsSettingsConsumer(): React.JSX.Element {
  const { fieldConfig, updateConfig } = useContactConfig();
  return <ContactsSettingsPanel config={fieldConfig} onConfigChange={updateConfig} />;
}

/**
 * State wrapper for AttendanceSettings.
 */
function AttendanceSettingsWrapper(): React.JSX.Element {
  const [settings, setSettings] = useState(() => getObject("attendance_settings", DEFAULT_ATT_SETTINGS));
  useEffect(() => {
    saveObject("attendance_settings", settings);
  }, [settings]);

  return <AttendanceSettings role="admin" settings={settings} setSettings={setSettings} />;
}

const NAV = [
  {
    group: "System",
    items: [
      { id: "global",   label: "Global Settings",    icon: Globe,    description: "Language, timezone, formats, security" },
      { id: "branding", label: "Branding",            icon: Palette,  description: "Logo, colors & appearance" },
      { id: "backup",   label: "Backup & Restore",    icon: Database, description: "Data backup & recovery" },
    ],
  },
  {
    group: "Modules",
    items: [
      { id: "contacts",     label: "Contacts Settings",     icon: Users,          description: "Dynamic fields, preferences & dynamic lists" },
      { id: "students",     label: "Students Settings",     icon: GraduationCap,  description: "ID prefixes, age rules & features" },
      { id: "enrollments",  label: "Enrollments Settings",  icon: ClipboardList,  description: "Capacities, deadlines & waitlists" },
      { id: "sessions",     label: "Sessions Settings",     icon: Calendar,       description: "Academic year & conflict check" },
      { id: "attendance",   label: "Attendance Settings",   icon: UserCheck,      description: "Cutoff times, grace periods & alerts" },
      { id: "finance",      label: "Finance Settings",      icon: DollarSign,     description: "Currency, prefixes & payment methods" },
      { id: "examinations", label: "Examinations Settings", icon: FileText,       description: "Passing marks, grading & certificates" },
    ],
  },
];

const CONTENT_MAP = {
  global:       <GlobalSettings />,
  branding:     <BrandingSettings />,
  backup:       <BackupRestore />,
  contacts:     <ContactsSettingsWrapper />,
  students:     <StudentsSettings />,
  enrollments:  <EnrollmentsSettings />,
  sessions:     <SessionsSettings />,
  attendance:   <AttendanceSettingsWrapper />,
  finance:      <FinanceSettings />,
  examinations: <ExaminationsSettings />,
};

/**
 * Settings Page Component
 *
 * Renders the system configuration workspace, offering tabs for Global Settings,
 * Branding customization (logos/colors), and Backup & Restore operations.
 *
 * @returns React element representing the Settings view.
 */
export default function Settings() {
  const [tab, setTab] = useState("global");

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Global Settings</title>
      <meta name="description" content="Configure global settings, branding customisation, databases settings, and backups." />
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        subtitle="Global configuration and per-module settings"
      />

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-64 flex-shrink-0 space-y-4">
          {NAV.map((section) => (
            <div key={section.group}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1.5">
                {section.group}
              </p>
              <div className="space-y-0.5">
                {section.items.map((t) => {
                  const Icon   = t.icon;
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                        active
                          ? "border-primary/20 bg-primary/5 text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-[12.5px] font-semibold">{t.label}</span>
                      </div>
                      <p className="text-[10.5px] leading-snug pl-5.5" style={{ paddingLeft: "22px" }}>
                        {t.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {CONTENT_MAP[tab as keyof typeof CONTENT_MAP]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}