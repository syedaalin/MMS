/**
 * Centralized Contact Constants & Utilities
 * UI assets, icon mappings, and helper functions.
 * All field definitions and selection options are in contactFields.ts (single source of truth)
 */

import type { FieldConfig, Contact } from "./contactFields";

export {
  GENDERS, SOCIAL_PLATFORMS, RELATIONSHIPS
} from "./contactFields";

// ── Icons & symbols for UI ─────────────────────────────────────────────────────
export const COMM_ICONS: Record<string, string> = {
  whatsapp: "💬",
  phone: "📞",
  email: "📧",
  sms: "✉️",
};

export const GENDER_ICON: Record<string, string> = {
  male: "♂",
  female: "♀",
  other: "⚧",
};

export const AVATAR_COLORS: readonly string[] = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

// ── Utility functions ──────────────────────────────────────────────────────

/**
 * Check if a field is enabled in fieldConfig
 * @param fieldConfig - Field configuration object
 * @param fieldId - Field ID to check (e.g., 'tag')
 * @returns True if field is enabled, false otherwise.
 */
export function isFieldEnabled(fieldConfig: FieldConfig | null | undefined, fieldId: string): boolean {
  return (fieldConfig?.tabFieldConfig?.basic?.enabled || []).includes(fieldId);
}

/**
 * Get avatar color by contact ID
 * @param id - Contact ID
 * @returns CSS color class
 */
export function getAvatarColor(id: number | string): string {
  const numericId = typeof id === "number"
    ? id
    : String(id).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[numericId % AVATAR_COLORS.length];
}

/**
 * Get initials from name
 * @param name - Contact name
 * @param length - Number of initials (default: 2)
 * @returns Initials string
 */
export function getInitials(name: string | null | undefined, length = 2): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, length)
    .toUpperCase() || "?";
}

/**
 * Extract country code and local number parts from a raw phone number.
 * @param rawNumber - Raw phone number string
 * @param defaultCode - Fallback country code if none detected
 * @returns Object with countryCode and local number parts.
 */
export function parsePhoneNumber(rawNumber: unknown, defaultCode = "+92"): { countryCode: string; number: string } {
  if (!rawNumber) return { countryCode: defaultCode, number: "" };
  const clean = String(rawNumber).trim();
  const match = clean.match(/^(\+\d{1,4})(?:\s+(.*)|(.*))$/);
  if (match) {
    const code = match[1];
    const rest = (match[2] || match[3] || "").trim();
    return { countryCode: code, number: rest };
  }
  return { countryCode: defaultCode, number: clean };
}

/**
 * Extract primary phone from contact
 * @param contact - Contact object
 * @returns The formatted primary phone number or null.
 */
export function getPrimaryPhone(contact: Partial<Contact>): string | null {
  const p = (contact.phones || [])[0] || (contact.phone ? { number: contact.phone as string } : null);
  if (!p) return null;
  const code = p.countryCode ? p.countryCode.trim() : "";
  const num = p.number ? p.number.trim() : "";
  if (!code) return num || null;
  if (num.startsWith("+") || num.startsWith(code)) return num;
  return `${code} ${num}`.trim() || null;
}

/**
 * Extract primary email from contact
 * @param contact - Contact object
 * @returns Primary email address or null.
 */
export function getPrimaryEmail(contact: Partial<Contact>): string | null {
  return (contact.emails || [])[0]?.address || (contact.email as string) || null;
}

/**
 * Build display name with Syed/Syeda prefix if applicable
 * Does NOT modify the stored name, only formats for display
 * @param contact - Contact object
 * @returns Formatted display name
 */
export function getDisplayName(contact: Partial<Contact>): string {
  const baseName = contact.name || contact.firstName || "";
  if (!baseName || !contact.isSyed) return baseName;
  
  const prefix = contact.gender === "male" ? "Syed " : contact.gender === "female" ? "Syeda " : "";
  return prefix ? `${prefix}${baseName}` : baseName;
}

/**
 * Check if contact has WhatsApp enabled
 * @param contact - Contact object
 * @returns True if WhatsApp enabled, false otherwise.
 */
export function hasWhatsApp(contact: Partial<Contact>): boolean {
  return (contact.phones || []).some((p) => p.whatsapp);
}

/**
 * Get color classes for a tag
 * @param tag - Tag name
 * @param mode - UI mode (e.g. 'kanban')
 * @returns Object with header and badge classes
 */
export function getTagColor(tag: string, mode?: "kanban" | "badge"): { header: string; badge: string } {
  const hash = tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorSchemes = [
    { header: "border-emerald-200 bg-emerald-50/50 text-emerald-800", badge: "bg-emerald-100 text-emerald-800" },
    { header: "border-blue-200 bg-blue-50/50 text-blue-800", badge: "bg-blue-100 text-blue-800" },
    { header: "border-violet-200 bg-violet-50/50 text-violet-800", badge: "bg-violet-100 text-violet-800" },
    { header: "border-amber-200 bg-amber-50/50 text-amber-800", badge: "bg-amber-100 text-amber-800" },
    { header: "border-rose-200 bg-rose-50/50 text-rose-800", badge: "bg-rose-100 text-rose-800" },
    { header: "border-cyan-200 bg-cyan-50/50 text-cyan-800", badge: "bg-cyan-100 text-cyan-800" },
  ];
  return colorSchemes[hash % colorSchemes.length];
}

