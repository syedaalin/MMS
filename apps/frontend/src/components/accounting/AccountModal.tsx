import React, { useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { ACCOUNT_TYPES, ACCOUNT_SUBTYPES, ACCOUNT_TYPE_META, Account, AccountType } from "../../lib/accountingData";

interface AccountModalProps {
  initial: Account | null;
  onSave: (account: Account) => void;
  onClose: () => void;
  existingCodes: string[];
}

/**
 * AccountModal component.
 * 
 * A modal for creating or editing a Chart of Accounts entry.
 * 
 * @param {AccountModalProps} props - The component props.
 * @returns {React.ReactElement}
 */
export default function AccountModal({ initial, onSave, onClose, existingCodes }: AccountModalProps) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<Partial<Account>>(initial || { code: "", name: "", type: "Asset", subtype: "", description: "", isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const type = form.type as AccountType;
  const subtypes = type ? (ACCOUNT_SUBTYPES[type] || []) : [];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.code?.trim()) e.code = "Code is required";
    else if (!isEdit && existingCodes.includes(form.code.trim())) e.code = "Code already exists";
    if (!form.name?.trim()) e.name = "Name is required";
    if (!form.type) e.type = "Type is required";
    return e;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate(); 
    if (Object.keys(e).length) { 
      setErrors(e); 
      return; 
    }
    onSave({ 
      ...form, 
      code: form.code!.trim(), 
      name: form.name!.trim(), 
      id: isEdit ? form.id : `a${Date.now()}` 
    } as Account);
  };

  const inp = "mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.section 
        initial={{ opacity: 0, scale: 0.96 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 id="account-modal-title" className="text-base font-bold text-foreground m-0">{isEdit ? "Edit Account" : "Add Account"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><X className="w-4 h-4" aria-hidden="true" /></button>
        </header>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 m-0">
          <fieldset className="grid grid-cols-2 gap-4 border-none m-0 p-0">
            <div>
              <label htmlFor="account-code" className="text-xs font-semibold text-muted-foreground uppercase">Account Code *</label>
              <input id="account-code" value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. 1000" className={inp} required />
              {errors.code && <p className="text-xs text-red-500 mt-1 m-0" role="alert">{errors.code}</p>}
            </div>
            <div>
              <label htmlFor="account-type" className="text-xs font-semibold text-muted-foreground uppercase">Type *</label>
              <select id="account-type" value={form.type || "Asset"} onChange={(e) => setForm({ ...form, type: e.target.value as AccountType, subtype: "" })} className={inp} required>
                {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </fieldset>

          {/* Type info hint */}
          {type && ACCOUNT_TYPE_META[type] && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border ${ACCOUNT_TYPE_META[type].color}`} aria-live="polite">
              <span aria-hidden="true">{ACCOUNT_TYPE_META[type].icon}</span>
              <span>{type} · Normal Balance: <strong>{ACCOUNT_TYPE_META[type].normalBalance.toUpperCase()}</strong> · {ACCOUNT_TYPE_META[type].group}</span>
            </div>
          )}

          <fieldset className="border-none m-0 p-0 space-y-4">
            <div>
              <label htmlFor="account-name" className="text-xs font-semibold text-muted-foreground uppercase">Account Name *</label>
              <input id="account-name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cash in Hand" className={inp} required />
              {errors.name && <p className="text-xs text-red-500 mt-1 m-0" role="alert">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="account-subtype" className="text-xs font-semibold text-muted-foreground uppercase">Sub-type</label>
              <select id="account-subtype" value={form.subtype || ""} onChange={(e) => setForm({ ...form, subtype: e.target.value })} className={inp}>
                <option value="">— None —</option>
                {subtypes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="account-description" className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
              <input id="account-description" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description…" className={inp} />
            </div>
          </fieldset>

          <footer className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Save Account</button>
          </footer>
        </form>
      </motion.section>
    </div>
  );
}
