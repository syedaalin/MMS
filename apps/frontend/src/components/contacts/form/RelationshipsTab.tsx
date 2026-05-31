import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Users, Plus, Trash2, Search, X } from "lucide-react";
import { Field, INPUT, SELECT, FormEmptyState } from "./FormPrimitives";
import { useContactConfig } from "../../../lib/ContactConfigContext";

interface ContactSummary {
  id: string | number;
  name?: string;
  phones?: Array<{ number: string }>;
}

interface RelationshipItem {
  contactId: string | number;
  type: string;
}

interface ContactFormData {
  id?: string | number;
  relationships?: RelationshipItem[];
  [key: string]: unknown;
}

interface ContactSearchPickerProps {
  available: ContactSummary[];
  selectedId: string | number;
  onSelect: (id: string | number) => void;
}

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
            placeholder="Search by name..."
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

interface RelationshipsTabProps {
  data: ContactFormData;
  onChange: (updatedData: ContactFormData) => void;
  allContacts: ContactSummary[];
}

/**
 * RelationshipsTab Component
 *
 * Renders a form tab for configuring bidirectional relationships (e.g., Mother, Father, Referrer)
 * between the current contact and other contacts in the CRM.
 *
 * @param props - Component properties.
 * @returns React element representing the relationships configuration UI.
 */
export default function RelationshipsTab({
  data,
  onChange,
  allContacts,
}: RelationshipsTabProps): React.JSX.Element {
  const { relationships } = useContactConfig();
  const list = data.relationships || [];
  const upd = (l: RelationshipItem[]): void => {
    onChange({ ...data, relationships: l });
  };
  const available = allContacts.filter((c) => String(c.id) !== String(data.id));

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>Establish bidirectional relationships with other contacts in the CRM. Links are displayed dynamically on profiles.</p>
      </div>

      {list.length === 0 && <FormEmptyState icon={Users} text="No relationships set. Link this contact below." />}

      {list.map((r, i) => (
        <motion.div
          key={i}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-muted/20 p-3 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Link {i + 1}</span>
            <button
              type="button"
              onClick={() => upd(list.filter((_, j) => j !== i))}
              className="p-1 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
              aria-label={`Remove relationship ${i + 1}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <Field label="Link Contact" required>
            <ContactSearchPicker
              available={available}
              selectedId={r.contactId ?? ""}
              onSelect={(id) => upd(list.map((x, j) => (j === i ? { ...x, contactId: id } : x)))}
            />
          </Field>

          <Field label="Relationship Type" required>
            <select
              className={SELECT}
              value={r.type || ""}
              onChange={(e) =>
                upd(list.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))
              }
              aria-label={`Relationship to contact ${i + 1}`}
            >
              <option value="">Select type...</option>
              {(relationships || []).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </motion.div>
      ))}

      <button
        type="button"
        onClick={() => upd([...list, { contactId: "", type: "" }])}
        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Relationship Link</span>
      </button>
    </div>
  );
}
