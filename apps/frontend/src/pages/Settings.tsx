import React, { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon, Globe, Palette, Database,
  Users, GraduationCap, ClipboardList, Calendar, UserCheck,
  DollarSign, FileText, Shield, Star,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";

// System settings panels
const GlobalSettings = lazy(() => import("../components/settings/GlobalSettings"));
const BrandingSettings = lazy(() => import("../components/settings/BrandingSettings"));
const BackupRestore = lazy(() => import("../components/settings/BackupRestore"));

// Module settings panels
import { ContactConfigProvider, useContactConfig } from "../lib/ContactConfigContext";
const ContactsSettingsPanel = lazy(() => import("../components/contacts/ContactsSettingsPanel"));
const StudentsSettings = lazy(() => import("../components/students/StudentsSettings"));
const EnrollmentsSettings = lazy(() => import("../components/enrollment/EnrollmentsSettings"));
const SessionsSettings = lazy(() => import("../components/sessions/SessionsSettings"));
const AttendanceSettings = lazy(() => import("../components/attendance/AttendanceSettings"));
const FinanceSettings = lazy(() => import("../components/finance/FinanceSettings"));
const ExaminationsSettings = lazy(() => import("../components/examination/ExaminationsSettings"));
const AccountingSettings = lazy(() => import("../components/accounting/AccountingSettings"));
const HasanatSettings = lazy(() => import("../components/hasanat/HasanatSettings"));
const UsersSettingsPanel = lazy(() => import("../components/users/UsersSettingsPanel"));

// Attendance helper
import { DEFAULT_ATT_SETTINGS } from "../lib/attendanceData";
import { CHART_OF_ACCOUNTS, DEFAULT_SETTINGS, DEFAULT_FISCAL_YEARS } from "../lib/accountingData";
import { getObject, saveObject, getCollection, saveCollection } from "../lib/db";

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
  const [subTab, setSubTab] = useState<"fields" | "preferences">("fields");
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSubTab("fields")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "fields" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Fields
        </button>
        <button
          type="button"
          onClick={() => setSubTab("preferences")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "preferences" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Preferences
        </button>
      </div>
      <ContactsSettingsPanel config={fieldConfig} onConfigChange={updateConfig} mode={subTab} />
    </div>
  );
}

function StudentsSettingsWrapper(): React.JSX.Element {
  const [subTab, setSubTab] = useState<"fields" | "preferences">("fields");
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSubTab("fields")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "fields" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Fields
        </button>
        <button
          type="button"
          onClick={() => setSubTab("preferences")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "preferences" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Preferences
        </button>
      </div>
      <StudentsSettings mode={subTab} />
    </div>
  );
}

/**
 * State wrapper for AttendanceSettings.
 */
function AttendanceSettingsWrapper(): React.JSX.Element {
  const [settings, setSettings] = useState(() => getObject("attendance_settings", DEFAULT_ATT_SETTINGS));
  useEffect(() => {
    saveObject("attendance_settings", settings);
  }, [settings]);
  const [subTab, setSubTab] = useState<"fields" | "preferences">("fields");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSubTab("fields")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "fields" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Fields
        </button>
        <button
          type="button"
          onClick={() => setSubTab("preferences")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "preferences" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Preferences
        </button>
      </div>
      <AttendanceSettings role="admin" settings={settings} setSettings={setSettings} mode={subTab} />
    </div>
  );
}

function EnrollmentsSettingsWrapper(): React.JSX.Element {
  const [subTab, setSubTab] = useState<"fields" | "preferences">("fields");
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSubTab("fields")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "fields" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Fields
        </button>
        <button
          type="button"
          onClick={() => setSubTab("preferences")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "preferences" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Preferences
        </button>
      </div>
      <EnrollmentsSettings mode={subTab} />
    </div>
  );
}

function SessionsSettingsWrapper(): React.JSX.Element {
  const [subTab, setSubTab] = useState<"fields" | "preferences">("fields");
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSubTab("fields")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "fields" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Fields
        </button>
        <button
          type="button"
          onClick={() => setSubTab("preferences")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "preferences" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Preferences
        </button>
      </div>
      <SessionsSettings mode={subTab} />
    </div>
  );
}

