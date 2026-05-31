/**
 * @file contactFieldsStore.ts
 * @description localStorage-backed persistence for contact field configuration.
 *
 * In a production SaaS deployment this would be stored per-madrasa in the
 * database. The store exposes four operations:
 *
 *  loadFieldConfig()       — load the active (per-session) config
 *  saveFieldConfig(cfg)    — persist the active config
 *  loadDefaultConfig()     — load the admin-set default config
 *  saveDefaultConfig(cfg)  — persist the admin-set default config
 *
 * Migration: when a stored config is detected with an older (or missing)
 * CONFIG_VERSION, migrateConfig() fills in any keys that were added in newer
 * versions before the caller receives the object.
 */
import {
  CONFIG_VERSION,
  DEFAULT_ENABLED_FIELDS,
  DEFAULT_REQUIRED_FIELDS,
  DEFAULT_ENABLED_TABS,
  DEFAULT_REQUIRED_TABS,
  DEFAULT_TAB_FIELD_CONFIG,
  TAB_FIELD_DEFINITIONS,
  FieldConfig,
  TabFieldConfig,
  CustomField,
} from "./contactFields";

// ── Storage keys ──────────────────────────────────────────────────────────────
const STORAGE_KEY = "darul_quran_contact_field_config";
const DEFAULT_STORAGE_KEY = "darul_quran_contact_field_config_default";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a deep clone of the hardcoded system defaults.
 * Always returns a fresh object so callers can mutate freely.
 *
 * @returns {FieldConfig} The default field configuration.
 */
function getHardcodedDefaults(): FieldConfig {
  const tabFieldConfig: Record<string, TabFieldConfig> = {};
  for (const [k, v] of Object.entries(DEFAULT_TAB_FIELD_CONFIG)) {
    tabFieldConfig[k] = {
      enabled: [...v.enabled],
      required: [...v.required],
    };
  }

  const tabCustomFields: Record<string, CustomField[]> = {};
  for (const k of Object.keys(TAB_FIELD_DEFINITIONS)) {
    tabCustomFields[k] = [];
  }

  // Default personas for 2026 CRM
  const personas = [
    {
      id: "general",
      label: "General Contact",
      icon: "User",
      enabledTabs: [...DEFAULT_ENABLED_TABS],
      requiredTabs: [...DEFAULT_REQUIRED_TABS],
      tabFieldConfig: { ...tabFieldConfig },
      tabCustomFields: { ...tabCustomFields },
    },
    {
      id: "student",
      label: "Student",
      icon: "GraduationCap",
      enabledTabs: ["phones", "emails", "addresses", "emergency", "relationships"],
      requiredTabs: ["phones", "emergency"],
      tabFieldConfig: {
        ...tabFieldConfig,
        basic: {
          enabled: ["avatar", "firstName", "lastName", "gender", "dob", "lifecycleStage"],
          required: ["firstName", "lastName", "gender", "dob"],
        }
      },
      tabCustomFields: { ...tabCustomFields },
    },
    {
      id: "staff",
      label: "Staff Member",
      icon: "Briefcase",
      enabledTabs: ["phones", "emails", "addresses", "socials", "relationships"],
      requiredTabs: ["phones", "emails"],
      tabFieldConfig: {
        ...tabFieldConfig,
        basic: {
          enabled: ["avatar", "firstName", "lastName", "gender", "dob", "lifecycleStage", "rating"],
          required: ["firstName", "lastName", "gender"],
        }
      },
      tabCustomFields: { ...tabCustomFields },
    }
  ];

  return {
    version: CONFIG_VERSION,
    enabled: [...DEFAULT_ENABLED_FIELDS],
    required: [...DEFAULT_REQUIRED_FIELDS],
    enabledTabs: [...DEFAULT_ENABLED_TABS],
    requiredTabs: [...DEFAULT_REQUIRED_TABS],
    tabFieldConfig,
    customFields: [],
    tabCustomFields,
    personas,
    defaultPersonaId: "general",
  };
}

/**
 * Migrates a stored config object from an older schema version to the current
 * one. Operates on a plain copy — never mutates the original.
 *
 * @param {unknown} config - The raw config object loaded from storage.
 * @returns {FieldConfig} A migrated config object at CONFIG_VERSION.
 */
