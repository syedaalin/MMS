import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Heart, Plus, Trash2, Search, X } from "lucide-react";
import { DEFAULT_TAB_FIELD_CONFIG, CustomField } from "../../../lib/contactFields";
import { Field, INPUT, SELECT, FormEmptyState, RequiredBanner } from "./FormPrimitives";
import TabCustomFields from "./TabCustomFields";
import { useContactConfig } from "../../../lib/ContactConfigContext";

interface ContactPhone {
  label: string;
  number: string;
  countryCode?: string;
  whatsapp?: boolean;
}

interface ContactEmail {
  label: string;
  address: string;
}

interface Contact {
  id: string | number;
  name?: string;
  phones?: ContactPhone[];
  emails?: ContactEmail[];
  [key: string]: unknown;
}

interface EmergencyContact {
  contactId?: string | number;
  relationship?: string;
}

interface ContactFormData extends Omit<Contact, "id"> {
  id?: string | number;
  emergencyContacts?: EmergencyContact[];
}

interface ContactSearchPickerProps {
  available: Contact[];
  selectedId: string | number;
  onSelect: (id: string | number) => void;
}

/**
 * ContactSearchPicker component for searching and picking an existing contact.
 * @param props Component properties.
 * @returns React element.
 */
function ContactSearchPicker({ available, selectedId, onSelect }: ContactSearchPickerProps): React.JSX.Element {
  const [query, setQuery] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);

  const selected = available.find((c) => String(c.id) === String(selectedId));

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = q
      ? available.filter(
          (c) =>
            c.name?.toLowerCase().includes(q) ||
            (c.phones || []).some((p) => p.number?.includes(q))
        )
      : available;
    return list.slice(0, 20);
  }, [available, query]);

  return (
    <div className="relative">
      {selected && !open ? (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm">
          <div>
            <span className="font-medium text-foreground">{selected.name}</span>
            {(selected.phones || [])[0]?.number && (
              <span className="ml-2 text-muted-foreground text-xs">{selected.phones![0].number}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect("");
              setOpen(true);
            }}
            className="text-muted-foreground hover:text-foreground ml-2 transition-colors"
            aria-label="Clear selected contact"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            className={`${INPUT} pl-9`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search by name, phone…"
          />
        </div>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={() => setOpen(false)} />
          <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground bg-card">No contacts found.</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={() => {
                    onSelect(c.id);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center justify-between gap-2 bg-card"
                >
                  <span className="text-sm font-medium text-foreground truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{(c.phones || [])[0]?.number || ""}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface EmergencyTabProps {
  data: ContactFormData;
  onChange: (updatedData: ContactFormData) => void;
  allContacts: Contact[];
  required?: boolean;
  tabFieldCfg?: {
    enabled?: string[];
    required?: string[];
  };
  customFields?: CustomField[];
}

/**
 * EmergencyTab component for managing contact emergency contact linkages.
 * @param props Component properties.
 * @returns React element.
 */
export default function EmergencyTab({
  data,
  onChange,
  allContacts,
  required = false,
  tabFieldCfg,
  customFields
}: EmergencyTabProps): React.JSX.Element {
  const { relationships } = useContactConfig();
  const list = data.emergencyContacts && data.emergencyContacts.length > 0 ? data.emergencyContacts : [{ contactId: "", relationship: "" }];
  const upd = (l: EmergencyContact[]): void => {
    onChange({ ...data, emergencyContacts: l });
  };
  const available = allContacts.filter((c) => c.id !== data.id);

  const en = tabFieldCfg?.enabled ?? DEFAULT_TAB_FIELD_CONFIG.emergency.enabled;
  const req = tabFieldCfg?.required ?? DEFAULT_TAB_FIELD_CONFIG.emergency.required;
  const showContactId = en.includes("contactId");
  const showRelationship = en.includes("relationship");
  const reqContactId = req.includes("contactId");
  const reqRelationship = req.includes("relationship");

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>Link existing contacts as emergency contacts. They must already be in the system.</p>
      </div>

      {required && list.length === 0 && <RequiredBanner message="At least one emergency contact is required" />}
      {list.length === 0 && <FormEmptyState icon={Heart} text="No emergency contacts yet. Add one below." />}

      {showContactId &&
        list.map((ec, i) => {
          const sel = available.find((c) => String(c.id) === String(ec.contactId));
          return (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-muted/20 p-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Contact {i + 1}</span>
                <button
                  type="button"
                  onClick={() => upd(list.filter((_, j) => j !== i))}
                  className="p-1 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                  aria-label={`Remove emergency contact ${i + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <Field label="Find Contact" required={reqContactId}>
                <ContactSearchPicker
                  available={available}
                  selectedId={ec.contactId ?? ""}
                  onSelect={(id) => upd(list.map((x, j) => (j === i ? { ...x, contactId: id } : x)))}
                />
              </Field>

              {sel && (
                <div className="rounded-lg bg-background border border-border px-3 py-2 text-xs space-y-0.5 text-foreground">
                  {sel.phones?.[0]?.number && <p className="text-muted-foreground">📞 {sel.phones[0].number}</p>}
                  {sel.emails?.[0]?.address && <p className="text-muted-foreground">✉️ {sel.emails[0].address}</p>}
                </div>
              )}

              {showRelationship && (
                <Field label="Relationship" required={reqRelationship}>
                  <select
                    className={SELECT}
                    value={ec.relationship || ""}
                    onChange={(e) =>
                      upd(list.map((x, j) => (j === i ? { ...x, relationship: e.target.value } : x)))
                    }
                    aria-label={`Relationship to contact ${i + 1}`}
                  >
                    <option value="">Select…</option>
                    {(relationships || []).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </motion.div>
          );
        })}

      <button
        type="button"
        onClick={() => upd([...list, { contactId: "", relationship: "" }])}
        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add emergency contact</span>
      </button>
      <TabCustomFields customFields={customFields} data={data} onChange={onChange} />
    </div>
  );
}