function FinanceSettingsWrapper(): React.JSX.Element {
  const [subTab, setSubTab] = useState<"fields" | "preferences">("fields");
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSubTab("fields")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "fields" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Fields
        </button>
        <button
          type="button"
          onClick={() => setSubTab("preferences")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "preferences" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Preferences
        </button>
      </div>
      <FinanceSettings mode={subTab} />
    </div>
  );
}

function ExaminationsSettingsWrapper(): React.JSX.Element {
  const [subTab, setSubTab] = useState<"fields" | "preferences">("fields");
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSubTab("fields")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "fields" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Fields
        </button>
        <button
          type="button"
          onClick={() => setSubTab("preferences")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "preferences" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Preferences
        </button>
      </div>
      <ExaminationsSettings mode={subTab} />
    </div>
  );
}

function AccountingSettingsWrapper(): React.JSX.Element {
  const [accounts, setAccounts] = useState(() => getCollection("accounting_accounts", CHART_OF_ACCOUNTS));
  const [settings, setSettings] = useState(() => getObject("accounting_settings", DEFAULT_SETTINGS));
  const [fiscalYears, setFiscalYears] = useState(() => getCollection("accounting_fiscal_years", DEFAULT_FISCAL_YEARS));
  const [subTab, setSubTab] = useState<"fields" | "preferences">("fields");

  useEffect(() => {
    saveObject("accounting_settings", settings);
  }, [settings]);

  useEffect(() => {
    saveCollection("accounting_fiscal_years", fiscalYears);
  }, [fiscalYears]);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSubTab("fields")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "fields" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Fields
        </button>
        <button
          type="button"
          onClick={() => setSubTab("preferences")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "preferences" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Preferences
        </button>
      </div>
      <AccountingSettings
        accounts={accounts}
        settings={settings}
        onSaveSettings={setSettings}
        fiscalYears={fiscalYears}
        onSaveFiscalYears={setFiscalYears}
        mode={subTab}
      />
    </div>
  );
}

function HasanatSettingsWrapper(): React.JSX.Element {
  const [subTab, setSubTab] = useState<"fields" | "preferences">("fields");
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSubTab("fields")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "fields" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Fields
        </button>
        <button
          type="button"
          onClick={() => setSubTab("preferences")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "preferences" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Preferences
        </button>
      </div>
      <HasanatSettings mode={subTab} />
    </div>
  );
}

function UsersSettingsWrapper(): React.JSX.Element {
  const [subTab, setSubTab] = useState<"fields" | "preferences">("fields");
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSubTab("fields")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "fields" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Fields
        </button>
        <button
          type="button"
          onClick={() => setSubTab("preferences")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            subTab === "preferences" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Preferences
        </button>
      </div>
      <UsersSettingsPanel mode={subTab} />
    </div>
  );
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
      { id: "accounting",   label: "Accounting Settings",   icon: SettingsIcon,   description: "Chart of Accounts, journal entry options" },
      { id: "hasanat",      label: "Hasanat Settings",      icon: Star,           description: "Points per card, distribution preferences" },
      { id: "users",        label: "Users Settings",        icon: Shield,         description: "Self-registration, verification, attributes" },
    ],
  },
];

const CONTENT_MAP = {
  global:       <GlobalSettings />,
  branding:     <BrandingSettings />,
  backup:       <BackupRestore />,
  contacts:     <ContactsSettingsWrapper />,
  students:     <StudentsSettingsWrapper />,
  enrollments:  <EnrollmentsSettingsWrapper />,
  sessions:     <SessionsSettingsWrapper />,
  attendance:   <AttendanceSettingsWrapper />,
  finance:      <FinanceSettingsWrapper />,
  examinations: <ExaminationsSettingsWrapper />,
  accounting:   <AccountingSettingsWrapper />,
  hasanat:      <HasanatSettingsWrapper />,
  users:        <UsersSettingsWrapper />,
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
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              }>
                {CONTENT_MAP[tab as keyof typeof CONTENT_MAP]}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}