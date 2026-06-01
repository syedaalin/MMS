import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Edit2, MessageCircle, Phone, Mail,
  ExternalLink, Calendar, User, Clock, Tag,
  Star, Send, Link, Plus, LucideIcon,
  LayoutDashboard, History, Users as UsersIcon, FileText, BrainCircuit, ShieldCheck, MapPin, Search, Zap
} from "lucide-react";
import { CONTACT_FIELD_REGISTRY, Contact, CustomField, LIFECYCLE_COLORS, ContactActivity, ContactAttachment } from "../../lib/contactFields";
import { useContactConfig, calculateProfileHealth } from "../../lib/ContactConfigContext";
import { getDisplayName, getPrimaryPhone, getPrimaryEmail, hasWhatsApp } from "../../lib/contactConstants";

const DETAIL_TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "timeline", label: "Timeline", icon: History },
  { id: "network", label: "Network", icon: UsersIcon },
  { id: "files", label: "Files", icon: FileText },
];

interface AvatarProps {
  contact: Contact;
}

/**
 * Avatar component displaying contact photo or initials.
 */
function Avatar({ contact }: AvatarProps): React.JSX.Element {
  const COLORS = [
    "bg-emerald-100 text-emerald-700",
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700"
  ];
  const initials = (contact.name || contact.firstName || "?")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
  
  const colorIdx = typeof contact.id === "number" ? contact.id % COLORS.length : 0;
  
  if (contact.avatar) {
    return (
      <img
        src={contact.avatar}
        alt={contact.name || contact.firstName || "Contact Avatar"}
        className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border border-border"
      />
    );
  }
  
  return (
    <div className={`w-16 h-16 rounded-2xl ${COLORS[colorIdx]} flex items-center justify-center text-2xl font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

interface InfoRowProps {
  icon: LucideIcon | typeof Tag;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}

/**
 * Row displaying a single metadata field with an icon and label.
 */
function InfoRow({ icon: Icon, label, value, mono }: InfoRowProps): React.JSX.Element | null {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-border/60 last:border-0">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        <p className={`text-sm text-foreground mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Section container for grouping information.
 */
function Section({ title, children }: SectionProps): React.JSX.Element {
  return (
    <section className="rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2 bg-muted/40 border-b border-border">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</h3>
      </div>
      <div className="px-4 py-1">{children}</div>
    </section>
  );
}

interface ContactDetailDrawerProps {
  contact: Contact;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onWhatsApp: (contacts: Contact[]) => void;
  allContacts?: Contact[];
  onUpdateContact?: (contact: Contact) => void;
}

/**
 * ContactDetailDrawer component for displaying a detailed slide-out panel for a contact.
 *
 * @returns React.JSX.Element
 */
export default function ContactDetailDrawer({
  contact: initialContact,
  onClose,
  onEdit,
  onWhatsApp,
  allContacts = [],
  onUpdateContact,
}: ContactDetailDrawerProps): React.JSX.Element {
  const { enabledTabIds, isTabFieldEnabled, fieldConfig } = useContactConfig();

  // Local contact state to support switching dynamically via relationship links
  const [c, setC] = useState<Contact>(initialContact);
  const [noteText, setNoteText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("overview");

  useEffect(() => {
    setC(initialContact);
  }, [initialContact]);

  const health = calculateProfileHealth(c);
  const rating = c.rating || 0;

  const age = c.dob
    ? Math.floor((new Date().getTime() - new Date(c.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  // Build dynamic field display from enabled fields
  const dynamicFields = CONTACT_FIELD_REGISTRY.filter(
    (f) =>
      !["name", "notes", "communicationPref", "lifecycleStage", "rating"].includes(f.id) &&
      !f.alwaysOn &&
      isTabFieldEnabled(f.tab, f.id) &&
      c[f.id]
  );

  // Group by field group
  const grouped = dynamicFields.reduce<Record<string, typeof dynamicFields>>((acc, f) => {
    if (!acc[f.group]) acc[f.group] = [];
    acc[f.group].push(f);
    return acc;
  }, {});

  const formatFieldValue = (field: typeof CONTACT_FIELD_REGISTRY[0]): string | null => {
    const val = c[field.id];
    if (val === undefined || val === null || val === "") return null;
    if (Array.isArray(val)) return val.join(", ") || null;
    if (field.id === "dob") {
      try {
        const d = new Date(val as string);
        return `${d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}${age ? ` (${age} yrs)` : ""}`;
      } catch (err) {
        console.error("Failed parsing DOB value:", val, err);
        return String(val);
      }
    }
    return String(val);
  };

  // Custom fields that have a value on this contact
  const allCustomFields: CustomField[] = [
    ...(fieldConfig?.customFields || []),
    ...Object.values(fieldConfig?.tabCustomFields || {}).flat(),
  ];
  const populatedCustomFields = allCustomFields.filter((f) => {
    const v = c[f.id];
    if (f.type === "tags") return Array.isArray(v) && v.length > 0;
    return v !== undefined && v !== null && v !== "" && v !== false;
  });

  const hasWA = enabledTabIds.has("phones") && (c.phones || []).some((p) => p.whatsapp);
  const primaryPhone = enabledTabIds.has("phones") ? getPrimaryPhone(c) : null;
  const primaryEmail = enabledTabIds.has("emails") ? getPrimaryEmail(c) : null;

  const FIELD_ICONS: Record<string, LucideIcon | typeof Tag> = {
    gender: User,
    dob: Calendar,
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const newActivity: ContactActivity = {
      id: `act-${Date.now()}`,
      type: "note",
      content: noteText.trim(),
      date: new Date().toISOString().slice(0, 10),
      by: "Admin"
    };

    const updatedContact = {
      ...c,
      activities: [newActivity, ...(c.activities || [])]
    };

    setC(updatedContact);
    setNoteText("");

    if (onUpdateContact) {
      onUpdateContact(updatedContact);
    }
  };

  const handleNavigateToContact = (targetId: string | number) => {
    const target = allContacts.find((x) => String(x.id) === String(targetId));
    if (target) {
      setC(target);
    }
  };

  const stage = c.lifecycleStage || "Lead";
  const stageColors = LIFECYCLE_COLORS[stage] || { bg: "bg-muted text-muted-foreground border-border", text: "text-muted-foreground" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.aside
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="relative w-full max-w-sm h-full bg-card border-l border-border shadow-2xl flex flex-col z-10"
        aria-label="Contact Details"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 px-5 pt-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-10 h-10 -rotate-90">
                  <circle cx="20" cy="20" r="16" className="stroke-muted-foreground/10 fill-none" strokeWidth="3" />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    className={`fill-none transition-all duration-500 ${
                      health >= 80 ? "stroke-emerald-500" : health >= 50 ? "stroke-amber-500" : "stroke-red-400"
                    }`}
                    strokeWidth="3"
                    strokeDasharray={100.5}
                    strokeDashoffset={100.5 - health}
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-foreground">{health}%</span>
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-foreground leading-tight">Profile Intelligence</h2>
                <div className="flex items-center gap-1">
                   <ShieldCheck className={`w-3 h-3 ${health >= 80 ? "text-emerald-500" : health >= 50 ? "text-amber-500" : "text-red-400"}`} />
                   <span className="text-[9px] font-semibold text-muted-foreground uppercase">{health >= 80 ? "Verified" : "Incomplete"}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(c)}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Edit Profile"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex gap-1">
            {DETAIL_TABS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2 border-b-2 transition-all ${
                    isActive ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {activeTab === "overview" && (
                <>
                  {/* Hero */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                    <Avatar contact={c} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground truncate leading-tight">{getDisplayName(c)}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black border ${stageColors.bg} uppercase tracking-wider`}>
                          {stage}
                        </span>
                        {c.isSyed && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 uppercase tracking-wider">
                            Syed
                          </span>
                        )}
                      </div>
                      {rating > 0 && (
                        <div className="flex items-center gap-0.5 mt-2">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-3 h-3 ${idx < rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/20"}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-primary">
                       <BrainCircuit className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">AI Intelligence</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-[12px] text-foreground leading-relaxed italic">
                      {c.aiSummary || `Based on activity history, ${c.firstName} is a ${stage.toLowerCase()} with ${rating > 3 ? "high" : "steady"} engagement. Suggesting follow-up for missing ${!primaryEmail ? "email" : !primaryPhone ? "phone" : "social profile"}.`}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    {enabledTabIds.has("phones") && (
                      <button
                        disabled={!hasWhatsApp(c)}
                        onClick={() => onWhatsApp([c])}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                          hasWhatsApp(c)
                            ? "border-border hover:bg-emerald-50 hover:border-emerald-200 text-[#075E54] cursor-pointer"
                            : "border-border opacity-40 bg-muted/20 text-muted-foreground cursor-not-allowed"
                        }`}
                        type="button"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-[10px] font-bold">WhatsApp</span>
                      </button>
                    )}
                    {primaryPhone && (
                      <a
                        href={`tel:${primaryPhone.replace(/[^\d+]/g, "")}`}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-border hover:bg-blue-50 hover:border-blue-200 transition-all text-blue-600"
                      >
                        <Phone className="w-5 h-5" />
                        <span className="text-[10px] font-bold">Call</span>
                      </a>
                    )}
                    {primaryEmail && (
                      <a
                        href={`mailto:${primaryEmail}`}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-border hover:bg-indigo-50 hover:border-indigo-200 transition-all text-indigo-600"
                      >
                        <Mail className="w-5 h-5" />
                        <span className="text-[10px] font-bold">Email</span>
                      </a>
                    )}
                  </div>

                  {/* Identity Grid */}
                  <div className="space-y-4">
                    {Object.entries(grouped).map(([group, fields]) => (
                      <div key={group} className="space-y-2">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{group}</h4>
                        <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
                          {fields.map(f => {
                             const val = formatFieldValue(f);
                             if (!val) return null;
                             const Icon = FIELD_ICONS[f.id] || Tag;
                             return (
                               <div key={f.id} className="flex items-center gap-3 p-3 group/row">
                                 <div className="p-2 rounded-lg bg-muted group-hover/row:bg-primary/10 transition-colors">
                                   <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover/row:text-primary" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight leading-none mb-1">{f.label}</span>
                                   <span className="text-sm font-semibold text-foreground truncate">{val}</span>
                                 </div>
                               </div>
                             );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Custom fields */}
                  {populatedCustomFields.length > 0 && (
                     <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Extended Profiles</h4>
                        <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
                           {populatedCustomFields.map(f => {
                             const val = c[f.id];
                             const displayVal = Array.isArray(val) ? val.join(", ") : String(val ?? "");
                             return (
                               <div key={f.id} className="flex items-center gap-3 p-3 group/row">
                                 <div className="p-2 rounded-lg bg-muted group-hover/row:bg-primary/10 transition-colors">
                                   <Tag className="w-3.5 h-3.5 text-muted-foreground group-hover/row:text-primary" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight leading-none mb-1">{f.label}</span>
                                   <span className="text-sm font-semibold text-foreground truncate">{displayVal}</span>
                                 </div>
                               </div>
                             );
                           })}
                        </div>
                     </div>
                  )}
                </>
              )}

              {activeTab === "timeline" && (
                <div className="space-y-5">
                   <div className="relative">
                     <form onSubmit={handleAddNote} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Log event or note..."
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-2xl border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                        />
                        <button
                          type="submit"
                          className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                   </div>

                   <div className="space-y-6 relative pl-3">
                     <div className="absolute left-[3px] top-0 bottom-0 w-0.5 bg-border/50" />
                     {(!c.activities || c.activities.length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30">
                           <History className="w-12 h-12 mb-2" />
                           <p className="text-xs font-bold uppercase tracking-widest">Quiet Timeline</p>
                        </div>
                     ) : (
                       c.activities.map((act) => {
                          const Icon = act.type === "note" ? FileText : act.type === "stage_change" ? Zap : act.type === "system" ? ShieldCheck : History;
                          return (
                            <div key={act.id} className="relative pl-6 group">
                               <div className="absolute left-[-15.5px] top-1.5 w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center z-10 group-hover:border-primary transition-colors">
                                  <Icon className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary" />
                               </div>
                               <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm group-hover:border-primary/20 transition-all">
                                  <div className="flex items-center justify-between mb-2">
                                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{act.type.replace("_", " ")}</span>
                                     <span className="text-[10px] font-bold text-muted-foreground/60">{act.date}</span>
                                  </div>
                                  <p className="text-xs text-foreground font-medium leading-relaxed">{act.content}</p>
                                  {act.by && <span className="block mt-2 text-[9px] font-bold text-primary italic">— {act.by}</span>}
                               </div>
                            </div>
                          );
                       })
                     )}
                   </div>
                </div>
              )}

              {activeTab === "network" && (
                <div className="space-y-6">
                   <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
                         <UsersIcon className="w-5 h-5" />
                      </div>
                      <div>
                         <h4 className="text-sm font-bold text-indigo-900 leading-none">{c.relationships?.length || 0} Relationships</h4>
                         <p className="text-[10px] font-medium text-indigo-700/70 mt-1 uppercase tracking-tight">Active Social Graph Connection</p>
                      </div>
                   </div>

                   <div className="space-y-3">
                     {(!c.relationships || c.relationships.length === 0) ? (
                        <div className="text-center py-20">
                           <UsersIcon className="w-12 h-12 mx-auto text-muted-foreground/20" />
                           <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">No connections mapped</p>
                           <button className="mt-4 px-4 py-2 rounded-xl border border-border text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all" type="button">Add Relationship</button>
                        </div>
                     ) : (
                        c.relationships.map((rel, i) => {
                          const target = allContacts.find(x => String(x.id) === String(rel.contactId));
                          return (
                            <div key={i} className="group flex items-center justify-between gap-3 p-4 rounded-2xl border border-border/60 bg-card hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all">
                               <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:bg-indigo-50 transition-colors">
                                     {target ? target.name.charAt(0) : "?"}
                                  </div>
                                  <div className="min-w-0">
                                     <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 mb-0.5 block">{rel.type}</span>
                                     <h5 className="text-sm font-bold text-foreground truncate">{target ? target.name : `ID: ${rel.contactId}`}</h5>
                                  </div>
                               </div>
                               {target && (
                                  <button onClick={() => handleNavigateToContact(rel.contactId)} className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all" type="button">
                                     <Search className="w-4 h-4" />
                                  </button>
                               )}
                            </div>
                          );
                        })
                     )}
                   </div>
                </div>
              )}

              {activeTab === "files" && (
                <div className="space-y-6">
                   <div className="p-8 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center gap-3 bg-muted/20">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                         <FileText className="w-6 h-6" />
                      </div>
                      <div>
                         <h4 className="text-sm font-bold text-foreground">Cloud Storage Repository</h4>
                         <p className="text-xs text-muted-foreground mt-1 max-w-[180px]">Drag & drop documents here for AI-powered indexing.</p>
                      </div>
                      <button className="mt-2 px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all" type="button">Browse Files</button>
                   </div>

                   <div className="space-y-3">
                      {(!c.attachments || c.attachments.length === 0) ? (
                         <div className="py-10 text-center">
                             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Repository Empty</p>
                         </div>
                      ) : (
                         c.attachments.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/20 transition-all">
                               <div className="flex items-center gap-3 min-w-0">
                                  <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                     <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                     <h5 className="text-xs font-bold text-foreground truncate">{file.name}</h5>
                                     <p className="text-[9px] text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB · {file.date}</p>
                                  </div>
                               </div>
                               <a href={file.url} download={file.name} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                         ))
                      )}
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Meta */}
        <div className="px-5 py-4 border-t border-border bg-muted/10 flex items-center justify-between">
           <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              <span>Synced 2026-05-28</span>
           </div>
           <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-600 uppercase">Live Intel</span>
           </div>
        </div>
      </motion.aside>
    </div>
  );
}
