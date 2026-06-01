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
  TAB_FIELD_DEFINITIONS,
  GENDERS,
  SOCIAL_PLATFORMS,
  RELATIONSHIPS,
  COUNTRY_CODES,
  LIFECYCLE_STAGES,
  FieldConfig,
  ContactPreferences,
  TabFieldConfig,
  CustomField,
  Contact,
  PersonaConfig,
} from "./contactFields";
import { getCollection, saveCollection } from "./db";

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
  defaultCountry: "Pakistan",
  defaultProvince: "Sindh",
  defaultCity: "Karachi",
  defaultViewLayout: "list",
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
  
  // Persona Management
  activePersonaId: string | null;
  setActivePersonaId: (id: string | null) => void;
  getPersona: (id: string) => PersonaConfig | undefined;

  enabledTabIds: Set<string>;
  requiredTabIds: Set<string>;
  tabFieldConfig: Record<string, TabFieldConfig>;
  tabCustomFields: Record<string, CustomField[]>;
  isTabFieldEnabled: (tabId: string, fieldId: string) => boolean;
  isTabFieldRequired: (tabId: string, fieldId: string) => boolean;

  // Dynamic Collections
  genders: string[];
  socialPlatforms: string[];
  relationships: string[];
  lifecycleStages: string[];
  phoneLabels: string[];
  emailLabels: string[];
  addressLabels: string[];
  countryCodes: Array<{ country: string; code: string }>;

  // Derived Lookups
  countryCodesMap: Record<string, string>;

  // Dynamic Columns
  availableColumns: Array<{ id: string; label: string; sortField?: string }>;
  visibleColumns: Array<{ id: string; label: string; sortField?: string }>;

  // Mutators
  updateGenders: (val: string[]) => void;
  updateSocialPlatforms: (val: string[]) => void;
  updateRelationships: (val: string[]) => void;
  updateLifecycleStages: (val: string[]) => void;
  updatePhoneLabels: (val: string[]) => void;
  updateEmailLabels: (val: string[]) => void;
  updateAddressLabels: (val: string[]) => void;
  updateCountryCodes: (val: Array<{ country: string; code: string }>) => void;
  updateVisibleColumns: (cols: Array<{ id: string } | string>) => void;
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
  const [fieldConfig, setFieldConfigState] = useState<FieldConfig>(() => loadFieldConfig());
  const [prefs, setPrefsState] = useState<ContactPreferences>(() => ({
    ...DEFAULT_PREFS,
    ...loadPrefs(),
  }));
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);

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
  }, []);
  const updateSocialPlatforms = useCallback((val: string[]) => {
    saveCollection("socialPlatforms", val);
    setSocialPlatformsState(val);
  }, []);
  const updateRelationships = useCallback((val: string[]) => {
    saveCollection("relationships", val);
    setRelationshipsState(val);
  }, []);
  const updateLifecycleStages = useCallback((val: string[]) => {
    saveCollection("lifecycleStages", val);
    setLifecycleStagesState(val);
  }, []);
  const updatePhoneLabels = useCallback((val: string[]) => {
    saveCollection("phoneLabels", val);
    setPhoneLabelsState(val);
  }, []);
  const updateEmailLabels = useCallback((val: string[]) => {
    saveCollection("emailLabels", val);
    setEmailLabelsState(val);
  }, []);
  const updateAddressLabels = useCallback((val: string[]) => {
    saveCollection("addressLabels", val);
    setAddressLabelsState(val);
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

  const getPersona = useCallback((id: string) => {
    return fieldConfig.personas?.find(p => p.id === id);
  }, [fieldConfig]);

  // ── Derived helpers ───────────────────────────────────────────────────────
  const activePersona = useMemo(() => {
    if (!activePersonaId) return null;
    return fieldConfig.personas?.find(p => p.id === activePersonaId);
  }, [fieldConfig, activePersonaId]);

  const enabledTabIds = useMemo(() => {
    if (activePersona) return new Set(activePersona.enabledTabs);
    return new Set(fieldConfig.enabledTabs || ["phones", "emails", "addresses", "socials", "emergency"]);
  }, [fieldConfig, activePersona]);

  const requiredTabIds = useMemo(() => {
    if (activePersona) return new Set(activePersona.requiredTabs);
    return new Set(fieldConfig.requiredTabs || []);
  }, [fieldConfig, activePersona]);

  const tabFieldConfig = useMemo(() => {
    if (activePersona) return activePersona.tabFieldConfig || {};
    return fieldConfig.tabFieldConfig || {};
  }, [fieldConfig, activePersona]);

  const tabCustomFields = useMemo(() => {
    if (activePersona) return activePersona.tabCustomFields || {};
    return fieldConfig.tabCustomFields || {};
  }, [fieldConfig, activePersona]);

  const countryCodesMap = useMemo(() => {
    const map: Record<string, string> = {};
    countryCodes.forEach(({ country, code }) => {
      map[country] = code;
    });
    return map;
  }, [countryCodes]);

  const availableColumns = useMemo(() => {
    const basicEnabled = new Set(fieldConfig.tabFieldConfig?.basic?.enabled || []);
    const basicOrder =
      fieldConfig.tabFieldConfig?.basic?.order ||
      TAB_FIELD_DEFINITIONS.basic?.map((f) => f.id) ||
      [];
    const addrEnabled = new Set(fieldConfig.tabFieldConfig?.addresses?.enabled || []);
    const addrOrder =
      fieldConfig.tabFieldConfig?.addresses?.order ||
      TAB_FIELD_DEFINITIONS.addresses?.map((f) => f.id) ||
      [];
    const enabledTabs = new Set(
      fieldConfig.enabledTabs || ["phones", "emails", "addresses", "socials", "emergency"]
    );

    const cols: Array<{ id: string; label: string; sortField?: string }> = [];

    // 1. Name is always first and fixed
    cols.push({ id: "name", label: "Name", sortField: "name" });
    cols.push({ id: "profileHealth", label: "Profile Health", sortField: "profileHealth" });

    // 2. Basic-tab core fields in saved order if enabled
    const BASIC_COL_MAP: Record<string, { id: string; label: string; sortField?: string }> = {
      gender: { id: "gender", label: "Gender", sortField: "gender" },
      dob: { id: "dob", label: "Date of Birth", sortField: "dob" },
      isSyed: { id: "isSyed", label: "Is Syed" },
      lifecycleStage: { id: "lifecycleStage", label: "Lifecycle Stage", sortField: "lifecycleStage" },
      rating: { id: "rating", label: "Rating", sortField: "rating" },
    };

    basicOrder.forEach((fieldId) => {
      const col = BASIC_COL_MAP[fieldId];
      if (!col) return;
      const def = TAB_FIELD_DEFINITIONS.basic?.find((f) => f.id === fieldId);
      if (def?.alwaysOn || basicEnabled.has(fieldId)) {
        cols.push(col);
      }
    });

    // 3. Custom fields on basic tab
    const basicCustom = tabCustomFields.basic || [];
    basicCustom.forEach((cf) => {
      cols.push({ id: cf.id, label: cf.label });
    });

    // 4. Phone — phones tab is alwaysOn
    const phonesEnabled = new Set(fieldConfig.tabFieldConfig?.phones?.enabled || ["number", "whatsapp"]);
    if (phonesEnabled.has("number")) {
      cols.push({ id: "phone", label: "Phone" });
    }
    if (phonesEnabled.has("whatsapp")) {
      cols.push({ id: "whatsapp", label: "WhatsApp" });
    }

    // Custom fields on phones tab
    const phonesCustom = tabCustomFields.phones || [];
    phonesCustom.forEach((cf) => {
      cols.push({ id: cf.id, label: cf.label });
    });

    // 5. Email (if emails tab enabled)
    if (enabledTabs.has("emails")) {
      const emailsEnabled = new Set(fieldConfig.tabFieldConfig?.emails?.enabled || ["address"]);
      if (emailsEnabled.has("address")) {
        cols.push({ id: "email", label: "Email" });
      }
      const emailsCustom = tabCustomFields.emails || [];
      emailsCustom.forEach((cf) => {
        cols.push({ id: cf.id, label: cf.label });
      });
    }

    // 6. Address fields (line1, city, state, country) in saved order
    if (enabledTabs.has("addresses")) {
      const addrFieldDefs = TAB_FIELD_DEFINITIONS.addresses || [];
      const ADDR_COL_MAP: Record<string, { id: string; label: string; sortField?: string }> = {
        line1: { id: "line1", label: "Street Address" },
        city: { id: "city", label: "City", sortField: "city" },
        state: { id: "state", label: "Province" },
        country: { id: "country", label: "Country" },
      };

      addrOrder.forEach((fieldId) => {
        const col = ADDR_COL_MAP[fieldId];
        if (!col) return;
        const def = addrFieldDefs.find((f) => f.id === fieldId);
        if (def?.alwaysOn || addrEnabled.has(fieldId)) {
          cols.push(col);
        }
      });

      // Custom fields on addresses tab
      const addressesCustom = tabCustomFields.addresses || [];
      addressesCustom.forEach((cf) => {
        cols.push({ id: cf.id, label: cf.label });
      });
    }

    // 7. Socials platform and url (if socials tab enabled)
    if (enabledTabs.has("socials")) {
      const socialsEnabled = new Set(fieldConfig.tabFieldConfig?.socials?.enabled || ["platform", "url"]);
      const socialsOrder = fieldConfig.tabFieldConfig?.socials?.order || ["platform", "url"];
      const SOCIAL_COL_MAP: Record<string, { id: string; label: string }> = {
        platform: { id: "socials_platform", label: "Social Platform" },
        url: { id: "socials_url", label: "Social URL" },
      };

      socialsOrder.forEach((fieldId) => {
        const col = SOCIAL_COL_MAP[fieldId];
        if (!col) return;
        if (socialsEnabled.has(fieldId)) {
          cols.push(col);
        }
      });

      const socialsCustom = tabCustomFields.socials || [];
      socialsCustom.forEach((cf) => {
        cols.push({ id: cf.id, label: cf.label });
      });
    }

    // 8. Emergency contact and relationship (if emergency tab enabled)
    if (enabledTabs.has("emergency")) {
      const emergencyEnabled = new Set(fieldConfig.tabFieldConfig?.emergency?.enabled || ["contactId", "relationship"]);
      const emergencyOrder = fieldConfig.tabFieldConfig?.emergency?.order || ["contactId", "relationship"];
      const EMERGENCY_COL_MAP: Record<string, { id: string; label: string }> = {
        contactId: { id: "emergency_contact", label: "Emergency Contact" },
        relationship: { id: "emergency_relationship", label: "Emergency Relationship" },
      };

      emergencyOrder.forEach((fieldId) => {
        const col = EMERGENCY_COL_MAP[fieldId];
        if (!col) return;
        if (emergencyEnabled.has(fieldId)) {
          cols.push(col);
        }
      });

      const emergencyCustom = tabCustomFields.emergency || [];
      emergencyCustom.forEach((cf) => {
        cols.push({ id: cf.id, label: cf.label });
      });
    }

    return cols;
  }, [fieldConfig, tabCustomFields]);

  const visibleColumns = useMemo(() => {
    // Default visible columns: name, isSyed, phone, email, city (filtered by available)
    const defaultIds = ["name", "isSyed", "phone", "email", "city"];
    const idsToUse = visibleColumnIds.length > 0 ? visibleColumnIds : defaultIds;

    const availableMap = new Map(availableColumns.map((c) => [c.id, c]));
    const orderedCols: Array<{ id: string; label: string; sortField?: string }> = [];

    // Add 'name' first if available
    const nameCol = availableMap.get("name");
    if (nameCol) {
      orderedCols.push(nameCol);
    }

    // Add remaining columns from idsToUse that are actually available
    idsToUse.forEach((id) => {
      if (id === "name") return;
      const col = availableMap.get(id);
      if (col && !orderedCols.some((c) => c.id === id)) {
        orderedCols.push(col);
      }
    });

    return orderedCols;
  }, [visibleColumnIds, availableColumns]);

  /**
   * Returns true if a specific field inside a tab is enabled.
   * Fields with `alwaysOn: true` are always considered enabled.
   *
   * @param {string} tabId - Tab identifier.
   * @param {string} fieldId - Field identifier.
   * @returns {boolean}
   */
  const isTabFieldEnabled = useCallback(
    (tabId: string, fieldId: string) => {
      const def = (TAB_FIELD_DEFINITIONS[tabId] || []).find((f) => f.id === fieldId);
      if (def?.alwaysOn) return true;
      return (tabFieldConfig[tabId]?.enabled || []).includes(fieldId);
    },
    [tabFieldConfig]
  );

  /**
   * Returns true if a specific field inside a tab is required.
   * Uses the explicit `alwaysRequired` flag — decoupled from `alwaysOn`
   * so a field can be always visible but not always mandatory.
   *
   * @param {string} tabId - Tab identifier.
   * @param {string} fieldId - Field identifier.
   * @returns {boolean}
   */
  const isTabFieldRequired = useCallback(
    (tabId: string, fieldId: string) => {
      const def = (TAB_FIELD_DEFINITIONS[tabId] || []).find((f) => f.id === fieldId);
      if (def?.alwaysRequired) return true;
      return (tabFieldConfig[tabId]?.required || []).includes(fieldId);
    },
    [tabFieldConfig]
  );

  return (
    <ContactConfigContext.Provider
      value={{
        fieldConfig,
        prefs,
        updateConfig,
        updatePrefs,

        activePersonaId,
        setActivePersonaId,
        getPersona,

        enabledTabIds,
        requiredTabIds,
        tabFieldConfig,
        tabCustomFields,
        isTabFieldEnabled,
        isTabFieldRequired,

        // Dynamic Collections
        genders,
        socialPlatforms,
        relationships,
        lifecycleStages,
        phoneLabels,
        emailLabels,
        addressLabels,
        countryCodes,

        // Derived Lookups
        countryCodesMap,

        // Dynamic Columns
        availableColumns,
        visibleColumns,

        // Mutators
        updateGenders,
        updateSocialPlatforms,
        updateRelationships,
        updateLifecycleStages,
        updatePhoneLabels,
        updateEmailLabels,
        updateAddressLabels,
        updateCountryCodes,
        updateVisibleColumns,
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
  const def = (TAB_FIELD_DEFINITIONS[tabId] || []).find((f) => f.id === fieldId);
  if (def?.alwaysRequired) return true;
  return (config.tabFieldConfig?.[tabId]?.required || []).includes(fieldId);
}

/**
 * Compiles a dynamic custom field validation schema based on custom field configuration parameters.
 *
 * @param {CustomField} cf - The custom field configuration.
 * @returns {z.ZodTypeAny} The compiled Zod validator.
 */
export function buildCustomFieldSchema(cf: CustomField): z.ZodTypeAny {
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
      baseSchema = z.object({
        name: z.string(),
        url: z.string(),
        size: z.number().optional(),
        type: z.string().optional()
      });
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
  tabCustomFields: Record<string, CustomField[]>
): z.ZodTypeAny {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  // 1. Basic Fields on 'basic' tab
  // First name is always required
  schemaObject.firstName = z.string().refine((val) => val.trim() !== "", {
    message: "First name is required.",
  });

  schemaObject.personaId = z.string().optional().nullable();

  const basicFieldsToCheck = ["gender", "dob", "isSyed", "lastName", "avatar", "lifecycleStage", "rating"];
  basicFieldsToCheck.forEach((fieldId) => {
    const isRequired = isTabFieldRequired(config, "basic", fieldId);
    const def = (TAB_FIELD_DEFINITIONS.basic || []).find((f) => f.id === fieldId);
    const label = def?.label ?? (fieldId.charAt(0).toUpperCase() + fieldId.slice(1));

    let fieldSchema: z.ZodTypeAny;
    if (fieldId === "isSyed") {
      fieldSchema = z.boolean().optional().nullable();
      if (isRequired) {
        fieldSchema = fieldSchema.refine((val) => val === true, {
          message: `${label} is required.`,
        });
      }
    } else if (fieldId === "rating") {
      // Rating is numeric (1-5) or empty string (coerced)
      fieldSchema = z.preprocess((val) => {
        if (val === "" || val === null || val === undefined) return undefined;
        return Number(val);
      }, z.number().min(1).max(5).optional());
      if (isRequired) {
        fieldSchema = fieldSchema.refine((val) => val !== null && val !== undefined && !isNaN(Number(val)), {
          message: `${label} is required.`,
        });
      }
    } else {
      fieldSchema = z.string().optional().nullable();
      if (isRequired) {
        fieldSchema = fieldSchema.refine((val) => val !== null && val !== undefined && String(val).trim() !== "", {
          message: `${label} is required.`,
        });
      }
    }
    schemaObject[fieldId] = fieldSchema;
  });

  // CRM Relationships & Activities
  schemaObject.relationships = z.array(z.object({
    contactId: z.union([z.string(), z.number()]),
    type: z.string()
  })).optional().nullable();

  schemaObject.activities = z.array(z.object({
    id: z.string(),
    type: z.enum(["note", "stage_change", "whatsapp", "email", "system"]),
    content: z.string(),
    date: z.string(),
    by: z.string().optional()
  })).optional().nullable();

  // 2. Phone validation
  const phoneSchema = z.object({
    label: z.string().optional(),
    number: z.string().refine((val) => val.trim() !== "", {
      message: "number cannot be empty.",
    }),
    whatsapp: z.boolean().optional(),
    countryCode: z.string().optional(),
  });
  let phonesSchema: z.ZodTypeAny = z.array(phoneSchema).optional().nullable();
  if (requiredTabIds.has("phones")) {
    phonesSchema = z.array(phoneSchema).min(1, "At least one phone number is required.");
  }
  schemaObject.phones = phonesSchema;

  // 3. Email validation
  const emailSchema = z.object({
    label: z.string().optional(),
    address: z.string()
      .refine((val) => val.trim() !== "", {
        message: "address cannot be empty.",
      })
      .refine((val) => EMAIL_RE.test(val.trim()), {
        message: "isNotValidEmail",
      }),
  });
  let emailsSchema: z.ZodTypeAny = z.array(emailSchema).optional().nullable();
  if (requiredTabIds.has("emails")) {
    emailsSchema = z.array(emailSchema).min(1, "At least one email address is required.");
  }
  schemaObject.emails = emailsSchema;

  // 4. Address validation
  const addressSchema = z.object({
    line1: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
  });
  let addressesSchema: z.ZodTypeAny = z.array(addressSchema).optional().nullable();
  if (requiredTabIds.has("addresses")) {
    addressesSchema = z.array(addressSchema).min(1, "At least one address is required.");
  }
  schemaObject.addresses = addressesSchema;

  // 5. Emergency validation
  const emergencyContactSchema = z.object({
    name: z.string().optional().nullable(),
    relationship: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    contactId: z.union([z.string(), z.number()]).optional().nullable(),
  });
  let emergencySchema: z.ZodTypeAny = z.array(emergencyContactSchema).optional().nullable();
  if (requiredTabIds.has("emergency")) {
    emergencySchema = z.array(emergencyContactSchema).min(1, "At least one emergency contact is required.");
  }
  schemaObject.emergencyContacts = emergencySchema;

  // 6. Social link validation
  const socialLinkSchema = z.object({
    platform: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
  });
  let socialsSchema: z.ZodTypeAny = z.array(socialLinkSchema).optional().nullable();
  if (requiredTabIds.has("socials")) {
    socialsSchema = z.array(socialLinkSchema).min(1, "At least one social link is required.");
  }
  schemaObject.socials = socialsSchema;

  // 7. Custom fields
  const allCustomFields: CustomField[] = [];
  if (config.customFields) {
    allCustomFields.push(...config.customFields);
  }
  
  enabledTabIds.forEach((tabId) => {
    const fields = tabCustomFields[tabId] || [];
    fields.forEach((field) => {
      if (!allCustomFields.some((f) => f.id === field.id)) {
        allCustomFields.push(field);
      }
    });
  });

  // Attachments
  schemaObject.attachments = z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    size: z.number(),
    url: z.string(),
    date: z.string()
  })).optional().nullable();

  allCustomFields.forEach((cf) => {
    schemaObject[cf.id] = buildCustomFieldSchema(cf);
  });

  return z.object(schemaObject).passthrough();
}

/**
 * Translates Zod validation errors into a human-readable list of strings
 * that matches the format expected by the legacy form layout.
 *
 * @param {z.ZodError} error - The Zod validation error.
 * @param {unknown} data - The input data being validated.
 * @returns {string[]} An array of error strings.
 */
export function formatZodIssues(error: z.ZodError, data: unknown): string[] {
  const errors: string[] = [];
  error.issues.forEach((issue) => {
    const path = issue.path;
    const message = issue.message;

    // Handle nested phone entries
    if (path[0] === "phones" && typeof path[1] === "number") {
      const idx = path[1];
      const field = path[2];
      if (field === "number") {
        errors.push(`Phone #${idx + 1}: number cannot be empty.`);
      } else {
        errors.push(`Phone #${idx + 1}: ${message}`);
      }
    }
    // Handle nested email entries
    else if (path[0] === "emails" && typeof path[1] === "number") {
      const idx = path[1];
      const field = path[2];
      let val = "";
      if (data && typeof data === "object") {
        const emailsArr = (data as Record<string, unknown>).emails;
        if (Array.isArray(emailsArr) && emailsArr[idx]) {
          const emailObj = emailsArr[idx] as Record<string, unknown> | undefined;
          val = String(emailObj?.address || "");
        }
      }
      if (message === "isNotValidEmail") {
        errors.push(`Email #${idx + 1}: "${val}" is not a valid email address.`);
      } else if (field === "address" && message.includes("cannot be empty")) {
        errors.push(`Email #${idx + 1}: address cannot be empty.`);
      } else {
        errors.push(`Email #${idx + 1}: ${message}`);
      }
    }
    // Standard top-level errors (including custom fields)
    else {
      errors.push(message);
    }
  });
  return errors;
}

/**
 * Hook to perform dynamic contact validation against the active field configuration.
 *
 * @returns {(data: unknown) => string[]} A function that takes contact data and returns an array of error messages.
 */
export function useContactValidation() {
  const { fieldConfig, enabledTabIds, requiredTabIds, tabCustomFields } = useContactConfig();

  return useCallback(
    (data: unknown) => {
      const schema = buildDynamicContactSchema(fieldConfig, enabledTabIds, requiredTabIds, tabCustomFields);
      const result = schema.safeParse(data);
      if (result.success) {
        return [];
      }
      return formatZodIssues(result.error, data);
    },
    [fieldConfig, enabledTabIds, requiredTabIds, tabCustomFields]
  );
}
