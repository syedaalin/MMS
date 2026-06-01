import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, UserPlus, ChevronRight, ChevronLeft, Check,
  Eye, EyeOff, Info, Mail, Lock, User, Phone,
  ShieldCheck, AlertCircle, Loader2, CalendarClock, Search
} from "lucide-react";
import { DEFAULT_ROLES, type Role, type SystemUser } from "../../lib/usersData";
import { toTitleCase } from "../../lib/utils";
import { CONTACTS } from "../../lib/contactsData";
import type { Contact } from "../../lib/contactFields";
import { getObject, getCollection } from "../../lib/db";
import {
  DEFAULT_USERS_SETTINGS,
  DEFAULT_USERS_FIELD_DEFS,
  getSortedFields,
} from "@mms/shared";
import { DatePicker } from "../ui/DatePicker";

// ── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Select Contact", icon: User },
  { id: 2, label: "Roles",          icon: ShieldCheck },
  { id: 3, label: "Account Setup",  icon: Lock },
];

const DEPARTMENTS = [
  "Hifz Department", "Alim Course", "Nazra Department",
  "Arabic Language", "Islamic Studies", "Administration", "Finance"
];

const CLASSES = [
  "Hifz A", "Hifz B", "Alim Year 1", "Alim Year 2",
  "Nazra Morning", "Nazra Evening", "Arabic Beginners"
];

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter",  test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number",            test: (p: string) => /\d/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

interface PasswordStrengthInfo {
  level: "Weak" | "Fair" | "Good" | "Strong";
  color: string;
  width: string;
}

/**
 * Evaluates the strength of a password based on policy rules.
 *
 * @param pwd - The password string to evaluate.
 * @returns Password strength metadata.
 */
