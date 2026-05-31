import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, AlertTriangle, MessageCircle, Download, Users, Settings, UserX, RefreshCw, X, Loader2, LayoutDashboard, BarChart2 } from "lucide-react";
import ModuleReports from "../components/reports/ModuleReports";
import KPISummary from "../components/reports/KPISummary";
import PageHeader from "../components/ui/PageHeader";
import ActionButton from "../components/ui/ActionButton";
import ContactsTable from "../components/contacts/ContactsTable";
import ContactsToolbar from "../components/contacts/ContactsToolbar";
import ErrorBoundary from "../components/ui/ErrorBoundary";

// Heavy components — loaded only when first needed
const ContactForm          = lazy(() => import("../components/contacts/ContactForm"));
const DuplicateDetection   = lazy(() => import("../components/contacts/DuplicateDetection"));
const WhatsAppPanel        = lazy(() => import("../components/contacts/WhatsAppPanel"));
const ContactsSettingsPanel = lazy(() => import("../components/contacts/ContactsSettingsPanel"));
const ContactSyncPanel     = lazy(() => import("../components/contacts/ContactSyncPanel"));
const ContactKanban        = lazy(() => import("../components/contacts/ContactKanban"));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}
import { CONTACTS } from "../lib/contactsData";
import { Contact, PhoneNumber } from "../lib/contactFields";
import { getCollection, saveCollection } from "../lib/db";
import { useToast } from "@/components/ui/use-toast";
import {
  ContactConfigProvider, useContactConfig, useContactColumns, calculateProfileHealth
} from "../lib/ContactConfigContext";
import { parsePhoneNumber, getPrimaryPhone } from "../lib/contactConstants";

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_TABS = [
  { id: "operations",    label: "Operations",    icon: LayoutDashboard },
  { id: "analytics",     label: "Analytics",     icon: BarChart2 },
  { id: "configuration", label: "Configuration", icon: Settings },
];

const SETTINGS_SUB_TABS = [
  { id: "fields", label: "Fields & Preferences" },
  { id: "sync",   label: "Sync (Google / Apple)" },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="w-10 px-4 py-3"><div className="w-4 h-4 rounded bg-muted animate-pulse" /></th>
            {Array.from({ length: cols }).map((_, i) => <th key={i} className="px-4 py-3"><div className="h-3 w-20 rounded bg-muted animate-pulse" /></th>)}
            <th className="w-16 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              <td className="px-4 py-3"><div className="w-4 h-4 rounded bg-muted animate-pulse" /></td>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <div className="h-3 rounded bg-muted animate-pulse" style={{ width: `${50 + (c * 17 + r * 11) % 40}%` }} />
                </td>
              ))}
              <td className="px-4 py-3"><div className="w-6 h-6 rounded-lg bg-muted animate-pulse" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SettingsPanelProps {
  contacts: Contact[];
  onImport: (list: Contact[]) => void;
}

