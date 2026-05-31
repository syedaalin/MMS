import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, GitMerge, Check } from "lucide-react";

const FIELDS = ["name", "phone", "email", "gender", "dob"] as const;

import {
  Contact,
  PhoneNumber as ContactPhone,
  EmailAddress as ContactEmail,
  Address as ContactAddress,
  SocialLink as ContactSocial,
  EmergencyContact
} from "../../lib/contactFields";


interface DuplicatePair {
  id: string;
  confidence: number;
  reason: string;
  contacts: [Contact, Contact];
}

// ── Normalization Helpers ───────────────────────────────────────────────────

const normalizeEmail = (email: unknown): string => {
  if (!email) return "";
  return String(email).trim().toLowerCase();
};

const normalizePhoneForComparison = (num: unknown): string => {
  if (!num) return "";
  const digits = String(num).replace(/[^\d]/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

const getPhoneNumbers = (c: Contact): string[] => {
  const nums: string[] = [];
  if (c.phone) {
    nums.push(normalizePhoneForComparison(c.phone));
  }
  if (c.phones) {
    c.phones.forEach((p) => {
      if (p.number) {
        nums.push(normalizePhoneForComparison(p.number));
      }
    });
  }
  return Array.from(new Set(nums.filter(Boolean)));
};

const getEmails = (c: Contact): string[] => {
  const emails: string[] = [];
  if (c.email) {
    emails.push(normalizeEmail(c.email));
  }
  if (c.emails) {
    c.emails.forEach((e) => {
      if (e.address) {
        emails.push(normalizeEmail(e.address));
      }
    });
  }
  return Array.from(new Set(emails.filter(Boolean)));
};

const cleanName = (name: unknown): string => {
  if (!name) return "";
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/^(syed|syeda)\s+/i, "")
    .replace(/\s+/g, "");
};

// ── Merging Logic ──────────────────────────────────────────────────────────

const mergeContacts = (keep: Contact, other: Contact): Contact => {
  const merged: Contact = { ...keep };

  // Merge all basic properties dynamically
  Object.keys(other).forEach((key) => {
    if (
      key === "id" ||
      key === "name" ||
      key === "phones" ||
      key === "emails" ||
      key === "addresses" ||
      key === "socials" ||
      key === "emergencyContacts" ||
      key === "notes" ||
      key === "createdAt" ||
      key === "updatedAt"
    ) {
      return;
    }
    if (merged[key] === undefined || merged[key] === null || merged[key] === "") {
      merged[key] = other[key];
    }
  });

  // Recalculate full name if firstName or lastName was merged/changed
  const first = (merged.firstName as string | undefined) || "";
  const last = (merged.lastName as string | undefined) || "";
  merged.name = [first, last].filter(Boolean).join(" ") || merged.name;

  // Concatenate notes
  if (keep.notes && other.notes && keep.notes !== other.notes) {
    merged.notes = `${keep.notes}\nMerged note:\n${other.notes}`;
  } else if (other.notes) {
    merged.notes = other.notes;
  }

  // Merge phones list: match by normalized number
  const seenNumbers = new Set<string>();
  const mergedPhones: ContactPhone[] = [];

  const addPhone = (p: ContactPhone | undefined): void => {
    if (!p || !p.number) return;
    const norm = p.number.replace(/[^\d]/g, "");
    if (!seenNumbers.has(norm)) {
      seenNumbers.add(norm);
      mergedPhones.push({ ...p });
    } else {
      const existing = mergedPhones.find((x) => x.number.replace(/[^\d]/g, "") === norm);
      if (existing && p.whatsapp) {
        existing.whatsapp = true;
      }
    }
  };

  (keep.phones || []).forEach(addPhone);
  (other.phones || []).forEach(addPhone);
  merged.phones = mergedPhones;

  // Merge emails list: match by normalized address
  const seenEmails = new Set<string>();
  const mergedEmails: ContactEmail[] = [];

  const addEmail = (e: ContactEmail | undefined): void => {
    if (!e || !e.address) return;
    const norm = e.address.trim().toLowerCase();
    if (!seenEmails.has(norm)) {
      seenEmails.add(norm);
      mergedEmails.push({ ...e });
    }
  };

  (keep.emails || []).forEach(addEmail);
  (other.emails || []).forEach(addEmail);
  merged.emails = mergedEmails;

  // Merge addresses list: match by simple content key
  const seenAddresses = new Set<string>();
  const mergedAddresses: ContactAddress[] = [];

  const addAddress = (a: ContactAddress | undefined): void => {
    if (!a) return;
    const key = [a.line1, a.city, a.state, a.country]
      .filter(Boolean)
      .map((s) => s!.trim().toLowerCase())
      .join("|");
    if (!seenAddresses.has(key)) {
      seenAddresses.add(key);
      mergedAddresses.push({ ...a });
    }
  };

  (keep.addresses || []).forEach(addAddress);
  (other.addresses || []).forEach(addAddress);
  merged.addresses = mergedAddresses;

  // Merge socials list: match by normalized URL
  const seenSocials = new Set<string>();
  const mergedSocials: ContactSocial[] = [];

  const addSocial = (s: ContactSocial | undefined): void => {
    if (!s || !s.url) return;
    const norm = s.url.trim().toLowerCase();
    if (!seenSocials.has(norm)) {
      seenSocials.add(norm);
      mergedSocials.push({ ...s });
    }
  };

  (keep.socials || []).forEach(addSocial);
  (other.socials || []).forEach(addSocial);
  merged.socials = mergedSocials;

  // Merge emergency contacts: match by contact ID & relationship
  const seenEmergency = new Set<string>();
  const mergedEmergency: EmergencyContact[] = [];

  const addEmergency = (ec: EmergencyContact | undefined): void => {
    if (!ec || !ec.contactId) return;
    const key = `${ec.contactId}-${ec.relationship}`;
    if (!seenEmergency.has(key)) {
      seenEmergency.add(key);
      mergedEmergency.push({ ...ec });
    }
  };

  (keep.emergencyContacts || []).forEach(addEmergency);
  (other.emergencyContacts || []).forEach(addEmergency);
  merged.emergencyContacts = mergedEmergency;

  return merged;
};

// ── Components ─────────────────────────────────────────────────────────────

interface ConfidenceBadgeProps {
  score: number;
}

function ConfidenceBadge({ score }: ConfidenceBadgeProps): React.JSX.Element {
  const color = score >= 90 ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50" : score >= 75 ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50" : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {score}% match
    </span>
  );
}

