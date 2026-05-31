import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReceiptText, CreditCard, BarChart2, Star, Plus, DollarSign, Settings, LayoutDashboard } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import ActionButton from "../components/ui/ActionButton";
import InvoiceList from "../components/finance/InvoiceList";
import InvoiceDetail from "../components/finance/InvoiceDetail";
import PaymentForm from "../components/finance/PaymentForm";
import PaymentTracker from "../components/finance/PaymentTracker";
import ReportsPanel from "../components/finance/ReportsPanel";
import HasanatPayouts from "../components/finance/HasanatPayouts";
import FinanceSettings from "../components/finance/FinanceSettings";
import ModuleReports from "../components/reports/ModuleReports";
import KPISummary from "../components/reports/KPISummary";
import { INVOICES, PAYMENTS, Invoice, Payment } from "../lib/financeData";
import { getCollection, saveCollection } from "../lib/db";

const PAGE_TABS = [
  { id: "operations",    label: "Operations",    icon: LayoutDashboard },
  { id: "analytics",     label: "Analytics",     icon: BarChart2 },
  { id: "configuration", label: "Configuration", icon: Settings },
];
const FINANCE_SETTINGS_SUB_TABS = [
  { id: "fields", label: "Fields & Preferences" },
];
const SUB_TABS = [
  { id: "invoices", label: "Invoices",  icon: ReceiptText },
  { id: "payments", label: "Payments",  icon: CreditCard },
  { id: "hasanat",  label: "Hasanat",   icon: Star },
];

/**
 * Finance page component for tracking and managing invoices and payments.
 * 
 * @returns {React.ReactElement} The Finance page component.
 */
export default function Finance() {
  const [activeTab, setActiveTab] = useState("operations");
  const [activeSubTab, setActiveSubTab] = useState("invoices");
  const [subTab, setSubTab] = useState("fields");
  const [invoices, setInvoices] = useState(() => getCollection("finance_invoices", INVOICES));
  const [payments, setPayments] = useState(() => getCollection("finance_payments", PAYMENTS));

  useEffect(() => {
    saveCollection("finance_invoices", invoices);
  }, [invoices]);

  useEffect(() => {
    saveCollection("finance_payments", payments);
  }, [payments]);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [recordInvoice, setRecordInvoice] = useState<Invoice | null>(null);

  const handleRecordPayment = (paymentData: Payment) => {
    setPayments((p) => [...p, paymentData]);
    setInvoices((invs) => invs.map((inv) => {
      if (inv.id !== paymentData.invoiceId) return inv;
      const newPaid = (inv.paidAmt || 0) + paymentData.amount;
      return { ...inv, status: newPaid >= inv.finalAmt ? "paid" : "partial", paidAmt: newPaid, paidDate: paymentData.date, method: paymentData.method };
    }));
    setRecordInvoice(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Finance Portal</title>
      <meta name="description" content="Manage student invoices, track payments, and review financial collections and reports." />
      <PageHeader
        icon={DollarSign}
        title="Finance"
        subtitle="Invoices, payments, reports and hasanat payouts"
        actions={activeTab === "operations" && activeSubTab === "invoices" && (
          <ActionButton variant="primary" icon={Plus}>New Invoice</ActionButton>
        )}
      />

      <div className="space-y-4">
        <KPISummary category="financial" />
      </div>

      {/* Primary Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {PAGE_TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />{t.label}
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
              <button
                key={t.id}
                onClick={() => setActiveSubTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab + "-" + activeSubTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
          {activeTab === "analytics" && <ModuleReports category="financial" />}
          {activeTab === "configuration" && (
            <div className="space-y-4">
              <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
                {FINANCE_SETTINGS_SUB_TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSubTab(t.id)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      subTab === t.id
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {subTab === "fields" && <FinanceSettings />}
            </div>
          )}
          
          {activeTab === "operations" && activeSubTab === "invoices" && <InvoiceList invoices={invoices} onView={setViewInvoice} onRecord={setRecordInvoice} />}
          {activeTab === "operations" && activeSubTab === "payments" && <PaymentTracker payments={payments} />}
          {activeTab === "operations" && activeSubTab === "hasanat"  && <HasanatPayouts />}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {viewInvoice && (
          <InvoiceDetail invoice={viewInvoice} onClose={() => setViewInvoice(null)} onRecord={(inv: Invoice) => { setViewInvoice(null); setRecordInvoice(inv); }} />
        )}
        {recordInvoice && (
          <PaymentForm invoice={recordInvoice} onClose={() => setRecordInvoice(null)} onSave={handleRecordPayment} />
        )}
      </AnimatePresence>
    </div>
  );
}