import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, MapPin, Share2, User, Save, Loader2, AlertCircle, Heart, CheckCircle2, Users, LucideIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useContactConfig, useContactValidation, calculateProfileHealth } from "../../lib/ContactConfigContext";
import { parsePhoneNumber } from "../../lib/contactConstants";
import { Contact, PhoneNumber } from "../../lib/contactFields";
import BasicTab     from "./form/BasicTab";
import PhoneTab     from "./form/PhoneTab";
import EmailTab     from "./form/EmailTab";
import AddressTab   from "./form/AddressTab";
import SocialTab    from "./form/SocialTab";
import EmergencyTab from "./form/EmergencyTab";
import RelationshipsTab from "./form/RelationshipsTab";

interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  alwaysOn?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const ALL_TABS: TabItem[] = [
  { id: "basic",         label: "Identity",      icon: User,   alwaysOn: true },
  { id: "phones",        label: "Phones",        icon: Phone,  alwaysOn: true },
  { id: "emails",        label: "Emails",        icon: Mail   },
  { id: "addresses",     label: "Addresses",     icon: MapPin },
  { id: "socials",       label: "Socials",       icon: Share2 },
  { id: "emergency",     label: "Emergency",     icon: Heart  },
  { id: "relationships", label: "Relationships", icon: Users  },
];

const TAB_DATA_KEY: Record<string, string> = {
  phones: "phones",
  emails: "emails",
  addresses: "addresses",
  socials: "socials",
  emergency: "emergencyContacts",
  relationships: "relationships",
};

// ── Tab bar item ──────────────────────────────────────────────────────────────
interface TabButtonProps {
  t: TabItem;
  active: boolean;
  required: boolean;
  count: number;
  onClick: () => void;
}

// ── Tab bar item ──────────────────────────────────────────────────────────────
/**
 * TabButton component representing a tab switcher button in the form header.
 */
function TabButton({ t, active, required: isReq, count, onClick }: TabButtonProps): React.JSX.Element {
  const Icon = t.icon;
  const isEmpty    = count === 0 && t.id !== "basic";
  const isComplete = !isReq || count > 0;
  return (
    <button
      onClick={onClick}
      type="button"
      className={`relative flex items-center gap-2 px-3 py-3 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-all ${
        active       ? "border-primary text-primary bg-primary/5"
        : isComplete ? "border-transparent text-muted-foreground hover:text-foreground"
                     : "border-transparent text-red-500 hover:text-red-600"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{t.label}</span>
      {count > 0 && (
        <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${isComplete ? "bg-emerald-500/20 text-emerald-600" : "bg-red-500/20 text-red-600"}`}>
          {count}
        </span>
      )}
      {isReq && isEmpty && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" title="Required" />}
    </button>
  );
}

interface ContactFormProps {
  contact?: Contact;
  allContacts?: Contact[];
  onClose: () => void;
  onSave: (contact: Contact) => void;
  defaultCountry?: string;
  defaultCity?: string;
  defaultProvince?: string;
}

// ── Main form ─────────────────────────────────────────────────────────────────
/**
 * ContactForm component for creating or editing contact records.
 *
 * @param props - Component props.
 * @param props.contact - The contact object to edit, or undefined for a new contact.
 * @param props.allContacts - The complete list of system contacts.
 * @param props.onClose - Callback to close the form dialog.
 * @param props.onSave - Callback to save/create the contact.
 * @param props.defaultCountry - Default fallback country.
 * @param props.defaultCity - Default fallback city.
 * @param props.defaultProvince - Default fallback province.
 * @returns React.JSX.Element
 */