// ── Settings sub-panel ────────────────────────────────────────────────────────
function SettingsPanel({ contacts, onImport }: SettingsPanelProps) {
  const { fieldConfig, updateConfig } = useContactConfig();
  const [sub, setSub] = useState("fields");
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        {SETTINGS_SUB_TABS.map((t) => (
          <button key={t.id} onClick={() => setSub(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${sub === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <Suspense fallback={<LazyFallback />}>
        {sub === "fields"
          ? <ContactsSettingsPanel config={fieldConfig} onConfigChange={updateConfig as (config: object) => void} />
          : <ContactSyncPanel contacts={contacts} onImport={onImport as (contacts: object[]) => void} />}
      </Suspense>
    </div>
  );
}

// ── Inner page (must be inside ContactConfigProvider) ─────────────────────────
function ContactsInner() {
  const { fieldConfig, prefs, countryCodesMap, updateVisibleColumns, lifecycleStages } = useContactConfig();
  const tableColumns = useContactColumns(); // ← dynamic, auto-updates with config

  const [isLoading,       setIsLoading]       = useState(true);
  const DELETED_CONTACT_KEYS = useMemo(() => [
    "cnic", "tag", "bloodGroup", "maritalStatus", "education",
    "nationality", "religion", "occupation", "designation",
    "website", "notes", "relationship", "preferredName",
    "fatherName", "grandfatherName", "isActive",
    "area", "district", "postalCode", "timezone", "mapLink",
  ], []);

  const [contacts,        setContacts]        = useState<Contact[]>(() => {
    const raw = getCollection("contacts", CONTACTS);
    const country = prefs?.defaultCountry || "Pakistan";
    const defaultCode = countryCodesMap[country] || "+92";
    return raw.map(c => {
      const sanitized = {
        lifecycleStage: "Lead",
        rating: 3,
        relationships: [],
        activities: [],
        ...c
      } as Record<string, unknown>;
      DELETED_CONTACT_KEYS.forEach(k => {
        delete sanitized[k];
      });
      if (sanitized.phones && Array.isArray(sanitized.phones)) {
        return {
          ...sanitized,
          phones: sanitized.phones.map((p: PhoneNumber) => {
            if (p.countryCode) return p;
            const parsed = parsePhoneNumber(p.number, defaultCode);
            return {
              ...p,
              countryCode: parsed.countryCode,
              number: parsed.number,
            };
          })
        } as unknown as Contact;
      }
      return sanitized as unknown as Contact;
    });
  });
  const [search,          setSearch]          = useState("");
  const [filterGender,    setFilterGender]    = useState("");
  const [filterStage,     setFilterStage]     = useState("");
  const [viewMode,        setViewMode]        = useState<"list" | "kanban">("list");
  const [sortField,       setSortField]       = useState("name");
  const [sortDir,         setSortDir]         = useState<"asc" | "desc">("asc");
  const [selected,        setSelected]        = useState<(string | number)[]>([]);
  const [showForm,        setShowForm]        = useState(false);
  const [editContact,     setEditContact]     = useState<Contact | null>(null);
  const [showDuplicates,  setShowDuplicates]  = useState(false);
  const [whatsappTargets, setWhatsappTargets] = useState<Contact[] | null>(null);
  const [activeTab,       setActiveTab]       = useState("operations");

  const { toast } = useToast();

  const defaultCountry  = prefs.defaultCountry  || "Pakistan";
  const defaultCity     = prefs.defaultCity     || "Karachi";
  const defaultProvince = prefs.defaultProvince || "Sindh";

  useEffect(() => {
    saveCollection("contacts", contacts);
  }, [contacts]);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  // ── Filtered + sorted contacts ────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = contacts.filter((c) => {
      const stage = c.lifecycleStage || "Lead";
      if (filterStage && stage !== filterStage) return false;

      if (q) {
        const phone = getPrimaryPhone(c) || "";
        const email = (c.emails || [])[0]?.address || (c.email as string) || "";
        const city = (c.city as string) || "";
        const match =
          c.name?.toLowerCase().includes(q) ||
          email.toLowerCase().includes(q) ||
          phone.includes(q) ||
          city.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterGender && c.gender !== filterGender) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";

      if (sortField === "profileHealth") {
        av = calculateProfileHealth(a);
        bv = calculateProfileHealth(b);
      } else {
        av = typeof a[sortField] === "number" ? (a[sortField] as number) : String(a[sortField] || "").toLowerCase();
        bv = typeof b[sortField] === "number" ? (b[sortField] as number) : String(b[sortField] || "").toLowerCase();
      }

      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [contacts, search, filterGender, filterStage, sortField, sortDir]);

  const hasActiveFilters  = !!(filterGender || filterStage || search);
  const activeFilterCount = (filterGender ? 1 : 0) + (filterStage ? 1 : 0);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSort = useCallback((field: string) => {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }, [sortField]);

  const handleSelect    = useCallback((id: string | number) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]), []);
  const handleSelectAll = useCallback(() => setSelected((s) => s.length === filtered.length ? [] : filtered.map((c) => c.id)), [filtered]);

  const handleEdit = useCallback((c: Contact) => { setEditContact(c); setShowForm(true); }, []);
  const handleNew  = useCallback(() => { setEditContact(null); setShowForm(true); }, []);

  const handleSave = useCallback((data: Contact) => {
    setContacts((cs) => editContact
      ? cs.map((c) => c.id === editContact.id ? { ...c, ...data } : c)
      : [...cs, { ...data, id: Date.now() }]
    );
    setShowForm(false);
    setEditContact(null);
  }, [editContact]);

  const handleDelete = useCallback((id: string | number) => {
    setContacts((cs) => {
      const c = cs.find((x) => x.id === id);
      toast({ title: "Contact deleted", description: c?.name ? `"${c.name}" has been removed.` : "Contact removed." });
      return cs.filter((x) => x.id !== id);
    });
  }, [toast]);

  const handleExportCSV = () => {
    const rows = [["Name","Gender","DOB","Phone","Email","City","State","Country"]];
    filtered.forEach((c) => {
      const phone = getPrimaryPhone(c) || "";
      const email = (c.emails || [])[0]?.address || (c.email as string) || "";
      const city = (c.city as string) || "";
      const state = (c.state as string) || "";
      const country = (c.country as string) || "";
      rows.push([c.name, c.gender || "", c.dob || "", phone, email, city, state, country]);
    });
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "contacts.csv";
    a.click();
  };

  const clearFilters = useCallback(() => { setFilterGender(""); setFilterStage(""); setSearch(""); }, []);

  const visibleColumns = tableColumns;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <title>MMS - Contacts Directory</title>
      <meta name="description" content="View and manage the contacts directory, trace registration leads, and configure customized columns." />
      <PageHeader
        icon={Users}
        title="Contacts"
        subtitle={`${contacts.length} total · ${filtered.length} shown`}
        actions={activeTab === "operations" ? (
          <>
            <ActionButton variant="ghost" icon={AlertTriangle} onClick={() => setShowDuplicates(true)}>Duplicates</ActionButton>
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <ActionButton variant="primary" icon={UserPlus} onClick={handleNew}>Add Contact</ActionButton>
          </>
        ) : null}
      />

      <div className="space-y-4">
        <ErrorBoundary>
          <KPISummary category="contacts" />
        </ErrorBoundary>
      </div>

      {/* Page tab bar */}
      <div className="flex border-b border-border">
        {PAGE_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "operations" ? (
          <motion.div key="operations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-card/40 backdrop-blur-xl border border-border/50 p-3 rounded-2xl shadow-sm">
              <div className="flex gap-1.5 bg-muted/60 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${viewMode === "kanban" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Kanban Board
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Stage:</span>
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-border text-xs bg-background text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All Stages</option>
                  {(lifecycleStages || []).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <ErrorBoundary>
              <ContactsToolbar
                search={search}             onSearchChange={setSearch}
                filterGender={filterGender} onGenderChange={setFilterGender}
                sortField={sortField}       onSort={handleSort}
                tableColumns={visibleColumns}
                onColumnsChange={updateVisibleColumns as (columns: object[]) => void}   /* columns are now config-driven */
                hasActiveFilters={hasActiveFilters}
                activeFilterCount={activeFilterCount}
                onClearFilters={clearFilters}
              />
            </ErrorBoundary>

            {/* Active filter chips */}
            <AnimatePresence>
              {(filterGender || filterStage) && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex flex-wrap gap-1.5">
                  {filterGender && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                      Gender: {filterGender} <button onClick={() => setFilterGender("")} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filterStage && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                      Stage: {filterStage} <button onClick={() => setFilterStage("")} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bulk action bar */}
            <AnimatePresence>
              {selected.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-primary/[0.05] border border-primary/20 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{selected.length} selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setWhatsappTargets(contacts.filter((c) => selected.includes(c.id)))}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: "#075E54" }}>
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp ({selected.length})
                    </button>
                    <button onClick={() => setSelected([])} className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      Deselect
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content area */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <TableSkeleton rows={6} cols={visibleColumns.length} />
                </motion.div>
              ) : (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 rounded-xl border-2 border-dashed border-border text-muted-foreground gap-3">
                      <UserX className="w-8 h-8 opacity-30" />
                      <p className="text-sm font-semibold">{hasActiveFilters ? "No contacts match your filters" : "No contacts yet"}</p>
                      <p className="text-xs text-center max-w-xs">{hasActiveFilters ? "Try adjusting your search or filters." : "Click \"Add Contact\" to create your first contact."}</p>
                      {hasActiveFilters && (
                        <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                          <RefreshCw className="w-3 h-3" /> Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    viewMode === "list" ? (
                      <ErrorBoundary>
                        <ContactsTable
                          contacts={filtered} selected={selected}
                          onSelect={handleSelect} onSelectAll={handleSelectAll}
                          onEdit={handleEdit as (contact: object) => void} onDelete={handleDelete}
                          onWhatsApp={(targets) => setWhatsappTargets(targets as Contact[])}
                          sortField={sortField} sortDir={sortDir} onSort={handleSort}
                          columns={visibleColumns}
                          allContacts={contacts}
                          onUpdateContact={(updated) => setContacts((cs) => cs.map((x) => x.id === updated.id ? updated : x))}
                        />
                      </ErrorBoundary>
                    ) : (
                      <Suspense fallback={<LazyFallback />}>
                        <ErrorBoundary>
                          <ContactKanban
                            contacts={filtered}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onWhatsApp={(targets: Contact[]) => setWhatsappTargets(targets)}
                            onStageChange={(id: string | number, newStage: string) => {
                              setContacts((cs) => cs.map((c) => {
                                if (c.id === id) {
                                  const oldStage = c.lifecycleStage || "Lead";
                                  const stageActivity = {
                                    id: `act-${Date.now()}`,
                                    type: "stage_change" as const,
                                    content: `Lifecycle stage updated from ${oldStage} to ${newStage}`,
                                    date: new Date().toISOString().slice(0, 10),
                                    by: "System"
                                  };
                                  return {
                                    ...c,
                                    lifecycleStage: newStage,
                                    activities: [stageActivity, ...(c.activities || [])]
                                  };
                                }
                                return c;
                              }));
                              toast({
                                title: "Stage updated",
                                description: `Contact stage updated to ${newStage}`
                              });
                            }}
                            fieldConfig={fieldConfig}
                          />
                        </ErrorBoundary>
                      </Suspense>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        ) : activeTab === "analytics" ? (
          <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <ErrorBoundary>
              <ModuleReports category="contacts" />
            </ErrorBoundary>
          </motion.div>
        ) : (
          <motion.div key="configuration" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <ErrorBoundary>
              <SettingsPanel
                contacts={contacts}
                onImport={(list: Contact[]) => {
                  setContacts((cs) => [...cs, ...list]);
                  toast({ title: `${list.length} contact${list.length !== 1 ? "s" : ""} imported successfully` });
                }}
              />
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals — lazy loaded, only mounted when needed */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {showForm && (
            <ContactForm
              key={editContact?.id || "new"}
              contact={editContact ?? undefined}
              allContacts={contacts}
              defaultCountry={defaultCountry}
              defaultCity={defaultCity}
              defaultProvince={defaultProvince}
              onClose={() => { setShowForm(false); setEditContact(null); }}
              onSave={handleSave as (contact: object) => void}
            />
          )}
          {showDuplicates && (
            <DuplicateDetection
              contacts={contacts}
              onClose={() => setShowDuplicates(false)}
              onMerge={(keepId, deleteId, mergedData) => {
                setContacts((cs) =>
                  cs
                    .map((c) => (c.id === keepId ? { ...c, ...mergedData } : c))
                    .filter((c) => c.id !== deleteId)
                );
                toast({
                  title: "Contacts merged",
                  description: "The duplicate contact was merged successfully.",
                });
              }}
            />
          )}
          {whatsappTargets && <WhatsAppPanel contacts={whatsappTargets} onClose={() => setWhatsappTargets(null)} />}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}

/**
 * Contacts page component wrapping the ContactsInner page with the configuration provider.
 * @returns {React.ReactElement}
 */
export default function Contacts() {
  return (
    <ContactConfigProvider>
      <ContactsInner />
    </ContactConfigProvider>
  );
}