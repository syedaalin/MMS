/**
 * ContactConfigContext
 * Global React Context that broadcasts contact field configuration
 * and preferences to all consumers in real-time without page refresh.
 *
 * Usage:
 *   const { fieldConfig, prefs, updateConfig, updatePrefs } = useContactConfig();
 *   const columns = useContactColumns();         // dynamic table columns
 *   const schema  = useContactValidation();     // dynamic Zod-like validation
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { z } from "zod";
import { loadFieldConfig, saveFieldConfig } from "./contactFieldsStore";
import {

  GENDERS,
  SOCIAL_PLATFORMS,
  RELATIONSHIPS,
  COUNTRY_CODES,
  LIFECYCLE_STAGES,
  FieldConfig,
  ContactPreferences,
  FieldDefinition,
  Contact,
  WhatsAppTemplate,
  DEFAULT_LIFECYCLE_COLORS,
  DEFAULT_WHATSAPP_TEMPLATES,
  DEFAULT_UI_STRINGS,
  getContactUiStrings,
  ColumnRegistryEntry,
  COLOR_PALETTES,
} from "@mms/shared";
import { getCollection, saveCollection, getObject, saveObject } from "./db";
import useGlobalSettings from "@/hooks/useGlobalSettings";

/**
 * Calculates the completeness / health percentage of a contact profile (0-100).
 *
 * Scoring breakdown (total = 100):
 * - Name (first or composite):      15
 * - Last name present:               5
 * - Gender specified:                5
 * - Date of birth:                   5
 * - Avatar photo:                   10
 * - Primary phone:                  10
 * - Primary email:                  10
 * - Address:                         5
 * - Lifecycle stage set (non-Lead):  5
 * - Social link:                     5
 * - CRM Relationship:               10
 * - Rating (> 0):                    5
 * - Notes present:                   5
 * - Attachments present:             5
 *
 * @param {Partial<Contact>} c - The contact object.
 * @returns {number} Completion score capped at 100.
 */
export function calculateProfileHealth(c: Partial<Contact>): number {
  let score = 0;

  // Name: use firstName or fall back to the composite name field (+15)
  const hasName = c.firstName?.trim() || c.name?.trim();
  if (hasName) score += 15;

  // Last name: bonus for having a surname (+5)
  if (c.lastName?.trim()) score += 5;

  // Gender (+5)
  if (c.gender) score += 5;

  // Date of birth (+5)
  if (c.dob) score += 5;

  // Avatar / profile photo (+10)
  if (c.avatar) score += 10;

  // Primary phone (+10)
  const hasPhone = (c.phones || []).length > 0 || !!(c.phone as string | undefined)?.trim();
  if (hasPhone) score += 10;

  // Primary email (+10)
  const hasEmail = (c.emails || []).length > 0 || !!(c.email as string | undefined)?.trim();
  if (hasEmail) score += 10;

  // Address (+5)
  if ((c.addresses || []).length > 0) score += 5;

  // Lifecycle stage set (any non-empty value) (+5)
  if (c.lifecycleStage && c.lifecycleStage !== "Lead") score += 5;

  // Social link (+5)
  if ((c.socials || []).length > 0) score += 5;

  // CRM relationship (+10)
  if ((c.relationships || []).length > 0) score += 10;

  // Rating explicitly set and > 0 (+5)
  if (c.rating && c.rating > 0) score += 5;

  // Notes (+5)
  if (c.notes?.trim()) score += 5;

  // Attachments (+5)
  if ((c.attachments || []).length > 0) score += 5;

  return Math.min(score, 100);
}

// List/collection form tabs → the Contact array property they populate.
const LIST_TAB_DATA_KEYS: Record<string, string> = {
  phones: "phones",
  emails: "emails",
  addresses: "addresses",
  socials: "socials",
  emergency: "emergencyContacts",
};

// Field types that have no meaningful "empty" state, so they don't count toward
// completeness (a `false` boolean is still a valid answer; AI summaries are read-only).
const COMPLETENESS_SKIP_TYPES = new Set(["boolean", "ai_summary"]);

/**
 * Returns true when a contact field value is considered "filled".
 *
 * @param {unknown} v - The value to test.
 * @returns {boolean}
 */
function hasFieldValue(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return !Number.isNaN(v);
  if (typeof v === "boolean") return v;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("url" in o) return Boolean(o.url);
    return Object.keys(o).length > 0;
  }
  return false;
}

/**
 * Calculates form completeness (0-100) driven entirely by the active field
 * configuration — only **enabled** fields inside **enabled** form tabs count.
 *
 * Scalar tabs (e.g. Identity/basic, custom tabs) contribute one unit per enabled
 * field; collection tabs (phones, emails, addresses, socials, emergency) count as
 * a single unit that is "filled" once they hold at least one entry. An empty new
 * contact therefore reports 0%, and the denominator tracks the configured fields
 * rather than a hardcoded list.
 *
 * @param {Partial<Contact>} c - The contact draft.
 * @param {FieldConfig} fieldConfig - The active contact field configuration.
 * @returns {number} Completion percentage (0-100).
 */