function migrateConfig(config: unknown): FieldConfig {
  if (!config || typeof config !== "object") {
    return getHardcodedDefaults();
  }

  const rawConfig = config as Record<string, unknown>;
  const storedVersion = typeof rawConfig.version === "number" ? rawConfig.version : 0;

  // Start with a shallow clone of the input config
  const cfg = { ...rawConfig } as unknown as Partial<FieldConfig>;

  if (storedVersion < 1) {
    // v0 → v1: ensure all tab keys exist in tabFieldConfig
    cfg.tabFieldConfig = cfg.tabFieldConfig ?? {};
    for (const tabId of Object.keys(TAB_FIELD_DEFINITIONS)) {
      if (!cfg.tabFieldConfig[tabId]) {
        cfg.tabFieldConfig[tabId] = {
          enabled: [...(DEFAULT_TAB_FIELD_CONFIG[tabId]?.enabled ?? [])],
          required: [...(DEFAULT_TAB_FIELD_CONFIG[tabId]?.required ?? [])],
        };
      }
    }
    // Ensure top-level tab arrays are present
    cfg.enabledTabs = cfg.enabledTabs ?? [...DEFAULT_ENABLED_TABS];
    cfg.requiredTabs = cfg.requiredTabs ?? [...DEFAULT_REQUIRED_TABS];
    // Ensure custom field arrays are present
    cfg.customFields = cfg.customFields ?? [];
    
    const tabCustomFields: Record<string, CustomField[]> = {};
    for (const k of Object.keys(TAB_FIELD_DEFINITIONS)) {
      tabCustomFields[k] = [];
    }
    cfg.tabCustomFields = cfg.tabCustomFields ?? tabCustomFields;
    cfg.version = 1;
  }

  if (storedVersion < 2) {
    // v1 → v2 modernization: Add personas
    const defaults = getHardcodedDefaults();
    cfg.personas = cfg.personas ?? defaults.personas;
    cfg.defaultPersonaId = cfg.defaultPersonaId ?? defaults.defaultPersonaId;
    cfg.version = CONFIG_VERSION;
  }

  // Future version migrations go here as additional `if (storedVersion < N)` blocks.

  return cfg as FieldConfig;
}

/**
 * Sanitizes a loaded configuration against the current schema definitions.
 * Pure function — returns a new object and never mutates the argument.
 *
 * - Strips unknown field IDs from `enabled`/`required` arrays (top-level).
 * - Strips unknown field IDs from each tab's `enabled`/`required` arrays.
 * - Unknown tabs inside `tabFieldConfig` are removed.
 *
 * @param {FieldConfig} config - Configuration object to sanitize.
 * @returns {FieldConfig} A sanitized copy of the configuration.
 */
export function sanitizeConfig(config: FieldConfig): FieldConfig {
  if (!config || typeof config !== "object") {
    return getHardcodedDefaults();
  }

  // Work on a shallow clone
  const cfg = { ...config };

  // ── Top-level enabled/required (legacy flat arrays) ─────────────────────
  const validTopLevelIds = new Set(DEFAULT_ENABLED_FIELDS);
  if (Array.isArray(cfg.enabled)) {
    cfg.enabled = cfg.enabled.filter((f) => typeof f === "string" && validTopLevelIds.has(f));
  }
  if (Array.isArray(cfg.required)) {
    cfg.required = cfg.required.filter((f) => typeof f === "string" && validTopLevelIds.has(f));
  }

  // ── Per-tab field config ─────────────────────────────────────────────────
  if (cfg.tabFieldConfig && typeof cfg.tabFieldConfig === "object") {
    const sanitizedTabConfig: Record<string, TabFieldConfig> = {};
    for (const tabId of Object.keys(TAB_FIELD_DEFINITIONS)) {
      const savedTab = cfg.tabFieldConfig[tabId];
      const coreIds = new Set(TAB_FIELD_DEFINITIONS[tabId].map((f) => f.id));

      // Collect IDs of custom fields for this tab
      const customIds = new Set(
        (cfg.tabCustomFields?.[tabId] ?? cfg.customFields ?? []).map((f) => f.id)
      );

      const isAllowed = (id: string) => coreIds.has(id) || customIds.has(id);

      sanitizedTabConfig[tabId] = {
        enabled: Array.isArray(savedTab?.enabled)
          ? savedTab.enabled.filter(isAllowed)
          : [...(DEFAULT_TAB_FIELD_CONFIG[tabId]?.enabled ?? [])],
        required: Array.isArray(savedTab?.required)
          ? savedTab.required.filter(isAllowed)
          : [...(DEFAULT_TAB_FIELD_CONFIG[tabId]?.required ?? [])],
        ...(savedTab?.order ? { order: savedTab.order.filter(isAllowed) } : {}),
      };
    }
    cfg.tabFieldConfig = sanitizedTabConfig;
  }

  return cfg;
}

