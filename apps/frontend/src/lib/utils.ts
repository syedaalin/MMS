import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges CSS class names using clsx and tailwind-merge.
 * @param inputs - List of class values to merge.
 * @returns The merged class string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export const isIframe: boolean = window.self !== window.top;

// Title Case converter — skips short prepositions/conjunctions
const LOWERCASE_WORDS = new Set([
  "a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "by", "in", "of", "up", "as", "so", "yet"
]);

/**
 * Converts a string to Title Case, keeping minor words lowercase unless they are the first word.
 * @param str - The string to convert.
 * @returns The title-cased string, or the original value if it is not a string.
 */
export function toTitleCase(str: unknown): unknown {
  if (typeof str !== "string") return str;
  return str
    .trim()
    .split(/\s+/)
    .map((word, i) => {
      if (i === 0 || !LOWERCASE_WORDS.has(word.toLowerCase())) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(" ");
}

// Apply Title Case to specific text fields in a contact object
const TEXT_FIELDS_TO_TITLE_CASE = [
  "name", "firstName", "lastName", "preferredName", "fatherName", "grandfatherName", "familyName",
  "nationality", "religion", "ethnicity", "languages", "occupation", "employer", "industry",
  "designation", "relationship", "city", "state", "country",
];

/**
 * Formats specified text fields in a contact object to Title Case.
 * @param contact - The contact object.
 * @returns A new contact object with title-cased fields.
 */
export function applyTitleCaseToContact(contact: Record<string, unknown>): Record<string, unknown> {
  const result = { ...contact };
  TEXT_FIELDS_TO_TITLE_CASE.forEach((field) => {
    const val = result[field];
    if (typeof val === "string" && val.trim()) {
      result[field] = toTitleCase(val);
    }
  });
  return result;
}

/**
 * Converts a hex color code to a space-separated HSL values string
 * compatible with Tailwind CSS custom properties (e.g. "160 84% 22%").
 *
 * @param {string} hex - The hex color string (e.g. "#047857" or "047857").
 * @returns {string} HSL values as "H S% L%" string.
 */
export function hexToTailwindHsl(hex: string): string {
  let h = hex.replace(/^#/, "");
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hVal = 0;
  let sVal = 0;
  const lVal = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    sVal = lVal > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hVal = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hVal = (b - r) / d + 2; break;
      case b: hVal = (r - g) / d + 4; break;
    }
    hVal /= 6;
  }

  const hDeg = Math.round(hVal * 360);
  const sPct = Math.round(sVal * 100);
  const lPct = Math.round(lVal * 100);

  return `${hDeg} ${sPct}% ${lPct}%`;
}