export default function ContactForm({
  contact,
  allContacts = [],
  onClose,
  onSave,
  defaultCountry: defaultCountryProp = "Pakistan",
  defaultCity: defaultCityProp = "",
  defaultProvince: defaultProvinceProp = "",
}: ContactFormProps): React.JSX.Element {
  // Always read from context (live updates from settings panel)
  const { fieldConfig, prefs, enabledTabIds, requiredTabIds, tabFieldConfig, tabCustomFields, countryCodesMap } = useContactConfig();
  const validate = useContactValidation();

  const [tab,         setTab]         = useState<string>("basic");
  const [data,        setData]        = useState<Partial<Contact>>(() => {
    if (!contact) {
      return {
        name: "", phones: [], emails: [], addresses: [], socials: [], emergencyContacts: [],
        lifecycleStage: "Lead", rating: 3, relationships: [], activities: [],
      };
    }
    const defaultCode = countryCodesMap[defaultCountryProp] || "+92";
    const phones = (contact.phones || []).map((p) => {
      if (p.countryCode) return p;
      const parsed = parsePhoneNumber(p.number, defaultCode);
      return {
        ...p,
        countryCode: parsed.countryCode,
        number: parsed.number,
      };
    });
    return {
      lifecycleStage: "Lead", rating: 3, relationships: [], activities: [],
      ...contact,
      phones,
    };
  });


  const [saving,      setSaving]      = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errors,      setErrors]      = useState<string[]>([]);
  const { toast } = useToast();

  const defaultCountry  = prefs.defaultCountry  || defaultCountryProp;
  const defaultCity     = prefs.defaultCity     || defaultCityProp;
  const defaultProvince = prefs.defaultProvince || defaultProvinceProp;

  const completeness = useMemo(() => calculateProfileHealth(data), [data]);
  const visibleTabs  = ALL_TABS.filter((t) => t.alwaysOn || enabledTabIds.has(t.id));

  const tabCount = (id: string): number => {
    const key = TAB_DATA_KEY[id];
    if (!key) return 0;
    const list = data[key];
    return Array.isArray(list) ? list.length : 0;
  };

  const handleChange = useCallback((d: Partial<Contact>) => {
    setErrors([]);
    setData(d);
  }, []);

  const handleSave = useCallback(async () => {
    const validationErrors = validate(data);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      toast({ title: "Please fix the following errors", description: validationErrors[0], variant: "destructive" });
      if (validationErrors.some((e) => e.startsWith("First name")))   setTab("basic");
      else if (validationErrors.some((e) => e.startsWith("Phone")))   setTab("phones");
      else if (validationErrors.some((e) => e.startsWith("Email")))   setTab("emails");
      else if (validationErrors.some((e) => e.includes("address")))   setTab("addresses");
      else if (validationErrors.some((e) => e.includes("emergency"))) setTab("emergency");
      return;
    }

    const toTitleCase = (str: string | undefined): string => {
      if (!str) return "";
      return str.replace(/\b\w/g, (c) => c.toUpperCase());
    };

    setErrors([]);
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    const firstName = toTitleCase(data.firstName?.trim());
    const lastName  = toTitleCase(data.lastName?.trim());
    
    const contactToSave: Contact = {
      ...data,
      id: data.id ?? `temp-${Date.now()}`,
      firstName,
      lastName,
      name: [firstName, lastName].filter(Boolean).join(" "),
      updatedAt: new Date().toISOString().slice(0, 10),
      createdAt: data.createdAt || new Date().toISOString().slice(0, 10),
    } as Contact;

    onSave(contactToSave);
    setSaveSuccess(true);
    toast({
      title: contact ? "Contact updated" : "Contact created",
      description: `${data.name || data.firstName || "Contact"} was saved successfully.`,
    });
    setTimeout(() => {
      setSaveSuccess(false);
      setSaving(false);
    }, 600);
  }, [data, onSave, contact, toast, validate]);

  const completenessColor = completeness >= 80 ? "bg-emerald-500" : completeness >= 50 ? "bg-amber-500" : "bg-red-400";
  const completenessText  = completeness >= 80 ? "text-emerald-600" : completeness >= 50 ? "text-amber-600" : "text-red-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col z-10"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-foreground">{contact ? "Edit Contact" : "Add New Contact"}</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground" aria-label="Close form">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Progress</span>
              <span className={`text-[11px] font-bold ${completenessText}`}>{completeness}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${completenessColor}`} style={{ width: `${completeness}%` }} />
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border overflow-x-auto flex-shrink-0 px-1 bg-muted/20">
          {visibleTabs.map((t) => (
            <TabButton
              key={t.id}
              t={t}
              active={tab === t.id}
              required={!t.alwaysOn && requiredTabIds.has(t.id)}
              count={tabCount(t.id)}
              onClick={() => setTab(t.id)}
            />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.13 }}>
              {tab === "basic"     && <BasicTab     data={data} onChange={handleChange} />}
              {tab === "phones"    && <PhoneTab     data={data} onChange={handleChange} required={requiredTabIds.has("phones")}    tabFieldCfg={tabFieldConfig.phones}    defaultCountry={defaultCountry} customFields={tabCustomFields.phones} />}
              {tab === "emails"    && <EmailTab     data={data} onChange={handleChange} required={requiredTabIds.has("emails")}    tabFieldCfg={tabFieldConfig.emails}    customFields={tabCustomFields.emails} />}
              {tab === "addresses" && <AddressTab   data={data} onChange={handleChange} required={requiredTabIds.has("addresses")} tabFieldCfg={tabFieldConfig.addresses} defaultCountry={defaultCountry} defaultCity={defaultCity} defaultProvince={defaultProvince} customFields={tabCustomFields.addresses} />}
              {tab === "socials"   && <SocialTab    data={data} onChange={handleChange} required={requiredTabIds.has("socials")}   tabFieldCfg={tabFieldConfig.socials}   customFields={tabCustomFields.socials} />}
              {tab === "emergency" && <EmergencyTab data={data} onChange={handleChange} required={requiredTabIds.has("emergency")} tabFieldCfg={tabFieldConfig.emergency} allContacts={allContacts} customFields={tabCustomFields.emergency} />}
              {tab === "relationships" && <RelationshipsTab data={data} onChange={handleChange} allContacts={allContacts} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Error summary */}
        {errors.length > 0 && (
          <div className="px-6 py-3 border-t border-red-200 bg-red-50 flex-shrink-0">
            <ul className="space-y-0.5">
              {errors.map((e, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-shrink-0 bg-muted/10">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {data.firstName
              ? <span><span className="font-semibold text-foreground">{data.name || data.firstName}</span> · {data.phones?.length || 0} phone(s), {data.emails?.length || 0} email(s)</span>
              : <span className="text-amber-600">First name is required to save</span>}
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving || !data.firstName?.trim()}
              type="button"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-center"
            >
              {saveSuccess ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                : saving  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                :           <><Save className="w-4 h-4" /> Save Contact</>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
