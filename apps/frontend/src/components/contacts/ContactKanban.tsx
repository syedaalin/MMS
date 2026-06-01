import React from "react";
import { motion } from "framer-motion";
import { Phone, Mail, Edit2, Trash2, MessageCircle, Star } from "lucide-react";
import { AVATAR_COLORS, getInitials, getPrimaryPhone, getPrimaryEmail, hasWhatsApp, getDisplayName } from "@/lib/contactConstants";
import { useContactConfig, calculateProfileHealth } from "../../lib/ContactConfigContext";
import { Contact, FieldConfig, LIFECYCLE_COLORS } from "../../lib/contactFields";

interface AvatarProps {
  contact: Contact;
}

/**
 * Avatar component displaying contact initials.
 */
function Avatar({ contact }: AvatarProps): React.JSX.Element {
  const initials = getInitials(contact.name || contact.firstName);
  const numericId = typeof contact.id === "number" ? contact.id : 0;
  const color = AVATAR_COLORS[numericId % AVATAR_COLORS.length];
  return (
    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string | number) => void;
  onWhatsApp: (contacts: Contact[]) => void;
  onStageChange: (id: string | number, newStage: string) => void;
}

/**
 * Individual ContactCard component.
 */
function ContactCard({ contact, onEdit, onDelete, onWhatsApp, onStageChange }: ContactCardProps): React.JSX.Element {
  const { lifecycleStages } = useContactConfig();
  const phone = getPrimaryPhone(contact);
  const email = getPrimaryEmail(contact);
  const hasWA = hasWhatsApp(contact);
  const health = calculateProfileHealth(contact);
  const rating = contact.rating || 0;

  const handleDelete = (): void => {
    onDelete(contact.id);
  };

  const handleWhatsApp = (): void => {
    onWhatsApp([contact]);
  };

  const handleEdit = (): void => {
    onEdit(contact);
  };

  const handleStageSelect = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    if (e.target.value) {
      onStageChange(contact.id, e.target.value);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-md border border-border/50 rounded-xl p-3 space-y-3 hover:shadow-md hover:border-primary/20 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar contact={contact} />
          <div>
            <p className="text-[13px] font-semibold text-foreground leading-tight">{getDisplayName(contact)}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border`}>
                Health: {health}%
              </span>
              {rating > 0 && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                  <span className="text-[9px] font-bold text-amber-600">{rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            type="button"
            aria-label="Edit contact"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
            type="button"
            aria-label="Delete contact"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="space-y-1 text-xs">
        {phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground font-mono truncate">{phone}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate">{email}</span>
          </div>
        )}
      </div>

      {/* Stage Mover Selector */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-1.5">
        <label htmlFor={`stage-select-${contact.id}`} className="text-[9px] font-semibold text-muted-foreground uppercase">Move to:</label>
        <select
          id={`stage-select-${contact.id}`}
          value={contact.lifecycleStage || "Lead"}
          onChange={handleStageSelect}
          className="text-[10px] font-bold border border-border/80 rounded bg-background px-1.5 py-0.5 text-foreground hover:border-primary/40 focus:outline-none"
        >
          {(lifecycleStages || []).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {contact.phones && contact.phones.length > 0 && (
        <button
          disabled={!hasWA}
          onClick={handleWhatsApp}
          className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all ${
            hasWA 
              ? "opacity-100 cursor-pointer" 
              : "opacity-40 cursor-not-allowed bg-muted/60 text-muted-foreground"
          }`}
          style={{ backgroundColor: hasWA ? "#075E54" : "hsl(var(--muted))" }}
          type="button"
        >
          <MessageCircle className="w-3 h-3" /> WhatsApp
        </button>
      )}
    </motion.div>
  );
}

interface ContactKanbanProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string | number) => void;
  onWhatsApp: (contacts: Contact[]) => void;
  onStageChange: (id: string | number, newStage: string) => void;
  fieldConfig?: FieldConfig;
}

/**
 * ContactKanban component to display contacts grouped by CRM lifecycle stage in Kanban layout.
 *
 * @returns React.JSX.Element
 */
export default function ContactKanban({
  contacts,
  onEdit,
  onDelete,
  onWhatsApp,
  onStageChange,
  fieldConfig,
}: ContactKanbanProps): React.JSX.Element {
  const { lifecycleStages } = useContactConfig();
  const grouped = (lifecycleStages || []).reduce<Record<string, Contact[]>>((acc, stage) => {
    acc[stage] = contacts.filter((c) => (c.lifecycleStage || "Lead") === stage);
    return acc;
  }, {});

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
      {(lifecycleStages || []).map((stage) => {
        const colors = LIFECYCLE_COLORS[stage] || { bg: "bg-muted text-muted-foreground border-border", text: "text-muted-foreground", border: "border-border" };
        const list = grouped[stage] || [];
        return (
          <div key={stage} className="flex-shrink-0 w-72 flex flex-col bg-card/30 backdrop-blur-xl border border-border/50 rounded-2xl p-3 min-h-[500px] shadow-sm">
            {/* Column Header */}
            <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${colors.bg} mb-3 shadow-sm`}>
              <span className="text-[12px] font-bold tracking-wide">{stage}</span>
              <span className="text-[11px] font-bold text-muted-foreground bg-background border border-border/80 w-5 h-5 flex items-center justify-center rounded-full">
                {list.length}
              </span>
            </div>

            {/* Cards List */}
            <div className="flex-1 space-y-2 overflow-y-auto pr-0.5 max-h-[calc(100vh-320px)]">
              {list.length === 0 ? (
                <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-xl text-muted-foreground text-[11px]">
                  No contacts in this stage
                </div>
              ) : (
                list.map((c) => (
                  <ContactCard
                    key={c.id}
                    contact={c}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onWhatsApp={onWhatsApp}
                    onStageChange={onStageChange}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