function passwordStrength(pwd: string): PasswordStrengthInfo {
  const passed = PASSWORD_RULES.filter((r) => r.test(pwd)).length;
  if (passed <= 1) return { level: "Weak",   color: "bg-red-400",    width: "25%" };
  if (passed === 2) return { level: "Fair",   color: "bg-amber-400",  width: "50%" };
  if (passed === 3) return { level: "Good",   color: "bg-blue-400",   width: "75%" };
  return               { level: "Strong", color: "bg-emerald-500", width: "100%" };
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface StepIndicatorProps {
  step: number;
}

/**
 * Steps path/progress indicator bar.
 *
 * @param props - Indicator properties.
 * @returns The step progress indicator element.
 */
function StepIndicator({ step }: StepIndicatorProps): JSX.Element {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((s, i) => {
        const done    = step > s.id;
        const active  = step === s.id;
        const Icon    = s.icon;
        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done   ? "bg-primary border-primary text-primary-foreground" :
                active ? "border-primary bg-primary/10 text-primary" :
                         "border-border bg-muted text-muted-foreground"
               }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? "text-primary" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 mx-1 transition-all ${step > s.id ? "bg-primary" : "bg-border"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

interface FieldErrorProps {
  msg?: string;
}

/**
 * Small error message helper for form inputs.
 *
 * @param props - Error descriptor.
 * @returns The error message layout or null.
 */
function FieldError({ msg }: FieldErrorProps): JSX.Element | null {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-[11px] text-red-600 font-medium mt-1">
      <AlertCircle className="w-3 h-3" /> {msg}
    </p>
  );
}

interface LabelProps {
  children: React.ReactNode;
  required?: boolean;
}

/**
 * Standard form label helper.
 *
 * @param props - Label contents and options.
 * @returns The label element.
 */
function Label({ children, required = false }: LabelProps): JSX.Element {
  return (
    <label className="text-xs font-semibold text-foreground block mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Customized text input field wrapper.
 *
 * @param props - Input options and HTML attributes.
 * @returns The styled input field.
 */
function Input({ icon: Icon, className = "", ...props }: InputProps): JSX.Element {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />}
      <input
        {...props}
        className={`w-full text-sm rounded-xl border border-border bg-background py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
          Icon ? "pl-9 pr-3" : "px-3"
        } ${className}`}
      />
    </div>
  );
}

interface RoleCardProps {
  role: Role;
  selected: boolean;
  onToggle: (id: string) => void;
}

/**
 * Component card displaying role metadata and toggle status.
 *
 * @param props - Role card options.
 * @returns The role card element.
 */
function RoleCard({ role, selected, onToggle }: RoleCardProps): JSX.Element {
  const [showPerms, setShowPerms] = useState(false);

  return (
    <div className={`rounded-xl border-2 transition-all cursor-pointer ${
      selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
    }`}>
      <div className="p-3 flex items-start gap-3" onClick={() => onToggle(role.id)}>
        <div className={`w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          selected ? "bg-primary border-primary" : "border-border"
        }`}>
          {selected && <Check className="w-2.5 h-2.5 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${role.color}`}>
              {role.name}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowPerms((v) => !v); }}
              className="text-[10px] text-primary font-semibold flex items-center gap-0.5 hover:underline"
            >
              <Info className="w-3 h-3" /> {showPerms ? "Hide" : "Permissions"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
        </div>
      </div>

      <AnimatePresence>
        {showPerms && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-border">
            <div className="p-3 grid grid-cols-2 gap-1">
              {Object.entries(role.permissions || {}).map(([mod, perms]) => (
                <div key={mod} className="text-[10px] text-muted-foreground">
                  <span className="font-semibold text-foreground capitalize">{mod}:</span>{" "}
                  {perms.join(", ")}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Form State ────────────────────────────────────────────────────────────────

interface AddUserFormState {
  contactId: string | number | null;
  name: string;
  email: string;
  phone: string;
  roles: string[];
  status: string;
  department: string;
  classes: string[];
  temporaryRole: boolean;
  roleExpiry: string;
  setupMethod: "invite" | "password";
  password?: string;
  forceReset: boolean;
  twoFactorEnabled: boolean;
}

// ── Steps ────────────────────────────────────────────────────────────────────

interface Step1Props {
  form: AddUserFormState;
  setForm: React.Dispatch<React.SetStateAction<AddUserFormState>>;
  errors: Record<string, string>;
  existingEmails: string[];
}

/**
 * Step 1: Select Contact screen.
 *
 * @param props - Sub-form state.
 * @returns Contact selector section.
 */
function Step1({ form, setForm, errors, existingEmails }: Step1Props): JSX.Element {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  // Use live contacts collection — stays in sync with ContactForm additions
  const contacts = useMemo(() => getCollection<Contact>("contacts", CONTACTS), []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contacts.filter((c) => {
      const emailVal = (c.email as string | undefined) || c.emails?.[0]?.address || "";
      const phoneVal = (c.phone as string | undefined) || c.phones?.[0]?.number || "";
      return (
        c.name.toLowerCase().includes(q) ||
        emailVal.toLowerCase().includes(q) ||
        phoneVal.includes(q)
      );
    }).slice(0, 8);
  }, [search, contacts]);

  const selected = form.contactId ? contacts.find((c) => String(c.id) === String(form.contactId)) : null;

  const selectContact = (c: Contact) => {
    const primaryEmail = c.emails?.[0]?.address || (c.email as string | undefined) || "";
    const primaryPhone = c.phones?.[0]?.number || (c.phone as string | undefined) || "";
    setForm((f) => ({
      ...f,
      contactId: c.id,
      name: c.name,
      email: primaryEmail,
      phone: primaryPhone,
    }));
    setSearch("");
    setOpen(false);
  };

  const clear = () => {
    setForm((f) => ({ ...f, contactId: null, name: "", email: "", phone: "" }));
    setSearch("");
  };

  return (
    <div className="space-y-4">
      <div>
        <Label required>Search Contact</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={selected ? selected.name : search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); if (selected) clear(); }}
            onFocus={() => setOpen(true)}
            placeholder="Search by name, email or phone…"
            className="w-full text-sm rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {selected && (
            <button type="button" onClick={clear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <FieldError msg={errors.contactId} />

        <AnimatePresence>
          {open && !selected && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="mt-1 rounded-xl border border-border bg-background shadow-lg overflow-hidden z-10 relative">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">No contacts found.</p>
              ) : (
                <ul className="max-h-48 overflow-y-auto divide-y divide-border">
                  {filtered.map((c) => {
                    const email = c.emails?.[0]?.address || (c.email as string | undefined) || "";
                    const phone = c.phones?.[0]?.number || (c.phone as string | undefined) || "";
                    const alreadyUser = existingEmails.includes(email.toLowerCase());
                    const avatarInitials = c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                    const tagVal = c.tag as string | undefined;
                    return (
                      <li key={c.id}>
                        <button type="button" disabled={alreadyUser}
                          onClick={() => selectContact(c)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${alreadyUser ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"}`}>
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">{avatarInitials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{email || phone}</p>
                          </div>
                          {tagVal && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border whitespace-nowrap">{tagVal}</span>}
                          {alreadyUser && <span className="text-[10px] text-muted-foreground">Already a user</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected contact preview */}
      {selected && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">{selected.name.split(" ").map((w) => w[0]).join("").slice(0,2).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{selected.name}</p>
              <p className="text-[11px] text-muted-foreground">{form.email}</p>
            </div>
            {(selected.tag as string | undefined) && <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">{selected.tag as string}</span>}
          </div>
          {form.phone && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> {form.phone}
            </p>
          )}
        </motion.div>
      )}

      {/* Status */}
      <div>
        <Label>Status</Label>
        <div className="flex gap-2">
          {["active", "inactive", "pending"].map((s) => (
            <button key={s} type="button" onClick={() => setForm((f) => ({ ...f, status: s }))}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border capitalize transition-all ${
                form.status === s
                  ? s === "active"   ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                  : s === "inactive" ? "bg-muted border-border text-foreground"
                  :                   "bg-amber-100 border-amber-300 text-amber-700"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface Step2Props {
  form: AddUserFormState;
  setForm: React.Dispatch<React.SetStateAction<AddUserFormState>>;
  errors: Record<string, string>;
}

/**
 * Step 2: Role Assignment screen.
 *
 * @param props - Sub-form state.
 * @returns Role configuration section.
 */
function Step2({ form, setForm, errors }: Step2Props): JSX.Element {
  const toggleRole = (id: string) =>
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(id) ? f.roles.filter((r) => r !== id) : [...f.roles, id],
    }));

  const isTeacher = form.roles.includes("teacher") || form.roles.includes("assistant_teacher");

  const settings = getObject("users_settings", DEFAULT_USERS_SETTINGS);
  const customFields = settings.customFields || [];
  const fieldOrder = settings.fieldOrder || DEFAULT_USERS_SETTINGS.fieldOrder || [];
  const fields = settings.fields || DEFAULT_USERS_SETTINGS.fields || {};

  const orderedFields = getSortedFields(
    DEFAULT_USERS_FIELD_DEFS,
    fieldOrder,
    fields,
    customFields
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {DEFAULT_ROLES.map((role) => (
          <RoleCard key={role.id} role={role} selected={form.roles.includes(role.id)} onToggle={toggleRole} />
        ))}
      </div>
      <FieldError msg={errors.roles} />

      {/* Advanced: department + classes (show if teacher role selected) */}
      <div>
        <Label>Department</Label>
        <select value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
          className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">— None —</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <AnimatePresence>
        {isTeacher && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Label>Assign Classes</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {CLASSES.map((cls) => {
                const active = (form.classes || []).includes(cls);
                return (
                  <button type="button" key={cls}
                    onClick={() => setForm((f) => ({
                      ...f,
                      classes: active ? (f.classes || []).filter((c) => c !== cls) : [...(f.classes || []), cls]
                    }))}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      active ? "bg-primary/10 border-primary text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}>
                    {cls}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Temporary role */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!form.temporaryRole}
            onChange={(e) => setForm((f) => ({ ...f, temporaryRole: e.target.checked, roleExpiry: "" }))}
            className="rounded" />
          <div className="flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Temporary role (set expiry date)</span>
          </div>
        </label>
        <AnimatePresence>
          {form.temporaryRole && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2">
              <DatePicker value={form.roleExpiry || ""}
                min={new Date().toISOString().split("T")[0]}
                onChange={(val) => setForm((f) => ({ ...f, roleExpiry: val }))}
                className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic custom fields */}
      {orderedFields.filter(f => f.isCustom).length > 0 && (
        <div className="space-y-3 pt-3 border-t border-border mt-3">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Additional Attributes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {orderedFields.filter(f => f.isCustom).map((field) => {
              const value = (form as any)[field.id] ?? "";
              const upd = (val: any) => setForm((f) => ({ ...f, [field.id]: val }));
              return (
                <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <Label required={field.required}>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <textarea
                      className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]"
                      value={value as string}
                      onChange={(e) => upd(e.target.value)}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                      required={field.required}
                    />
                  ) : field.type === "select" ? (
                    <select
                      className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      value={value as string}
                      onChange={(e) => upd(e.target.value)}
                      required={field.required}
                    >
                      <option value="">Select option…</option>
                      {field.options?.map((opt: string) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "boolean" ? (
                    <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => upd(e.target.checked)}
                        className="w-4 h-4 rounded border border-border accent-primary cursor-pointer"
                      />
                      <span className="text-xs font-medium text-foreground">{field.label}</span>
                    </label>
                  ) : field.type === "number" ? (
                    <input
                      type="number"
                      className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={value}
                      onChange={(e) => upd(e.target.value)}
                      placeholder={field.placeholder || `Enter number…`}
                      required={field.required}
                    />
                  ) : field.type === "date" ? (
                    <DatePicker
                      value={value as string}
                      onChange={(val) => upd(val)}
                      required={field.required}
                    />
                  ) : (
                    <input
                      type="text"
                      className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={value as string}
                      onChange={(e) => upd(e.target.value)}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                      required={field.required}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface Step3Props {
  form: AddUserFormState;
  setForm: React.Dispatch<React.SetStateAction<AddUserFormState>>;
  errors: Record<string, string>;
}

/**
 * Step 3: Account Setup (Invite / Password) screen.
 *
 * @param props - Sub-form state.
 * @returns Account authentication settings section.
 */
function Step3({ form, setForm, errors }: Step3Props): JSX.Element {
  const [showPwd, setShowPwd] = useState(false);
  const strength = form.password ? passwordStrength(form.password) : null;

  return (
    <div className="space-y-4">
      {/* Account method toggle */}
      <div>
        <Label>Account Setup Method</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {[
            { id: "invite", label: "Send Invite Email", icon: Mail, desc: "User sets password via secure link" },
            { id: "password", label: "Set Password Now", icon: Lock, desc: "Create with temporary password" },
          ].map((opt) => {
            const Icon = opt.icon;
            const active = form.setupMethod === opt.id;
            return (
              <button type="button" key={opt.id} onClick={() => setForm((f) => ({ ...f, setupMethod: opt.id as "invite" | "password" }))}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-[11px] font-bold ${active ? "text-primary" : "text-foreground"}`}>{opt.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {form.setupMethod === "invite" && (
          <motion.div key="invite" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-800">Invitation Email</span>
            </div>
            <p className="text-xs text-blue-700">
              A secure invitation link will be sent to <span className="font-bold">{form.email || "the user"}</span>.
              The link expires in <span className="font-bold">48 hours</span>.
            </p>
            <p className="text-[10px] text-blue-600">User will be created with <strong>Pending</strong> status until they accept the invite.</p>
          </motion.div>
        )}

        {form.setupMethod === "password" && (
          <motion.div key="password" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div>
              <Label required>Temporary Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Min 8 chars, upper, number, symbol"
                  value={form.password || ""}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full text-sm rounded-xl border border-border bg-background py-2.5 pl-9 pr-9 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <FieldError msg={errors.password} />

              {/* Strength meter */}
              {form.password && strength && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden mr-2">
                      <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.width }} />
                    </div>
                    <span className={`text-[10px] font-bold ${
                      strength.level === "Weak" ? "text-red-500" :
                      strength.level === "Fair" ? "text-amber-500" :
                      strength.level === "Good" ? "text-blue-500" : "text-emerald-600"
                    }`}>{strength.level}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {PASSWORD_RULES.map((r) => (
                      <p key={r.label} className={`text-[10px] flex items-center gap-1 ${r.test(form.password || "") ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {r.test(form.password || "") ? <Check className="w-2.5 h-2.5" /> : <span className="w-2.5 h-2.5 border border-current rounded-full inline-block" />}
                        {r.label}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.forceReset !== false}
                onChange={(e) => setForm((f) => ({ ...f, forceReset: e.target.checked }))}
                className="rounded" />
              <span className="text-xs font-medium text-foreground">Force password reset on first login</span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2FA option */}
      <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
        <input type="checkbox" checked={!!form.twoFactorEnabled}
          onChange={(e) => setForm((f) => ({ ...f, twoFactorEnabled: e.target.checked }))}
          className="rounded" />
        <div>
          <span className="text-xs font-semibold text-foreground">Enable Two-Factor Authentication</span>
          <p className="text-[10px] text-muted-foreground">Require 2FA on every login for extra security</p>
        </div>
      </label>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export interface AddUserModalProps {
  onClose: () => void;
  onAdd: (user: SystemUser) => void;
  existingEmails?: string[];
}

/**
 * AddUserModal component renders a multi-step registration modal to create a new user.
 *
 * @param props - AddUserModal properties.
 * @returns The modal dialog element.
 */
export default function AddUserModal({ onClose, onAdd, existingEmails = [] }: AddUserModalProps): JSX.Element {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<AddUserFormState>({
    contactId: null, name: "", email: "", phone: "",
    roles: [], status: "active",
    department: "", classes: [],
    temporaryRole: false, roleExpiry: "",
    setupMethod: "invite",
    password: "", forceReset: true,
    twoFactorEnabled: false,
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!form.contactId) e.contactId = "Please select a contact from the list.";
      else if (!form.email.trim()) e.contactId = "Selected contact has no email address.";
      else if (existingEmails.includes(form.email.toLowerCase())) e.contactId = "This contact is already a user.";
    }
    if (step === 2) {
      if (form.roles.length === 0) e.roles = "Please assign at least one role.";
      
      const settings = getObject("users_settings", DEFAULT_USERS_SETTINGS);
      const customFields = settings.customFields || [];
      for (const cf of customFields) {
        if (cf.required) {
          const val = (form as any)[cf.id];
          if (val === undefined || val === null || val === "") {
            e.roles = `Field "${cf.label}" is required.`;
          }
        }
      }
    }
    if (step === 3 && form.setupMethod === "password") {
      if (!form.password) e.password = "Password is required.";
      else if (PASSWORD_RULES.filter((r) => r.test(form.password || "")).length < 3)
        e.password = "Password is too weak. Use uppercase, number & symbol.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = (): void => {
    if (!validate()) return;
    setStep((s) => s + 1);
  };

  const handleBack = (): void => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validate()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900)); // simulate async
    const settings = getObject("users_settings", DEFAULT_USERS_SETTINGS);
    const customFields = settings.customFields || [];
    const newUser: SystemUser = {
      id: `u${Date.now()}`,
      name: toTitleCase(form.name.trim()) as string,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      roles: form.roles,
      status: (form.setupMethod === "invite" ? "inactive" : form.status) as SystemUser["status"], // Note: mapping 'pending' status
      twoFactorEnabled: form.twoFactorEnabled,
      lastLogin: "",
      createdDate: new Date().toISOString().split("T")[0],
      failedLoginAttempts: 0,
      activeSessions: 0,
      avatarInitials: form.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      ...Object.fromEntries(
        customFields.map((cf) => [cf.id, (form as any)[cf.id] ?? cf.defaultValue ?? ""])
      ),
    };
    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => {
      onAdd(newUser);
      onClose();
    }, 1600);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>

      <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Add New User</p>
              <p className="text-[11px] text-muted-foreground">Invite or create a user with role assignment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-10 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">User Created Successfully!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {form.setupMethod === "invite"
                    ? `An invitation has been sent to ${form.email}`
                    : `${form.name} can now log in with the temporary password`}
                </p>
              </div>
            </motion.div>
          ) : (
            <>
              <StepIndicator step={step} />
              <AnimatePresence mode="wait">
                <motion.div key={step}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
                  {step === 1 && <Step1 form={form} setForm={setForm} errors={errors} existingEmails={existingEmails} />}
                  {step === 2 && <Step2 form={form} setForm={setForm} errors={errors} />}
                  {step === 3 && <Step3 form={form} setForm={setForm} errors={errors} />}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-between p-5 border-t border-border flex-shrink-0 gap-2">
            <button onClick={step === 1 ? onClose : handleBack}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
              {step === 1 ? <X className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              {step === 1 ? "Cancel" : "Back"}
            </button>

            <div className="flex items-center gap-1.5">
              {STEPS.map((s) => (
                <div key={s.id} className={`w-1.5 h-1.5 rounded-full transition-all ${step === s.id ? "bg-primary w-3" : step > s.id ? "bg-primary/40" : "bg-border"}`} />
              ))}
            </div>

            {step < 3 ? (
              <button onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                {submitting ? "Creating…" : "Create User"}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