export function calculateProfileCompleteness(c: Partial<Contact>, fieldConfig: FieldConfig): number {
  const fields = fieldConfig.fields || {};
  const formTabs = (fieldConfig.formTabs || []).filter((t) => t.enabled || t.key === "basic");
  const rec = c as Record<string, unknown>;

  let total = 0;
  let filled = 0;

  for (const tab of formTabs) {
    const listKey = LIST_TAB_DATA_KEYS[tab.key];
    if (listKey) {
      total += 1;
      const arr = rec[listKey];
      if (Array.isArray(arr) && arr.length > 0) filled += 1;
      continue;
    }
    const tabFields = (fields[tab.key] || []).filter(
      (f) => f.enabled && !COMPLETENESS_SKIP_TYPES.has(f.type)
    );
    for (const f of tabFields) {
      total += 1;
      if (hasFieldValue(rec[f.key])) filled += 1;
    }
  }

  if (total === 0) return 0;
  return Math.round((filled / total) * 100);
}

/**
 * Helper to update options for a specific field inside configurations.
 */
function syncOptionsInConfig(cfg: FieldConfig, tabId: string, fieldKey: string, options: string[]): FieldConfig {
  const nextConfig = { ...cfg };
  if (nextConfig.fields?.[tabId]) {
    nextConfig.fields = {
      ...nextConfig.fields,
      [tabId]: nextConfig.fields[tabId].map((f) =>
        f.key === fieldKey ? { ...f, options } : f
      ),
    };
  }
  return nextConfig;
}

// ── Storage keys ─────────────────────────────────────────────────────────────
const PREFS_KEY = "mms_contact_prefs";
const CONFIG_KEY = "mms_contact_field_config";
const VISIBLE_COLUMNS_KEY = "mms_visible_columns_v1";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Loads the contact preferences from localStorage, falling back to empty object.
 *
 * @returns {Partial<ContactPreferences>} The parsed preferences.
 */
