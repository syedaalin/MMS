import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, Loader2, ReceiptText } from "lucide-react";
import { PAYMENT_METHODS, Invoice, Payment } from "../../lib/financeData";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";
const fmt = (n: number) => `PKR ${Number(n).toLocaleString()}`;

interface PaymentFormProps {
  invoice: Invoice | null;
  onClose: () => void;
  onSave: (payment: Payment) => void;
}

/**
 * PaymentForm Component
 * 
 * A form modal for recording a payment against a specific invoice.
 * 
 * @param {PaymentFormProps} props - The component props.
 * @returns {React.ReactElement}
 */
export default function PaymentForm({ invoice, onClose, onSave }: PaymentFormProps) {
  const balance = invoice ? invoice.finalAmt - (invoice.paidAmt || 0) : 0;
  const [data, setData] = useState<Partial<Payment>>({
    amount: balance,
    method: "Cash",
    date: new Date().toISOString().split("T")[0],
    receivedBy: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const upd = (f: keyof Payment, v: Payment[keyof Payment]) => setData((d) => ({ ...d, [f]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    onSave({
      ...data,
      amount: Number(data.amount),
      invoiceId: invoice.id,
      studentName: invoice.studentName,
      id: `pay${Date.now()}`,
    } as Payment);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="payment-form-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.form
        onSubmit={handleSave}
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm flex flex-col z-10"
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-primary" aria-hidden="true" />
            <h3 id="payment-form-title" className="text-sm font-bold text-foreground m-0">Record Payment</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" aria-hidden="true" /></button>
        </header>

        {invoice && (
          <article className="mx-5 mt-4 px-4 py-3 rounded-xl bg-muted/40 border border-border">
            <p className="text-[12px] font-bold text-foreground m-0">{invoice.studentName}</p>
            <p className="text-[11px] text-muted-foreground m-0">{invoice.id} · {invoice.class}</p>
            <p className="text-[12px] font-semibold text-primary mt-1 m-0">Balance due: {fmt(balance)}</p>
          </article>
        )}

        <fieldset className="px-5 py-4 space-y-4 border-none m-0">
          <div>
            <label className={LABEL} htmlFor="payment-amount">Amount (PKR) *</label>
            <input
              id="payment-amount"
              type="number"
              className={INPUT}
              value={data.amount || ""}
              onChange={(e) => upd("amount", e.target.value)}
              max={balance}
              min={1}
              required
            />
            {Number(data.amount) < balance && Number(data.amount) > 0 && (
              <p className="text-[10px] text-amber-600 mt-1 m-0">Partial payment — balance remaining: {fmt(balance - Number(data.amount))}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} htmlFor="payment-method">Method</label>
              <select id="payment-method" className={INPUT + " cursor-pointer"} value={data.method || "Cash"} onChange={(e) => upd("method", e.target.value)}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="payment-date">Date</label>
              <input id="payment-date" type="date" className={INPUT} value={data.date || ""} onChange={(e) => upd("date", e.target.value)} required />
            </div>
          </div>
          <div>
            <label className={LABEL} htmlFor="payment-receivedBy">Received By</label>
            <input id="payment-receivedBy" className={INPUT} value={data.receivedBy || ""} onChange={(e) => upd("receivedBy", e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className={LABEL} htmlFor="payment-note">Note</label>
            <input id="payment-note" className={INPUT} value={data.note || ""} onChange={(e) => upd("note", e.target.value)} placeholder="e.g. Cash received, receipt #123" />
          </div>
        </fieldset>

        <footer className="px-5 py-4 border-t border-border flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
          <button
            type="submit"
            disabled={saving || !data.amount || Number(data.amount) <= 0}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
            {saving ? "Saving…" : "Record Payment"}
          </button>
        </footer>
      </motion.form>
    </div>
  );
}