/**
 * Safely parses a JSON string. Returns `null` on any error and logs a warning.
 *
 * @param {string|null} raw - Raw JSON string from localStorage.
 * @param {string} context - Human-readable label for error messages.
 * @returns {unknown|null} Parsed value or null.
 */
function safeParse(raw: string | null, context: string): unknown | null {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[contactFieldsStore] Failed to parse stored config for "${context}":`, err);
    return null;
  }
}

/**
 * Safely writes a value to localStorage. Logs a warning on quota exceeded.
 *
 * @param {string} key - Storage key.
 * @param {unknown} value - Value to serialize and store.
 */
function safeWrite(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[contactFieldsStore] Failed to write "${key}" to localStorage (quota exceeded?):`, err);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Loads the admin-set default config from localStorage.
 * Falls back to hardcoded system defaults if nothing is stored.
 *
 * @returns {FieldConfig} The default field configuration.
 */
export function loadDefaultConfig(): FieldConfig {
  let raw = localStorage.getItem(DEFAULT_STORAGE_KEY);
  if (!raw) {
    const legacy = localStorage.getItem("madrasa_contact_field_config_default");
    if (legacy) {
      raw = legacy;
      safeWrite(DEFAULT_STORAGE_KEY, JSON.parse(legacy));
      try {
        localStorage.removeItem("madrasa_contact_field_config_default");
      } catch (err) {
        console.warn("[contactFieldsStore] Failed to remove legacy default config key:", err);
      }
    }
  }
  const parsed = safeParse(raw, "defaultConfig");
  if (parsed && typeof parsed === "object") {
    return sanitizeConfig(migrateConfig(parsed));
  }
  return getHardcodedDefaults();
}

/**
 * Persists the admin-set default config to localStorage.
 *
 * @param {FieldConfig} config - Configuration object to save.
 */
export function saveDefaultConfig(config: FieldConfig): void {
  safeWrite(DEFAULT_STORAGE_KEY, { ...config, version: CONFIG_VERSION });
}

/**
 * Loads the active field config from localStorage.
 * Merges missing keys from the default config so partial saves are safe.
 * Falls back to loadDefaultConfig() if nothing is stored.
 *
 * @returns {FieldConfig} The active field configuration.
 */
export function loadFieldConfig(): FieldConfig {
  let raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const legacy = localStorage.getItem("madrasa_contact_field_config");
    if (legacy) {
      raw = legacy;
      safeWrite(STORAGE_KEY, JSON.parse(legacy));
      try {
        localStorage.removeItem("madrasa_contact_field_config");
      } catch (err) {
        console.warn("[contactFieldsStore] Failed to remove legacy field config key:", err);
      }
    }
  }
  const parsed = safeParse(raw, "fieldConfig");

  if (parsed && typeof parsed === "object") {
    const migrated = migrateConfig(parsed);
    const fallback = loadDefaultConfig();

    const merged: FieldConfig = {
      ...fallback,
      ...migrated,
      enabledTabs: migrated.enabledTabs ?? fallback.enabledTabs,
      requiredTabs: migrated.requiredTabs ?? fallback.requiredTabs,
      tabFieldConfig: migrated.tabFieldConfig ?? fallback.tabFieldConfig,
      customFields: migrated.customFields ?? fallback.customFields,
      tabCustomFields: migrated.tabCustomFields ?? fallback.tabCustomFields,
    };
    return sanitizeConfig(merged);
  }

  return loadDefaultConfig();
}

/**
 * Persists the active field config to localStorage.
 * Always stamps the current CONFIG_VERSION before saving.
 *
 * @param {FieldConfig} config - Configuration object to save.
 */
export function saveFieldConfig(config: FieldConfig): void {
  safeWrite(STORAGE_KEY, { ...config, version: CONFIG_VERSION });
}
