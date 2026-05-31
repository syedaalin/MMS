import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, List, BookMarked, Scale, BarChart2,
  BookOpen, Settings, LayoutDashboard,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import ChartOfAccounts from "../components/accounting/ChartOfAccounts";
import JournalEntries from "../components/accounting/JournalEntries";
import GeneralLedger from "../components/accounting/GeneralLedger";
import TrialBalance from "../components/accounting/TrialBalance";
import FinancialReports from "../components/accounting/FinancialReports";
import AccountingSettings from "../components/accounting/AccountingSettings";
import AccountingDashboard from "../components/accounting/AccountingDashboard";
import ModuleReports from "../components/reports/ModuleReports";
import KPISummary from "../components/reports/KPISummary";
import {
  CHART_OF_ACCOUNTS, JOURNAL_ENTRIES,
  DEFAULT_SETTINGS, DEFAULT_FISCAL_YEARS, CURRENCIES,
} from "../lib/accountingData";
import { getCollection, saveCollection, getObject, saveObject } from "../lib/db";

const PAGE_TABS = [
  { id: "operations",    label: "Operations",    icon: LayoutDashboard },
  { id: "analytics",     label: "Analytics",     icon: BarChart2 },
  { id: "configuration", label: "Configuration", icon: Settings },
];

const SUB_TABS = [
  { id: "overview",  label: "Overview",          icon: LayoutDashboard },
  { id: "journal",   label: "Journal Entries",   icon: List },
  { id: "ledger",    label: "General Ledger",    icon: BookMarked },
  { id: "trial",     label: "Trial Balance",     icon: Scale },
  { id: "coa",       label: "Chart of Accounts", icon: BookOpen },
];

/**
 * Accounting and bookkeeping page component.
 * Allows managing accounts, journal entries, ledgers, and fiscal years.
 * 
 * @returns {React.ReactElement} The Accounting page component.
 */
export default function Accounting() {
  const [activeTab, setActiveTab]     = useState("operations");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [accounts,   setAccounts]    = useState(() => getCollection("accounting_accounts", CHART_OF_ACCOUNTS));
  const [entries,    setEntries]     = useState(() => getCollection("accounting_entries", JOURNAL_ENTRIES));
  const [settings,   setSettings]    = useState(() => getObject("accounting_settings", DEFAULT_SETTINGS));
  const [fiscalYears, setFiscalYears] = useState(() => getCollection("accounting_fiscal_years", DEFAULT_FISCAL_YEARS));

  useEffect(() => {
    saveCollection("accounting_accounts", accounts);
  }, [accounts]);

  useEffect(() => {
    saveCollection("accounting_entries", entries);
  }, [entries]);

  useEffect(() => {
    saveObject("accounting_settings", settings);
  }, [settings]);

  useEffect(() => {
    saveCollection("accounting_fiscal_years", fiscalYears);
  }, [fiscalYears]);

  const activeFY = fiscalYears.find((f) => f.status === "active");
  const cur = CURRENCIES.find((c) => c.code === settings.currency) || CURRENCIES[0];
  const fmt = (n: number) => `${cur.symbol} ${n.toLocaleString(undefined, { minimumFractionDigits: settings.decimalPlaces })}`;

  const posted = entries.filter((e) => e.status === "posted").length;
  const drafts = entries.filter((e) => e.status === "draft").length;
  const totalPostedDebit = entries
    .filter((e) => e.status === "posted")
    .flatMap((e) => e.lines)
    .reduce((s, l) => s + l.debit, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Accounting Ledgers</title>
      <meta name="description" content="View double-entry bookkeeping journals, manage fiscal years, and generate accounting balance reports." />
      <PageHeader
        icon={TrendingUp}
        title="Accounting"
        subtitle={`Double-entry bookkeeping${activeFY ? ` · ${activeFY.label}` : ""} · ${cur.code}`}
        actions={
          activeFY && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              {activeFY.label} — Active
            </span>
          )
        }
      />

      <div className="space-y-4">
        <KPISummary category="accounting" />
      </div>

      {/* Primary Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {PAGE_TABS.map((t) => {
          const Icon   = t.icon;
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tabs for Operations */}
      {activeTab === "operations" && (
        <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl w-fit border border-border/30 overflow-x-auto max-w-full">
          {SUB_TABS.map((t) => {
            const active = activeSubTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveSubTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                {t.label}
                {t.id === "journal" && drafts > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">{drafts}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab + "-" + activeSubTab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          className="space-y-4">

          {activeTab === "analytics" && <ModuleReports category="financial" />}
          
          {activeTab === "operations" && activeSubTab === "overview" && (
            <AccountingDashboard accounts={accounts} entries={entries} settings={settings} fiscalYears={fiscalYears} fmt={fmt} />
          )}

          {activeTab === "operations" && activeSubTab === "journal" && (
            <JournalEntries entries={entries} accounts={accounts} settings={settings} fiscalYears={fiscalYears} onChange={setEntries} fmt={fmt} />
          )}
          {activeTab === "operations" && activeSubTab === "ledger" && (
            <GeneralLedger accounts={accounts} entries={entries} fmt={fmt} />
          )}
          {activeTab === "operations" && activeSubTab === "trial" && (
            <TrialBalance accounts={accounts} entries={entries} fiscalYears={fiscalYears} fmt={fmt} />
          )}
          {activeTab === "operations" && activeSubTab === "coa" && (
            <ChartOfAccounts accounts={accounts} onChange={setAccounts} />
          )}
          {activeTab === "configuration" && (
            <AccountingSettings
              accounts={accounts}
              settings={settings}
              onSaveSettings={setSettings}
              fiscalYears={fiscalYears}
              onSaveFiscalYears={setFiscalYears}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}