function loadPrefs(): Partial<ContactPreferences> {
  try {
    let raw = localStorage.getItem(PREFS_KEY);
    if (!raw) {
      const legacy = localStorage.getItem("madrasa_contact_prefs");
      if (legacy) {
        raw = legacy;
        localStorage.setItem(PREFS_KEY, legacy);
        try {
          localStorage.removeItem("madrasa_contact_prefs");
        } catch (err) {
          console.warn("[ContactConfigContext] Failed to remove legacy contact prefs key:", err);
        }
      }
    }
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const DEFAULT_PREFS: ContactPreferences = {
  defaultCountry: "",
  defaultProvince: "",
  defaultCity: "",
  defaultViewLayout: "list",
  duplicateDetectionThresholdHigh: 90,
  duplicateDetectionThresholdMedium: 75,
  duplicateDetectionColorHigh: COLOR_PALETTES.red.bg,
  duplicateDetectionColorMedium: COLOR_PALETTES.amber.bg,
  duplicateDetectionColorLow: COLOR_PALETTES.slate.bg,
  duplicateDetectionScorePhoneEmail: 99,
  duplicateDetectionScoreNamePhone: 95,
  duplicateDetectionScoreNameEmail: 95,
  duplicateDetectionScorePhone: 80,
  duplicateDetectionScoreEmail: 80,
  duplicateDetectionScoreName: 75,
  duplicateDetectionScoreDefault: 70,
  duplicateDetectionFields: ["name", "phone", "email"],
  duplicateDetectionColorWarning: COLOR_PALETTES.amber.bg,
  duplicateDetectionColorWarningText: COLOR_PALETTES.amber.text,
  duplicateDetectionColorSuccess: COLOR_PALETTES.emerald.bg,
  duplicateDetectionColorSuccessText: COLOR_PALETTES.emerald.text,
  duplicateDetectionColorHighlight: COLOR_PALETTES.blue.bg,
};

// RFC-5321-compatible pattern: rejects consecutive dots, missing TLD, and
// multiple @ signs while remaining practical for real-world addresses.
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

// ── Context Interface ─────────────────────────────────────────────────────────
export interface ContactConfigContextType {
  fieldConfig: FieldConfig;
  prefs: ContactPreferences;
  updateConfig: (cfg: FieldConfig) => void;
  updatePrefs: (newPrefs: Partial<ContactPreferences>) => void;

  enabledTabIds: Set<string>;
  requiredTabIds: Set<string>;
  fields: Record<string, FieldDefinition[]>;
  isTabFieldEnabled: (tabId: string, fieldId: string) => boolean;
  isTabFieldRequired: (tabId: string, fieldId: string) => boolean;
  defaultValueFor: (tabId: string, fieldId: string) => unknown;

  // Dynamic Collections
  genders: string[];
  socialPlatforms: string[];
  relationships: string[];
  lifecycleStages: string[];
  lifecycleColors: Record<string, { bg: string; text: string; border: string }>;
  whatsappTemplates: WhatsAppTemplate[];
  phoneLabels: string[];
  emailLabels: string[];
  addressLabels: string[];
  countryCodes: Array<{ country: string; code: string }>;

  // Derived Lookups
  countryCodesMap: Record<string, string>;

  // Dynamic Columns
  columnRegistry: ColumnRegistryEntry[];
  availableColumns: Array<{ id: string; label: string; sortField?: string }>;
  visibleColumns: Array<{ id: string; label: string; sortField?: string }>;

  // Mutators
  updateGenders: (val: string[]) => void;
  updateSocialPlatforms: (val: string[]) => void;
  updateRelationships: (val: string[]) => void;
  updateLifecycleStages: (val: string[]) => void;
  updateLifecycleColors: (val: Record<string, { bg: string; text: string; border: string }>) => void;
  updateWhatsappTemplates: (val: WhatsAppTemplate[]) => void;
  updatePhoneLabels: (val: string[]) => void;
  updateEmailLabels: (val: string[]) => void;
  updateAddressLabels: (val: string[]) => void;
  updateCountryCodes: (val: Array<{ country: string; code: string }>) => void;
  updateVisibleColumns: (cols: Array<{ id: string } | string>) => void;
  updateColumnRegistry: (cols: ColumnRegistryEntry[]) => void;
  updateUiStrings: (strings: Record<string, string>) => void;
  systemSortOptions: Array<{ field: string; label: string }>;
  defaultContactRating: number;
  uiStrings: Record<string, string>;
}

const ContactConfigContext = createContext<ContactConfigContextType | null>(null);

/**
 * Context Provider component that seeds and loads configuration arrays
 * from localStorage-backed database, synchronizing state in real-time.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Child elements.
 * @returns {React.JSX.Element}
 */
export function ContactConfigProvider({ children }: { children: ReactNode }) {
  const settings = useGlobalSettings();
  const [fieldConfig, setFieldConfigState] = useState<FieldConfig>(() => loadFieldConfig());
  const [prefs, setPrefsState] = useState<ContactPreferences>(() => ({
    ...DEFAULT_PREFS,
    ...loadPrefs(),
  }));

  // ── Dynamic Option Lists ────────────────────────────────────────────────────
  const [genders, setGendersState] = useState<string[]>(() =>
    getCollection("genders", GENDERS)
  );
  const [socialPlatforms, setSocialPlatformsState] = useState<string[]>(() =>
    getCollection("socialPlatforms", SOCIAL_PLATFORMS)
  );
  const [relationships, setRelationshipsState] = useState<string[]>(() =>
    getCollection("relationships", RELATIONSHIPS)
  );
  const [lifecycleStages, setLifecycleStagesState] = useState<string[]>(() =>
    getCollection("lifecycleStages", LIFECYCLE_STAGES)
  );
  const [lifecycleColors, setLifecycleColorsState] = useState<Record<string, { bg: string; text: string; border: string }>>(() =>
    getObject("lifecycleColors", DEFAULT_LIFECYCLE_COLORS)
  );
  const [whatsappTemplates, setWhatsappTemplatesState] = useState<WhatsAppTemplate[]>(() =>
    getCollection("whatsappTemplates", DEFAULT_WHATSAPP_TEMPLATES)
  );
  const [phoneLabels, setPhoneLabelsState] = useState<string[]>(() =>
    getCollection("phoneLabels", ["Mobile", "Home", "Work", "Other"])
  );
  const [emailLabels, setEmailLabelsState] = useState<string[]>(() =>
    getCollection("emailLabels", ["Personal", "Work", "Other"])
  );
  const [addressLabels, setAddressLabelsState] = useState<string[]>(() =>
    getCollection("addressLabels", ["Home", "Work", "Other"])
  );
  const [countryCodes, setCountryCodesState] = useState<Array<{ country: string; code: string }>>(() =>
    getCollection("countryCodes", COUNTRY_CODES)
  );

  // ── Dynamic Columns ─────────────────────────────────────────────────────────
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(() => {
    try {
      let raw = localStorage.getItem(VISIBLE_COLUMNS_KEY);
      if (!raw) {
        const legacy = localStorage.getItem("madrasa_visible_columns_v1");
        if (legacy) {
          raw = legacy;
          localStorage.setItem(VISIBLE_COLUMNS_KEY, legacy);
          try {
            localStorage.removeItem("madrasa_visible_columns_v1");
          } catch (err) {
            console.warn("[ContactConfigContext] Failed to remove legacy visible columns key:", err);
          }
        }
      }
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // ── Cross-tab sync via storage events ────────────────────────────────────
  useEffect(() => {
    /**
     * Safely parse a storage event's newValue, logging on failure.
     *
     * @param {StorageEvent} e - The storage event.
     * @param {string} label - Human-readable label for error messages.
     * @returns {unknown|null}
     */
    const safeParseEvent = (e: StorageEvent, label: string): unknown | null => {
      if (e.newValue === null) return null;
      try {
        return JSON.parse(e.newValue);
      } catch (err) {
        console.warn(`[ContactConfigContext] Failed to parse storage event for "${label}":`, err);
        return null;
      }
    };

    const handler = (e: StorageEvent) => {
      if (e.key === CONFIG_KEY) {
        const parsed = safeParseEvent(e, "fieldConfig");
        if (parsed) setFieldConfigState(parsed as FieldConfig);
      } else if (e.key === PREFS_KEY) {
        const parsed = safeParseEvent(e, "prefs");
        if (parsed) setPrefsState((p) => ({ ...DEFAULT_PREFS, ...p, ...(parsed as Partial<ContactPreferences>) }));
      } else if (e.key && e.key.startsWith("mms_")) {
        const subKey = e.key.replace("mms_", "");
        const parsed = safeParseEvent(e, subKey);
        if (parsed) {
          const COLLECTION_SETTERS: Record<string, (val: unknown) => void> = {
            genders: setGendersState as (val: unknown) => void,
            socialPlatforms: setSocialPlatformsState as (val: unknown) => void,
            relationships: setRelationshipsState as (val: unknown) => void,
            lifecycleStages: setLifecycleStagesState as (val: unknown) => void,
            lifecycleColors: setLifecycleColorsState as (val: unknown) => void,
            whatsappTemplates: setWhatsappTemplatesState as (val: unknown) => void,
            phoneLabels: setPhoneLabelsState as (val: unknown) => void,
            emailLabels: setEmailLabelsState as (val: unknown) => void,
            addressLabels: setAddressLabelsState as (val: unknown) => void,
            countryCodes: setCountryCodesState as (val: unknown) => void,
          };
          COLLECTION_SETTERS[subKey]?.(parsed);
        }
      } else if (e.key === VISIBLE_COLUMNS_KEY) {
        const parsed = safeParseEvent(e, "visibleColumnIds");
        if (Array.isArray(parsed)) {
          setVisibleColumnIds(parsed as string[]);
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // ── Mutators ──────────────────────────────────────────────────────────────
  const updateConfig = useCallback((cfg: FieldConfig) => {
    saveFieldConfig(cfg);
    setFieldConfigState(cfg);
  }, []);

  const updatePrefs = useCallback((newPrefs: Partial<ContactPreferences>) => {
    setPrefsState((prev) => {
      const merged = { ...prev, ...newPrefs };
      localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const updateGenders = useCallback((val: string[]) => {
    saveCollection("genders", val);
    setGendersState(val);
    setFieldConfigState((prev) => {
      const next = syncOptionsInConfig(prev, "basic", "gender", val);
      saveFieldConfig(next);
      return next;
    });
  }, []);
  const updateSocialPlatforms = useCallback((val: string[]) => {
    saveCollection("socialPlatforms", val);
    setSocialPlatformsState(val);
    setFieldConfigState((prev) => {
      const next = syncOptionsInConfig(prev, "socials", "platform", val);
      saveFieldConfig(next);
      return next;
    });
  }, []);
  const updateRelationships = useCallback((val: string[]) => {
    saveCollection("relationships", val);
    setRelationshipsState(val);
    setFieldConfigState((prev) => {
      const next = syncOptionsInConfig(prev, "emergency", "relationship", val);
      saveFieldConfig(next);
      return next;
    });
  }, []);
  const updateLifecycleStages = useCallback((val: string[]) => {
    saveCollection("lifecycleStages", val);
    setLifecycleStagesState(val);
    setFieldConfigState((prev) => {
      const next = syncOptionsInConfig(prev, "basic", "lifecycleStage", val);
      saveFieldConfig(next);
      return next;
    });
  }, []);
  const updateLifecycleColors = useCallback((val: Record<string, { bg: string; text: string; border: string }>) => {
    saveObject("lifecycleColors", val);
    setLifecycleColorsState(val);
  }, []);
  const updateWhatsappTemplates = useCallback((val: WhatsAppTemplate[]) => {
    saveCollection("whatsappTemplates", val);
    setWhatsappTemplatesState(val);
  }, []);
  const updatePhoneLabels = useCallback((val: string[]) => {
    saveCollection("phoneLabels", val);
    setPhoneLabelsState(val);
    setFieldConfigState((prev) => {
      const next = syncOptionsInConfig(prev, "phones", "label", val);
      saveFieldConfig(next);
      return next;
    });
  }, []);
  const updateEmailLabels = useCallback((val: string[]) => {
    saveCollection("emailLabels", val);
    setEmailLabelsState(val);
    setFieldConfigState((prev) => {
      const next = syncOptionsInConfig(prev, "emails", "label", val);
      saveFieldConfig(next);
      return next;
    });
  }, []);
  const updateAddressLabels = useCallback((val: string[]) => {
    saveCollection("addressLabels", val);
    setAddressLabelsState(val);
    setFieldConfigState((prev) => {
      const next = syncOptionsInConfig(prev, "addresses", "label", val);
      saveFieldConfig(next);
      return next;
    });
  }, []);
  const updateCountryCodes = useCallback((val: Array<{ country: string; code: string }>) => {
    saveCollection("countryCodes", val);
    setCountryCodesState(val);
  }, []);

  const updateVisibleColumns = useCallback((cols: Array<{ id: string } | string>) => {
    const ids = cols.map((c) => (typeof c === "string" ? c : c.id));
    setVisibleColumnIds(ids);
    try {
      localStorage.setItem(VISIBLE_COLUMNS_KEY, JSON.stringify(ids));
    } catch (err) {
      console.error("[ContactConfigContext] Failed to save visible columns to localStorage:", err);
    }
  }, []);

  const updateColumnRegistry = useCallback((cols: ColumnRegistryEntry[]) => {
    updateConfig({ ...fieldConfig, columnRegistry: cols });
  }, [fieldConfig, updateConfig]);

  const updateUiStrings = useCallback((strings: Record<string, string>) => {
    updateConfig({ ...fieldConfig, uiStrings: strings });
  }, [fieldConfig, updateConfig]);

  const enabledTabIds = useMemo(() => {
    if (fieldConfig.formTabs) {
      return new Set(fieldConfig.formTabs.filter(t => t.enabled).map(t => t.key));
    }
    return new Set(fieldConfig.enabledTabs || ["phones", "emails", "addresses", "socials", "emergency"]);
  }, [fieldConfig]);

  const requiredTabIds = useMemo(() => {
    return new Set(fieldConfig.requiredTabs || []);
  }, [fieldConfig]);

  const fields = useMemo(() => {
    return fieldConfig.fields || {};
  }, [fieldConfig]);

  const countryCodesMap = useMemo(() => {
    const map: Record<string, string> = {};
    countryCodes.forEach(({ country, code }) => {
      map[country] = code;
    });
    return map;
  }, [countryCodes]);

  const uiStrings = useMemo(() => {
    return getContactUiStrings(settings.language, fieldConfig.uiStrings);
  }, [settings.language, fieldConfig.uiStrings]);

  /**
   * Returns true if a specific field inside a tab is enabled.
   *
   * @param {string} tabId - Tab identifier.
   * @param {string} fieldId - Field identifier.
   * @returns {boolean}
   */
  const isTabFieldEnabled = useCallback(
    (tabId: string, fieldId: string) => {
      const field = (fields[tabId] || []).find((f) => f.key === fieldId);
      return field?.enabled ?? false;
    },
    [fields]
  );

  /**
   * Returns true if a specific field inside a tab is required.
   *
   * @param {string} tabId - Tab identifier.
   * @param {string} fieldId - Field identifier.
   * @returns {boolean}
   */
  const isTabFieldRequired = useCallback(
    (tabId: string, fieldId: string) => {
      const field = (fields[tabId] || []).find((f) => f.key === fieldId);
      return field?.required ?? false;
    },
    [fields]
  );

  const defaultValueFor = useCallback((tabId: string, fieldId: string) => {
    const field = (fields[tabId] || []).find((f) => f.key === fieldId);
    return field?.defaultValue;
  }, [fields]);

  const columnRegistry = useMemo(() => {
    const registry = [...(fieldConfig.columnRegistry || [])];
    
    // Find all active fields across all enabled tabs in the registry
    const activeFields: Array<{ tabId: string; field: FieldDefinition }> = [];
    Object.entries(fields).forEach(([tabId, tabFields]) => {
      const tabEnabled = tabId === "basic" || enabledTabIds.has(tabId);
      if (tabEnabled) {
        (tabFields || []).forEach((f) => {
          if (f.enabled) {
            activeFields.push({ tabId, field: f });
          }
        });
      }
    });

    // 1. Filter out columns from registry that don't match active tabs/fields
    const filteredRegistry = registry.filter((c) => {
      if (c.key === "name") {
        return isTabFieldEnabled("basic", "firstName");
      }
      if (c.key === "profileHealth") {
        return true;
      }
      if (c.key === "phone") {
        return enabledTabIds.has("phones") && isTabFieldEnabled("phones", "number");
      }
      if (c.key === "whatsapp") {
        return enabledTabIds.has("phones") && isTabFieldEnabled("phones", "whatsapp");
      }
      if (c.key === "email") {
        return enabledTabIds.has("emails") && isTabFieldEnabled("emails", "address");
      }
      if (c.key === "city") {
        return enabledTabIds.has("addresses") && isTabFieldEnabled("addresses", "city");
      }
      if (c.key === "state") {
        return enabledTabIds.has("addresses") && isTabFieldEnabled("addresses", "state");
      }
      if (c.key === "country") {
        return enabledTabIds.has("addresses") && isTabFieldEnabled("addresses", "country");
      }
      if (c.key === "line1") {
        return enabledTabIds.has("addresses") && isTabFieldEnabled("addresses", "line1");
      }
      if (c.key === "gender") {
        return isTabFieldEnabled("basic", "gender");
      }
      if (c.key === "dob") {
        return isTabFieldEnabled("basic", "dob");
      }
      if (c.key === "lifecycleStage") {
        return isTabFieldEnabled("basic", "lifecycleStage");
      }
      if (c.key === "rating") {
        return isTabFieldEnabled("basic", "rating");
      }
      if (c.key === "isSyed") {
        return isTabFieldEnabled("basic", "isSyed");
      }
      if (c.key === "socials_platform") {
        return enabledTabIds.has("socials") && isTabFieldEnabled("socials", "platform");
      }
      if (c.key === "socials_url") {
        return enabledTabIds.has("socials") && isTabFieldEnabled("socials", "url");
      }
      if (c.key === "emergency_contact") {
        return enabledTabIds.has("emergency") && isTabFieldEnabled("emergency", "contactId");
      }
      if (c.key === "emergency_relationship") {
        return enabledTabIds.has("emergency") && isTabFieldEnabled("emergency", "relationship");
      }

      // Check if the field is defined and enabled in active fields
      return activeFields.some((af) => af.field.key === c.key);
    });

    // 2. Add columns for any active fields that aren't in the registry yet
    const existingKeys = new Set(filteredRegistry.map((c) => c.key));
    const specialKeys = new Set([
      "firstName", "lastName", "avatar", "number", "address", "line1", "city",
      "state", "country", "label", "platform", "url", "contactId", "relationship"
    ]);

    activeFields.forEach((af) => {
      const fieldKey = af.field.key;
      if (!specialKeys.has(fieldKey) && !existingKeys.has(fieldKey)) {
        const maxOrder = filteredRegistry.reduce((max, c) => Math.max(max, c.order), -1);
        filteredRegistry.push({
          key: fieldKey,
          label: af.field.label,
          enabled: false,
          order: maxOrder + 1,
          sortable: true
        });
      }
    });

    return filteredRegistry;
  }, [fieldConfig.columnRegistry, fields, enabledTabIds, isTabFieldEnabled]);

  const availableColumns = useMemo(() => {
    return columnRegistry.map(c => ({ id: c.key, label: c.label, sortField: c.sortField }));
  }, [columnRegistry]);

  const visibleColumns = useMemo(() => {
    return columnRegistry
      .filter(c => c.enabled)
      .sort((a, b) => a.order - b.order)
      .map(c => ({ id: c.key, label: c.label, sortField: c.sortField }));
  }, [columnRegistry]);

  const systemSortOptions = useMemo<Array<{ field: string; label: string }>>(() => [
    { field: "createdAt", label: uiStrings.dateAdded || "Date Added" },
    { field: "updatedAt", label: uiStrings.lastUpdated || "Last Updated" },
  ], [uiStrings]);

  const defaultContactRating = fieldConfig.defaultRating ?? 3;



  return (
    <ContactConfigContext.Provider
      value={{
        fieldConfig,
        prefs,
        updateConfig,
        updatePrefs,

        enabledTabIds,
        requiredTabIds,
        fields,
        isTabFieldEnabled,
        isTabFieldRequired,
        defaultValueFor,

        // Dynamic Collections
        genders,
        socialPlatforms,
        relationships,
        lifecycleStages,
        lifecycleColors,
        whatsappTemplates,
        phoneLabels,
        emailLabels,
        addressLabels,
        countryCodes,

        // Derived Lookups
        countryCodesMap,

        // Dynamic Columns
        columnRegistry,
        availableColumns,
        visibleColumns,

        // Mutators
        updateGenders,
        updateSocialPlatforms,
        updateRelationships,
        updateLifecycleStages,
        updateLifecycleColors,
        updateWhatsappTemplates,
        updatePhoneLabels,
        updateEmailLabels,
        updateAddressLabels,
        updateCountryCodes,
        updateVisibleColumns,
        updateColumnRegistry,
        updateUiStrings,
        systemSortOptions,
        defaultContactRating,
        uiStrings,
      }}
    >
      {children}
    </ContactConfigContext.Provider>
  );
}

/**
 * Hook to consume the ContactConfigContext.
 *
 * @returns {ContactConfigContextType} The configuration context value.
 */
export function useContactConfig(): ContactConfigContextType {
  const ctx = useContext(ContactConfigContext);
  if (!ctx) throw new Error("useContactConfig must be used inside <ContactConfigProvider>");
  return ctx;
}

// ── Dynamic column builder hook ───────────────────────────────────────────────
/**
 * Returns the ordered list of table columns that should be visible,
 * derived entirely from the current fieldConfig.
 *
 * @returns {Array<{ id: string; label: string; sortField?: string }>} The array of active column descriptors.
 */
export function useContactColumns(): Array<{ id: string; label: string; sortField?: string }> {
  return useContactConfig().visibleColumns;
}

// ── Dynamic validation schema helpers ────────────────────────────────────────────

/**
 * Returns true if a specific field inside a tab is required.
 * Helper for buildDynamicContactSchema to avoid calling context hook functions.
 *
 * @param {FieldConfig} config - The active configuration.
 * @param {string} tabId - Tab ID.
 * @param {string} fieldId - Field ID.
 * @returns {boolean}
 */
function isTabFieldRequired(config: FieldConfig, tabId: string, fieldId: string): boolean {
  const field = (config.fields?.[tabId] || []).find((f) => f.key === fieldId);
  return field?.required ?? false;
}

/**
 * Compiles a dynamic custom field validation schema based on custom field configuration parameters.
 *
 * @param {CustomField} cf - The custom field configuration.
 * @returns {z.ZodTypeAny} The compiled Zod validator.
 */
export function buildCustomFieldSchema(cf: FieldDefinition): z.ZodTypeAny {
  let baseSchema: z.ZodTypeAny;

  switch (cf.type) {
    case "text":
    case "textarea": {
      let s = z.string();
      if (cf.minLength !== undefined) {
        s = s.min(cf.minLength, `${cf.label} must be at least ${cf.minLength} characters.`);
      }
      if (cf.maxLength !== undefined) {
        s = s.max(cf.maxLength, `${cf.label} must be at most ${cf.maxLength} characters.`);
      }
      baseSchema = s;
      break;
    }
    case "number": {
      let n = z.coerce.number({
        message: `${cf.label} must be a number.`,
      });
      if (cf.min !== undefined) {
        n = n.min(cf.min, `${cf.label} must be at least ${cf.min}.`);
      }
      if (cf.max !== undefined) {
        n = n.max(cf.max, `${cf.label} must be at most ${cf.max}.`);
      }
      baseSchema = n;
      break;
    }
    case "email": {
      baseSchema = z.string().regex(EMAIL_RE, {
        message: "isNotValidEmail",
      });
      break;
    }
    case "url": {
      baseSchema = z.string().url(`${cf.label} is not a valid URL.`);
      break;
    }
    case "date": {
      baseSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: `${cf.label} is not a valid date.`,
      });
      break;
    }
    case "select": {
      if (cf.options && cf.options.length > 0) {
        baseSchema = z.string().refine((val) => cf.options!.includes(val), {
          message: `${cf.label} must be one of the allowed options.`,
        });
      } else {
        baseSchema = z.string();
      }
      break;
    }
    case "multiselect": {
      if (cf.options && cf.options.length > 0) {
        baseSchema = z.array(z.string()).refine((vals) => vals.every(v => cf.options!.includes(v)), {
          message: `${cf.label} contains invalid options.`,
        });
      } else {
        baseSchema = z.array(z.string());
      }
      break;
    }
    case "tags": {
      baseSchema = z.union([z.array(z.string()), z.string()]);
      break;
    }
    case "boolean": {
      baseSchema = z.coerce.boolean();
      break;
    }
    case "file": {
      baseSchema = z.union([
        z.string(),
        z.object({
          name: z.string(),
          url: z.string(),
          size: z.number().optional(),
          type: z.string().optional()
        })
      ]);
      break;
    }
    case "location": {
      baseSchema = z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional()
      });
      break;
    }
    case "ai_summary": {
      baseSchema = z.string().optional();
      break;
    }
    default: {
      baseSchema = z.unknown();
    }
  }

  if (cf.required) {
    if (cf.type === "text" || cf.type === "textarea" || cf.type === "email" || cf.type === "url" || cf.type === "date" || cf.type === "select") {
      baseSchema = baseSchema.refine((val) => typeof val === "string" && val.trim() !== "", {
        message: `${cf.label} is required.`,
      });
    } else if (cf.type === "multiselect") {
      baseSchema = baseSchema.refine((val) => Array.isArray(val) && val.length > 0, {
        message: `${cf.label} is required.`,
      });
    } else if (cf.type === "number") {
      baseSchema = baseSchema.refine((val) => val !== null && val !== undefined && !isNaN(val as number), {
        message: `${cf.label} is required.`,
      });
    } else if (cf.type === "boolean") {
      baseSchema = baseSchema.refine((val) => val === true, {
        message: `${cf.label} is required.`,
      });
    } else if (cf.type === "tags") {
      baseSchema = baseSchema.refine((val) => {
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === "string") return val.trim() !== "";
        return false;
      }, {
        message: `${cf.label} is required.`,
      });
    }
    return baseSchema;
  } else {
    // If not required, preprocess empty values to undefined to bypass checks
    return z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) {
        return undefined;
      }
      return val;
    }, baseSchema.optional());
  }
}

/**
 * Compiles a comprehensive Zod validation schema representing dynamic contact checks.
 *
 * @param {FieldConfig} config - The active field configuration.
 * @param {Set<string>} enabledTabIds - Set of currently enabled tabs.
 * @param {Set<string>} requiredTabIds - Set of currently required tabs.
 * @returns {z.ZodTypeAny} The compiled contact validation schema.
 */
export function buildDynamicContactSchema(
  config: FieldConfig,
  enabledTabIds: Set<string>,
  requiredTabIds: Set<string>,
  fields: Record<string, FieldDefinition[]>
): z.ZodTypeAny {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  // Standard top-level metadata fields
  schemaObject.id = z.union([z.string(), z.number()]).optional();

  schemaObject.relationships = z.array(z.object({
    contactId: z.union([z.string(), z.number()]),
    type: z.string()
  })).optional().nullable();

  schemaObject.activities = z.array(z.object({
    id: z.string(),
    type: z.enum(["note", "stage_change", "whatsapp", "email", "system", "task", "call"]),
    content: z.string(),
    date: z.string(),
    by: z.string().optional()
  })).optional().nullable();

  schemaObject.attachments = z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    size: z.number(),
    url: z.string(),
    date: z.string()
  })).optional().nullable();

  // 1. Basic Fields on 'basic' tab (top-level properties of Contact)
  const basicFields = (fields.basic || []).filter((f) => f.enabled);
  basicFields.forEach((field) => {
    schemaObject[field.key] = buildCustomFieldSchema(field);
  });

  // 2. List Tabs (nested array properties of Contact)
  const listTabsMapping: Record<string, string> = {
    phones: "phones",
    emails: "emails",
    addresses: "addresses",
    socials: "socials",
    emergency: "emergencyContacts",
  };

  const uiStrings = {
    ...DEFAULT_UI_STRINGS,
    ...(config.uiStrings || {}),
  };

  Object.entries(listTabsMapping).forEach(([tabId, propKey]) => {
    if (!enabledTabIds.has(tabId)) {
      return;
    }
    const tabFields = (fields[tabId] || []).filter((f) => f.enabled);
    
    // Build Zod object schema for the items in the list dynamically
    const itemSchemaObject: Record<string, z.ZodTypeAny> = {};
    tabFields.forEach((field) => {
      itemSchemaObject[field.key] = buildCustomFieldSchema(field);
    });
    
    const itemSchema = z.object(itemSchemaObject);
    
    let arraySchema: z.ZodTypeAny = z.array(itemSchema).optional().nullable();
    if (requiredTabIds.has(tabId)) {
      const label = uiStrings[`atLeastOne${tabId.charAt(0).toUpperCase() + tabId.slice(1)}Required`] || `At least one entry is required.`;
      arraySchema = z.array(itemSchema).min(1, label);
    }
    schemaObject[propKey] = arraySchema;
  });

  return z.object(schemaObject).passthrough();
}

export interface ValidationError {
  fieldId: string;
  tabId: string;
  message: string;
}

/**
 * Translates Zod validation errors into a human-readable list of structured error objects.
 *
 * @param {z.ZodError} error - The Zod validation error.
 * @param {unknown} data - The input data being validated.
 * @param {Record<string, CustomField[]>} tabCustomFields - Custom fields by tab to map top-level errors.
 * @returns {ValidationError[]} An array of validation errors.
 */
export function formatZodIssues(error: z.ZodError, data: unknown, fields: Record<string, FieldDefinition[]>): ValidationError[] {
  const errors: ValidationError[] = [];
  error.issues.forEach((issue) => {
    const path = issue.path;
    const message = issue.message;

    const listTabKeys = ["phones", "emails", "addresses", "socials", "emergencyContacts"];
    if (listTabKeys.includes(path[0] as string) && typeof path[1] === "number") {
      const arrayName = path[0] as string;
      const idx = path[1];
      const fieldId = path[2] as string;
      
      const tabIdMap: Record<string, string> = {
        phones: "phones",
        emails: "emails",
        addresses: "addresses",
        socials: "socials",
        emergencyContacts: "emergency",
      };
      const prefixMap: Record<string, string> = {
        phones: "Phone",
        emails: "Email",
        addresses: "Address",
        socials: "Social Link",
        emergencyContacts: "Emergency Contact",
      };
      
      const tabId = tabIdMap[arrayName];
      const prefix = prefixMap[arrayName];
      
      errors.push({
        fieldId,
        tabId,
        message: `${prefix} #${idx + 1}: ${message}`,
      });
    } else {
      const fieldId = path[0] as string;
      let tabId = "basic";
      
      for (const [tId, tabFields] of Object.entries(fields)) {
        if (tabFields.some(f => f.key === fieldId)) {
          tabId = tId;
          break;
        }
      }
      
      errors.push({ fieldId, tabId, message });
    }
  });
  return errors;
}

/**
 * Hook to perform dynamic contact validation against the active field configuration.
 *
 * @returns {(data: unknown) => ValidationError[]} A function that takes contact data and returns an array of validation errors.
 */
export function useContactValidation() {
  const { fieldConfig, enabledTabIds, requiredTabIds, fields } = useContactConfig();

  return useCallback(
    (data: unknown): ValidationError[] => {
      const schema = buildDynamicContactSchema(fieldConfig, enabledTabIds, requiredTabIds, fields);
      const result = schema.safeParse(data);
      if (result.success) {
        return [];
      }
      return formatZodIssues(result.error, data, fields);
    },
    [fieldConfig, enabledTabIds, requiredTabIds, fields]
  );
}