interface ContactCardProps {
  contact: Contact;
  selected: boolean;
  onSelect: () => void;
  label: string;
}

function ContactCard({ contact, selected, onSelect, label }: ContactCardProps): React.JSX.Element {
  return (
    <div
      onClick={onSelect}
      className={`flex-1 rounded-xl border-2 p-4 cursor-pointer transition-all text-left ${
        selected ? "border-primary bg-primary/[0.03]" : "border-border hover:border-primary/30"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        {selected && <Check className="w-4 h-4 text-primary" />}
      </div>
      <div className="space-y-1.5">
        {FIELDS.map((f) => {
          let val = contact[f] as string | undefined;
          if (f === "phone") {
            const ph = (contact.phones || [])[0] || (contact.phone ? { number: contact.phone } : null);
            val = ph ? (ph.countryCode ? `${ph.countryCode} ${ph.number}` : ph.number) : "—";
          } else if (f === "email") {
            val = (contact.emails || [])[0]?.address || contact.email || "—";
          }
          return (
            <div key={f} className="flex items-start gap-2">
              <span className="text-[11px] text-muted-foreground w-14 flex-shrink-0 capitalize">{f}:</span>
              <span className="text-[12px] font-medium text-foreground truncate">{val || "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MergePreviewProps {
  pair: DuplicatePair;
  keepIndex: number;
  onClose: () => void;
  onConfirm: () => void;
}

function MergePreview({ pair, keepIndex, onClose, onConfirm }: MergePreviewProps): React.JSX.Element {
  const keep = pair.contacts[keepIndex];
  const other = pair.contacts[1 - keepIndex];
  const mergedResult = mergeContacts(keep, other);

  const displayFields = [
    { key: "name", label: "Name" },
    { key: "gender", label: "Gender" },
    { key: "dob", label: "Date of Birth" },
    {
      key: "phone",
      label: "Primary Phone",
      getValue: (c: Contact) => {
        const ph = (c.phones || [])[0] || (c.phone ? { number: c.phone } : null);
        return ph ? (ph.countryCode ? `${ph.countryCode} ${ph.number}` : ph.number) : "—";
      }
    },
    {
      key: "email",
      label: "Primary Email",
      getValue: (c: Contact) => (c.emails || [])[0]?.address || c.email || "—"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg z-10 text-left"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GitMerge className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Merge Preview</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close merge preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5 dark:bg-amber-950/20 dark:border-amber-900/50">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-850 dark:text-amber-300">
              <strong>{other.name || other.firstName}</strong> will be deleted and all their data will be merged into <strong>{keep.name || keep.firstName}</strong>.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Merged result</p>
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-foreground">
              {displayFields.map((df) => {
                const valKeep = df.getValue ? df.getValue(keep) : (keep[df.key] as string | undefined);
                const valOther = df.getValue ? df.getValue(other) : (other[df.key] as string | undefined);
                const valMerged = df.getValue ? df.getValue(mergedResult) : (mergedResult[df.key] as string | undefined);

                const fromOther = (!valKeep || valKeep === "—" || valKeep === "") && (valOther && valOther !== "—" && valOther !== "");

                return (
                  <div key={df.key} className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground w-24 capitalize flex-shrink-0">{df.label}:</span>
                    <span className="text-[13px] font-medium text-foreground flex-1 truncate">{valMerged || "—"}</span>
                    {fromOther && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50">
                        from duplicate
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors text-foreground bg-card"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            <GitMerge className="w-4 h-4" />
            <span>Confirm Merge</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface DuplicateDetectionProps {
  contacts?: Contact[];
  onClose: () => void;
  onMerge: (keepId: string | number, deleteId: string | number, mergedData: Contact) => void;
}

/**
 * DuplicateDetection component that finds duplicate contacts dynamically
 * and allows the user to merge them.
 * @param props Component properties.
 * @returns React element.
 */
export default function DuplicateDetection({
  contacts = [],
  onClose,
  onMerge
}: DuplicateDetectionProps): React.JSX.Element {
  const [dismissedPairIds, setDismissedPairIds] = useState<Set<string>>(new Set());
  const [mergedPairIds, setMergedPairIds] = useState<Set<string>>(new Set());
  const [keepIndex, setKeepIndex] = useState<Record<string, number>>({});
  const [merging, setMerging] = useState<DuplicatePair | null>(null);

  // ── Dynamic scan for duplicates ──────────────────────────────────────────
  const detectedPairs = useMemo<DuplicatePair[]>(() => {
    const list: DuplicatePair[] = [];
    const n = contacts.length;
    const matchedPairs = new Set<string>();

    for (let i = 0; i < n; i++) {
      const c1 = contacts[i];
      const name1 = cleanName(c1.name || c1.firstName);
      const phones1 = getPhoneNumbers(c1);
      const emails1 = getEmails(c1);

      for (let j = i + 1; j < n; j++) {
        const c2 = contacts[j];
        const name2 = cleanName(c2.name || c2.firstName);
        const phones2 = getPhoneNumbers(c2);
        const emails2 = getEmails(c2);

        const phoneMatch = phones1.length > 0 && phones2.length > 0 && phones1.some((val) => phones2.includes(val));
        const emailMatch = emails1.length > 0 && emails2.length > 0 && emails1.some((val) => emails2.includes(val));
        const nameMatch = name1 && name2 && name1 === name2;

        if (phoneMatch || emailMatch || nameMatch) {
          const pairKey = [c1.id, c2.id].sort().join("-");
          if (matchedPairs.has(pairKey)) continue;
          matchedPairs.add(pairKey);

          let confidence = 70;
          let reason = "";

          if (phoneMatch && emailMatch) {
            confidence = 99;
            reason = "Matching Phone & Email";
          } else if (phoneMatch) {
            confidence = nameMatch ? 95 : 80;
            reason = nameMatch ? "Matching Name & Phone" : "Matching Phone";
          } else if (emailMatch) {
            confidence = nameMatch ? 95 : 80;
            reason = nameMatch ? "Matching Name & Email" : "Matching Email";
          } else if (nameMatch) {
            confidence = 75;
            reason = "Matching Name Only";
          }

          list.push({
            id: pairKey,
            confidence,
            reason,
            contacts: [c1, c2]
          });
        }
      }
    }
    return list;
  }, [contacts]);

  const activePairs = useMemo<DuplicatePair[]>(() => {
    return detectedPairs.filter((pair) => !dismissedPairIds.has(pair.id) && !mergedPairIds.has(pair.id));
  }, [detectedPairs, dismissedPairIds, mergedPairIds]);

  const handleMergeConfirm = (): void => {
    if (!merging) return;
    const pair = merging;
    const ki = keepIndex[pair.id] ?? 0;
    const keep = pair.contacts[ki];
    const other = pair.contacts[1 - ki];

    const mergedResult = mergeContacts(keep, other);

    // Trigger parent state update
    onMerge(keep.id, other.id, mergedResult);

    // Track merged pair locally to update view
    setMergedPairIds((prev) => {
      const next = new Set(prev);
      next.add(pair.id);
      return next;
    });
    setMerging(null);
  };

  const handleDismiss = (pairId: string): void => {
    setDismissedPairIds((prev) => {
      const next = new Set(prev);
      next.add(pairId);
      return next;
    });
  };

  const totalMerged = mergedPairIds.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10 text-left"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Duplicate Detection</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {activePairs.length} potential duplicate{activePairs.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            aria-label="Close duplicates dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Merged badge */}
        {totalMerged > 0 && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400">
            <Check className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
              {totalMerged} duplicate{totalMerged > 1 ? "s" : ""} merged successfully
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {activePairs.length === 0 ? (
            <div className="py-12 text-center">
              <Check className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">All duplicates resolved</p>
              <p className="text-xs text-muted-foreground mt-1">Your contact list is clean</p>
            </div>
          ) : (
            activePairs.map((pair) => {
              const ki = keepIndex[pair.id] ?? 0;
              return (
                <div key={pair.id} className="rounded-xl border border-border bg-muted/10 overflow-hidden">
                  {/* Pair header */}
                  <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ConfidenceBadge score={pair.confidence} />
                      <span className="text-[12px] text-muted-foreground">{pair.reason}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMerging(pair)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-all"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>Merge</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismiss(pair.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border"
                        title="Dismiss pair alert"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="p-4">
                    <p className="text-[11px] text-muted-foreground mb-3 font-medium">Select the record to keep:</p>
                    <div className="flex gap-3">
                      {pair.contacts.map((c, idx) => (
                        <ContactCard
                          key={c.id}
                          contact={c}
                          label={idx === 0 ? "Contact A" : "Contact B"}
                          selected={ki === idx}
                          onSelect={() => setKeepIndex((k) => ({ ...k, [pair.id]: idx }))}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-card border border-transparent"
          >
            Close
          </button>
        </div>
      </motion.div>

      {/* Merge preview modal */}
      <AnimatePresence>
        {merging && (
          <MergePreview
            pair={merging}
            keepIndex={keepIndex[merging.id] ?? 0}
            onClose={() => setMerging(null)}
            onConfirm={handleMergeConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
