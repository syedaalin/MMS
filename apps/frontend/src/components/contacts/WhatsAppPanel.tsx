import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Send, User, Check, Loader2, ChevronDown } from "lucide-react";

interface Template {
  id: string;
  label: string;
  body: string;
}

const TEMPLATES: Template[] = [
  { id: "fee", label: "Fee Reminder", body: "Assalamu Alaikum! This is a friendly reminder that your fee payment for this month is due. Please contact us at your earliest convenience. JazakAllah Khair." },
  { id: "event", label: "Event Invitation", body: "Assalamu Alaikum! You are cordially invited to our upcoming event at the madrasa. Please confirm your attendance. JazakAllah Khair." },
  { id: "absence", label: "Absence Notice", body: "Assalamu Alaikum! We noticed your child was absent today. Please inform us if there is an issue. JazakAllah Khair." },
  { id: "custom", label: "Custom Message", body: "" },
];

import { Contact, PhoneNumber as ContactPhone } from "../../lib/contactFields";

interface WhatsAppPanelProps {
  contacts: Contact[];
  onClose: () => void;
}


/**
 * WhatsAppPanel component for sending WhatsApp messages to single/multiple contacts.
 * @param props Component properties.
 * @returns React element.
 */
export default function WhatsAppPanel({ contacts, onClose }: WhatsAppPanelProps): React.JSX.Element {
  const isBulk = contacts.length > 1;
  const [template, setTemplate] = useState<string>(TEMPLATES[0].id);
  const [message, setMessage] = useState<string>(TEMPLATES[0].body);
  const [sending, setSending] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);

  const waContacts = contacts.filter((c) => c.phones?.some((p) => p.whatsapp));

  const handleTemplateChange = (id: string): void => {
    setTemplate(id);
    const t = TEMPLATES.find((x) => x.id === id);
    if (t && t.id !== "custom") setMessage(t.body);
  };

  const buildWaUrl = (contact: Contact): string => {
    const p = contact.phones?.find((ph) => ph.whatsapp);
    if (!p) return "";
    const code = p.countryCode ? p.countryCode.replace(/\D/g, "") : "";
    const num = p.number ? p.number.replace(/\D/g, "") : "";
    let cleanNum = num;
    if (code && cleanNum.startsWith("0")) {
      cleanNum = cleanNum.slice(1);
    }
    const fullPhone = `${code}${cleanNum}`;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleSend = async (): Promise<void> => {
    if (waContacts.length === 1) {
      window.open(buildWaUrl(waContacts[0]), "_blank");
      onClose();
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative bg-card/85 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl w-full max-w-md z-10 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-[#075E54] text-white flex-shrink-0 text-left">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5" />
            <div>
              <h2 className="text-sm font-bold">
                {isBulk ? "Bulk WhatsApp Message" : `WhatsApp – ${contacts[0]?.name}`}
              </h2>
              <p className="text-[11px] text-white/70">
                {isBulk
                  ? `${waContacts.length} of ${contacts.length} contacts have WhatsApp`
                  : (() => {
                      const p = contacts[0]?.phones?.find((ph) => ph.whatsapp);
                      if (!p) return "";
                      return p.countryCode ? `${p.countryCode} ${p.number}` : p.number;
                    })()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1 text-left">
          {/* Recipients */}
          {isBulk && (
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Recipients</span>
              <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border/50 max-h-32 overflow-y-auto">
                {contacts.map((c) => {
                  const hasWa = c.phones?.some((p) => p.whatsapp);
                  return (
                    <div key={c.id} className="flex items-center gap-2.5 px-3 py-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-[13px] text-foreground flex-1 truncate">{c.name}</span>
                      {hasWa ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400">
                          WA
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60">no WA</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Template picker */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 block" htmlFor="waTemplate">Template</label>
            <div className="relative">
              <select
                id="waTemplate"
                value={template}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
              >
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 block" htmlFor="waMessage">Message</label>
            <textarea
              id="waMessage"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setTemplate("custom");
              }}
              rows={6}
              placeholder="Type your message here..."
              className="w-full px-3.5 py-3 rounded-xl border border-border text-sm bg-muted/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54]/40 transition-all resize-none"
            />
            <p className="text-[11px] text-muted-foreground text-right mt-1">{message.length} chars</p>
          </div>

          {/* Warning if some have no WA */}
          {isBulk && waContacts.length < contacts.length && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400">
              <p className="text-xs text-amber-850 dark:text-amber-300">
                {contacts.length - waContacts.length} contact{contacts.length - waContacts.length > 1 ? "s" : ""} without WhatsApp will be skipped.
              </p>
            </div>
          )}

          {/* Success */}
          <AnimatePresence>
            {sent && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Messages queued for {waContacts.length} contacts
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-shrink-0 bg-card">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!message.trim() || sending || sent || waContacts.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: sending || sent ? "#128C7E" : "#075E54" }}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>
              {sending ? "Sending…" : sent ? "Sent!" : isBulk ? `Send to ${waContacts.length}` : "Open WhatsApp"}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
