import React, { useState } from "react";
import { Check, RotateCcw, Save, Info, Users, Layout, Star, List, Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_ENABLED_FIELDS, DEFAULT_REQUIRED_FIELDS,
  TAB_REGISTRY, DEFAULT_ENABLED_TABS, DEFAULT_REQUIRED_TABS,
  TAB_FIELD_DEFINITIONS, DEFAULT_TAB_FIELD_CONFIG,
  FieldConfig, TabFieldConfig, CustomField, ContactPreferences,
  CONFIG_VERSION,
} from "../../lib/contactFields";
import { saveDefaultConfig } from "../../lib/contactFieldsStore";
import { useContactConfig } from "../../lib/ContactConfigContext";
import CustomFieldsBuilder, { CustomFieldConfig } from "./settings/CustomFieldsBuilder";
import DraggableFieldList, { FieldDefinition } from "./settings/DraggableFieldList";

const INPUT = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (val: boolean) => void;
}

/**
 * A simple toggle switch component.
 * @param props Component properties.
 * @returns React element.
 */
function Toggle({ label, description, value, onChange }: ToggleProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between py-1.5 text-left">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative rounded-full flex-shrink-0 transition-colors"
        style={{ width: 40, height: 22, backgroundColor: value ? "hsl(var(--primary))" : "hsl(var(--border))" }}
        aria-label={`Toggle ${label}`}
      >
        <span style={{ width: 17, height: 17, top: 2.5, left: value ? 19 : 3, position: "absolute", borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </button>
    </div>
  );
}

/**
 * Returns core + custom fields for a tab in the saved order.
 */
function getOrderedFields(tabId: string, savedOrder: string[] | undefined, customFields: CustomField[] = []): FieldDefinition[] {
  const coreDefs = TAB_FIELD_DEFINITIONS[tabId] || [];
  const customDefs = customFields.map((f) => ({ ...f, isCustom: true }));
  const allDefs = [...coreDefs, ...customDefs];
  if (!savedOrder || savedOrder.length === 0) return allDefs as FieldDefinition[];
  const map = Object.fromEntries(savedOrder.map((id, i) => [id, i]));
  return [...allDefs].sort((a, b) => (map[a.id] ?? 9999) - (map[b.id] ?? 9999)) as FieldDefinition[];
}

/**
 * Syncs the field order array when custom fields change.
 */
function syncOrder(prevOrder: string[], coreFieldIds: string[], newCustomIds: string[]): string[] {
  const kept = prevOrder.filter((id) => coreFieldIds.includes(id) || newCustomIds.includes(id));
  const added = newCustomIds.filter((id) => !kept.includes(id));
  return [...kept, ...added];
}

interface ContactsSettingsPanelProps {
  config: FieldConfig;
  onConfigChange: (config: FieldConfig) => void;
}

interface ContactPrefs extends ContactPreferences {
  autoMergeSuggestions?: boolean;
  showWhatsApp?: boolean;
}

/**
 * ContactsSettingsPanel component providing a full dynamic field configuration UI.
 * @param props Component properties.
 * @returns React element.
 */
export default function ContactsSettingsPanel({ config, onConfigChange }: ContactsSettingsPanelProps): React.JSX.Element {
  const {
    updatePrefs,
    genders,
    socialPlatforms,
    relationships,
    lifecycleStages,
    phoneLabels,
    emailLabels,
    addressLabels,
    countryCodes,
    updateGenders,
    updateSocialPlatforms,
    updateRelationships,
    updateLifecycleStages,
    updatePhoneLabels,
    updateEmailLabels,
    updateAddressLabels,
    updateCountryCodes,
  } = useContactConfig();

  const [listKey, setListKey] = useState<string>("genders");
  const [newItemText, setNewItemText] = useState<string>("");
  const [newCountryName, setNewCountryName] = useState<string>("");
  const [newCountryCode, setNewCountryCode] = useState<string>("");

  const handleAddItem = () => {
    const text = newItemText.trim();
    if (!text) return;
    if (listKey === "genders") {
      if (!genders.includes(text)) updateGenders([...genders, text]);
    } else if (listKey === "socialPlatforms") {
      if (!socialPlatforms.includes(text)) updateSocialPlatforms([...socialPlatforms, text]);
    } else if (listKey === "relationships") {
      if (!relationships.includes(text)) updateRelationships([...relationships, text]);
    } else if (listKey === "lifecycleStages") {
      if (!lifecycleStages.includes(text)) updateLifecycleStages([...lifecycleStages, text]);
    } else if (listKey === "phoneLabels") {
      if (!phoneLabels.includes(text)) updatePhoneLabels([...phoneLabels, text]);
    } else if (listKey === "emailLabels") {
      if (!emailLabels.includes(text)) updateEmailLabels([...emailLabels, text]);
    } else if (listKey === "addressLabels") {
      if (!addressLabels.includes(text)) updateAddressLabels([...addressLabels, text]);
    }
    setNewItemText("");
  };

  const handleAddCountry = () => {
    const country = newCountryName.trim();
    const code = newCountryCode.trim();
    if (!country || !code) return;
    if (!countryCodes.some((c) => c.country.toLowerCase() === country.toLowerCase())) {
      updateCountryCodes([...countryCodes, { country, code }]);
    }
    setNewCountryName("");
    setNewCountryCode("");
  };

  const handleRemoveItem = (index: number) => {
    if (listKey === "genders") {
      updateGenders(genders.filter((_, i) => i !== index));
    } else if (listKey === "socialPlatforms") {
      updateSocialPlatforms(socialPlatforms.filter((_, i) => i !== index));
    } else if (listKey === "relationships") {
      updateRelationships(relationships.filter((_, i) => i !== index));
    } else if (listKey === "lifecycleStages") {
      updateLifecycleStages(lifecycleStages.filter((_, i) => i !== index));
    } else if (listKey === "phoneLabels") {
      updatePhoneLabels(phoneLabels.filter((_, i) => i !== index));
    } else if (listKey === "emailLabels") {
      updateEmailLabels(emailLabels.filter((_, i) => i !== index));
    } else if (listKey === "addressLabels") {
      updateAddressLabels(addressLabels.filter((_, i) => i !== index));
    }
  };

  const handleRemoveCountry = (country: string) => {
    updateCountryCodes(countryCodes.filter((c) => c.country !== country));
  };

  const [enabled, setEnabled] = useState<Set<string>>(() => new Set(config.enabled));
  const [required, setRequired] = useState<Set<string>>(() => new Set(config.required));
  const [enabledTabs, setEnabledTabs] = useState<Set<string>>(() => new Set(config.enabledTabs || DEFAULT_ENABLED_TABS));
  const [requiredTabs, setRequiredTabs] = useState<Set<string>>(() => new Set(config.requiredTabs || DEFAULT_REQUIRED_TABS));

  const [tabFieldEnabled, setTabFieldEnabled] = useState<Record<string, Set<string>>>(() => {
    const cfg = config.tabFieldConfig || {};
    return Object.fromEntries(
      Object.keys(TAB_FIELD_DEFINITIONS).map((tabId) => [
        tabId,
        new Set(cfg[tabId]?.enabled ?? DEFAULT_TAB_FIELD_CONFIG[tabId]?.enabled ?? []),
      ])
    );
  });

  const [tabFieldRequired, setTabFieldRequired] = useState<Record<string, Set<string>>>(() => {
    const cfg = config.tabFieldConfig || {};
    return Object.fromEntries(
      Object.keys(TAB_FIELD_DEFINITIONS).map((tabId) => [
        tabId,
        new Set(cfg[tabId]?.required ?? DEFAULT_TAB_FIELD_CONFIG[tabId]?.required ?? []),
      ])
    );
  });

  // Track field order per tab as array of IDs
  const [tabFieldOrder, setTabFieldOrder] = useState<Record<string, string[]>>(() => {
    const cfg = config.tabFieldConfig || {};
    return Object.fromEntries(
      Object.keys(TAB_FIELD_DEFINITIONS).map((tabId) => [
        tabId,
        cfg[tabId]?.order || TAB_FIELD_DEFINITIONS[tabId].map((f) => f.id),
      ])
    );
  });

  const [customFields, setCustomFields] = useState<CustomField[]>(() => config.customFields || []);
  const [tabCustomFields, setTabCustomFields] = useState<Record<string, CustomField[]>>(() => {
    const cfg = config.tabCustomFields || {};
    return Object.fromEntries(TAB_REGISTRY.map((t) => [t.id, cfg[t.id] || []]));
  });

  const [prefs, setPrefs] = useState<ContactPrefs>(() => {
    try {
      const storedRaw = localStorage.getItem("darul_quran_contact_prefs") ||
        localStorage.getItem("madrasa_contact_prefs");
      const stored = storedRaw ? (JSON.parse(storedRaw) as Partial<ContactPrefs>) : {};
      return { defaultCountry: "Pakistan", defaultProvince: "Sindh", defaultCity: "Karachi", ...stored } as ContactPrefs;
    } catch {
      return { defaultCountry: "Pakistan", defaultProvince: "Sindh", defaultCity: "Karachi" } as ContactPrefs;
    }
  });

  const [saved, setSaved] = useState<boolean>(false);
  const [savedDefault, setSavedDefault] = useState<boolean>(false);

  const updPref = <K extends keyof ContactPrefs>(k: K, v: ContactPrefs[K]): void => {
    setPrefs((p) => ({ ...p, [k]: v }));
    setSaved(false);
  };

  const toggleTabEnabled = (id: string): void => {
    setEnabledTabs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setRequiredTabs((r) => {
          const nr = new Set(r);
          nr.delete(id);
          return nr;
        });
      } else {
        next.add(id);
      }
      return next;
    });
    setSaved(false);
  };

  const toggleTabRequired = (id: string): void => {
    setRequiredTabs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSaved(false);
  };

  const toggleFieldEnabled = (tabId: string, fieldId: string): void => {
    setTabFieldEnabled((prev) => {
      const updated = new Set(prev[tabId]);
      if (updated.has(fieldId)) {
        updated.delete(fieldId);
        setTabFieldRequired((r) => {
          const nr = new Set(r[tabId]);
          nr.delete(fieldId);
          return { ...r, [tabId]: nr };
        });
      } else {
        updated.add(fieldId);
      }
      return { ...prev, [tabId]: updated };
    });
    setSaved(false);
  };

  const toggleFieldRequired = (tabId: string, fieldId: string): void => {
    setTabFieldRequired((prev) => {
      const updated = new Set(prev[tabId]);
      if (updated.has(fieldId)) updated.delete(fieldId);
      else updated.add(fieldId);
      return { ...prev, [tabId]: updated };
    });
    setSaved(false);
  };

  const handleReorder = (tabId: string, reorderedFields: FieldDefinition[]): void => {
    setTabFieldOrder((prev) => ({ ...prev, [tabId]: reorderedFields.map((f) => f.id) }));
    setSaved(false);
  };

  // When custom fields change for any tab, sync the order array
  const handleCustomFieldsChange = (tabId: string, newFields: CustomFieldConfig[]): void => {
    const coreIds = TAB_FIELD_DEFINITIONS[tabId]?.map((f) => f.id) || [];
    const newIds = newFields.map((f) => f.id);
    const convertedFields = newFields as unknown as CustomField[];
    setTabFieldOrder((prev) => ({
      ...prev,
      [tabId]: syncOrder(prev[tabId] || coreIds, coreIds, newIds),
    }));
    if (tabId === "basic") {
      setCustomFields(convertedFields);
    } else {
      setTabCustomFields((prev) => ({ ...prev, [tabId]: convertedFields }));
    }
    setSaved(false);
  };

  const buildTabFieldConfig = (): Record<string, TabFieldConfig> =>
    Object.fromEntries(
      Object.keys(TAB_FIELD_DEFINITIONS).map((tabId) => [
        tabId,
        {
          enabled: Array.from(tabFieldEnabled[tabId]),
          required: Array.from(tabFieldRequired[tabId]),
          order: tabFieldOrder[tabId] || TAB_FIELD_DEFINITIONS[tabId].map((f) => f.id),
        },
      ])
    );

  const handleSave = (): void => {
    const cfg: FieldConfig = {
      version: CONFIG_VERSION,
      enabled: Array.from(enabled),
      required: Array.from(required),
      enabledTabs: Array.from(enabledTabs),
      requiredTabs: Array.from(requiredTabs),
      tabFieldConfig: buildTabFieldConfig(),
      customFields,
      tabCustomFields,
      personas: config.personas || [],
      defaultPersonaId: config.defaultPersonaId || "general",
    };
    onConfigChange(cfg);
    updatePrefs(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = (): void => {
    setEnabled(new Set(DEFAULT_ENABLED_FIELDS));
    setRequired(new Set(DEFAULT_REQUIRED_FIELDS));
    setEnabledTabs(new Set(DEFAULT_ENABLED_TABS));
    setRequiredTabs(new Set(DEFAULT_REQUIRED_TABS));
    setTabFieldEnabled(
      Object.fromEntries(
        Object.keys(TAB_FIELD_DEFINITIONS).map((tabId) => [tabId, new Set(DEFAULT_TAB_FIELD_CONFIG[tabId]?.enabled || [])])
      )
    );
    setTabFieldRequired(
      Object.fromEntries(
        Object.keys(TAB_FIELD_DEFINITIONS).map((tabId) => [tabId, new Set(DEFAULT_TAB_FIELD_CONFIG[tabId]?.required || [])])
      )
    );
    setTabFieldOrder(
      Object.fromEntries(
        Object.keys(TAB_FIELD_DEFINITIONS).map((tabId) => [tabId, TAB_FIELD_DEFINITIONS[tabId].map((f) => f.id)])
      )
    );
    setSaved(false);
  };

  const isUniqueField = (tabId: string, fieldId: string): boolean => tabId === "emails" && fieldId === "address";

  return (
    <div className="space-y-6 max-w-3xl text-left">
      {/* Info */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-400">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div>
          <h3 className="font-semibold">Dynamic Contact Fields — Configured Per Madrasa</h3>
          <p className="text-xs mt-0.5 text-blue-700 dark:text-blue-300">
            Toggle fields on/off, mark as required, and <strong>drag the grip handle</strong> to reorder fields.
            Order is reflected instantly in the Contact Form and Contact List.
          </p>
        </div>
      </div>

      {/* General prefs */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">General Preferences</span>
        </div>
        <div className="p-4 space-y-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className={LABEL} htmlFor="defaultCountry">Default Country</label>
              <input
                id="defaultCountry"
                className={INPUT}
                value={prefs.defaultCountry || ""}
                onChange={(e) => updPref("defaultCountry", e.target.value)}
                placeholder="e.g. Pakistan"
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="defaultProvince">Default Province / State</label>
              <input
                id="defaultProvince"
                className={INPUT}
                value={prefs.defaultProvince || ""}
                onChange={(e) => updPref("defaultProvince", e.target.value)}
                placeholder="e.g. Sindh"
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="defaultCity">Default City</label>
              <input
                id="defaultCity"
                className={INPUT}
                value={prefs.defaultCity || ""}
                onChange={(e) => updPref("defaultCity", e.target.value)}
                placeholder="e.g. Karachi"
              />
            </div>
          </div>
          <Toggle
            label="Auto-suggest Merges"
            description="Show merge suggestions for likely duplicates"
            value={prefs.autoMergeSuggestions !== false}
            onChange={(v) => updPref("autoMergeSuggestions", v)}
          />
          <Toggle
            label="Show WhatsApp Actions"
            description="Enable WhatsApp messaging buttons"
            value={prefs.showWhatsApp !== false}
            onChange={(v) => updPref("showWhatsApp", v)}
          />
        </div>
      </section>

      {/* Contact Form Fields by Tab */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Contact Form Fields by Tab</h3>
          <span className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
            <span>— drag </span>
            <GripIcon />
            <span> to reorder</span>
          </span>
        </div>

        {/* ── Identity tab (basic) ── */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Identity</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Always On</span>
              </div>
              <p className="text-xs text-muted-foreground">Core identity fields + your custom fields</p>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
              {TAB_FIELD_DEFINITIONS.basic.filter((f) => f.alwaysOn || tabFieldEnabled["basic"]?.has(f.id)).length}/
              {TAB_FIELD_DEFINITIONS.basic.length}
            </span>
          </div>
          <div className="p-4 space-y-4">
            <DraggableFieldList
              tabId="basic"
              fields={getOrderedFields("basic", tabFieldOrder["basic"], customFields)}
              enabledSet={tabFieldEnabled["basic"] || new Set()}
              requiredSet={tabFieldRequired["basic"] || new Set()}
              onToggleEnabled={(fieldId) => toggleFieldEnabled("basic", fieldId)}
              onToggleRequired={(fieldId) => toggleFieldRequired("basic", fieldId)}
              onReorder={(reordered) => handleReorder("basic", reordered)}
              isUniqueField={isUniqueField}
            />
            <div className="border-t border-border pt-4">
              <CustomFieldsBuilder
                fields={customFields as unknown as CustomFieldConfig[]}
                droppableId="custom-fields-basic"
                onChange={(f) => handleCustomFieldsChange("basic", f)}
              />
            </div>
          </div>
        </section>

        {/* ── Other tabs ── */}
        {TAB_REGISTRY.map((tab) => {
          const tabId = tab.id;
          const tabLabel = tab.label.charAt(0).toUpperCase() + tab.label.slice(1);
          const tabDesc = tabId === "addresses" ? "Manage address records" : tab.description;
          const tabDefs = TAB_FIELD_DEFINITIONS[tabId] || [];
          const enabledSet = tabFieldEnabled[tabId] || new Set();
          const requiredSet = tabFieldRequired[tabId] || new Set();
          const isOn = tab.alwaysOn || enabledTabs.has(tabId);
          const isReq = tab.alwaysOn || requiredTabs.has(tabId);

          return (
            <section key={tabId} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
                <button
                  type="button"
                  disabled={tab.alwaysOn}
                  onClick={() => toggleTabEnabled(tabId)}
                  className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all
                    ${isOn ? "bg-primary border-primary" : "border-border bg-background"}
                    ${tab.alwaysOn ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                  aria-label={`Enable ${tabLabel} tab`}
                >
                  {isOn && <Check className="w-3 h-3 text-primary-foreground" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{tabLabel}</span>
                    {tab.alwaysOn && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Always On
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{tabDesc}</p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                  {tabDefs.filter((f) => f.alwaysOn || enabledSet.has(f.id)).length}/{tabDefs.length}
                </span>
                {isOn && !tab.alwaysOn && (
                  <button
                    type="button"
                    onClick={() => toggleTabRequired(tabId)}
                    className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all
                      ${
                        isReq
                          ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400"
                          : "bg-muted border-border text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {isReq ? "Required" : "Optional"}
                  </button>
                )}
              </div>

              {isOn && (
                <div className="p-3 space-y-3">
                  <DraggableFieldList
                    tabId={tabId}
                    fields={getOrderedFields(tabId, tabFieldOrder[tabId], tabCustomFields[tabId] || [])}
                    enabledSet={enabledSet}
                    requiredSet={requiredSet}
                    onToggleEnabled={(fieldId) => toggleFieldEnabled(tabId, fieldId)}
                    onToggleRequired={(fieldId) => toggleFieldRequired(tabId, fieldId)}
                    onReorder={(reordered) => handleReorder(tabId, reordered)}
                    isUniqueField={isUniqueField}
                  />
                  <div className="border-t border-border pt-3">
                    <CustomFieldsBuilder
                      fields={(tabCustomFields[tabId] || []) as unknown as CustomFieldConfig[]}
                      droppableId={`custom-fields-${tabId}`}
                      onChange={(f) => handleCustomFieldsChange(tabId, f)}
                    />
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Option Lists Management */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
          <List className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Predefined Options Management</span>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Configure dropdown menus and lists used globally in contact fields (e.g. gender options, relationship labels, dial prefixes).
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-1/3 text-left">
              <label className={LABEL} htmlFor="list-selector">Select List to Configure</label>
              <select
                id="list-selector"
                className={INPUT + " cursor-pointer"}
                value={listKey}
                onChange={(e) => {
                  setListKey(e.target.value);
                  setNewItemText("");
                  setNewCountryName("");
                  setNewCountryCode("");
                }}
              >
                <option value="genders">Genders</option>
                <option value="lifecycleStages">Lifecycle Stages</option>
                <option value="socialPlatforms">Social Platforms</option>
                <option value="relationships">Relationships</option>
                <option value="phoneLabels">Phone Labels</option>
                <option value="emailLabels">Email Labels</option>
                <option value="addressLabels">Address Labels</option>
                <option value="countryCodes">Country Dial Codes</option>
              </select>
            </div>

            <div className="flex-1 space-y-3 text-left">
              {listKey === "countryCodes" ? (
                <div className="flex gap-2 items-end">
                  <div className="flex-1 text-left">
                    <label className={LABEL} htmlFor="new-country-name">Country Name</label>
                    <input
                      id="new-country-name"
                      className={INPUT}
                      value={newCountryName}
                      onChange={(e) => setNewCountryName(e.target.value)}
                      placeholder="e.g. Turkey"
                    />
                  </div>
                  <div className="w-24 text-left">
                    <label className={LABEL} htmlFor="new-country-code">Dial Code</label>
                    <input
                      id="new-country-code"
                      className={INPUT}
                      value={newCountryCode}
                      onChange={(e) => setNewCountryCode(e.target.value)}
                      placeholder="e.g. +90"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCountry}
                    className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center h-9"
                    title="Add Country"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-end">
                  <div className="flex-1 text-left">
                    <label className={LABEL} htmlFor="new-item-text">Add New Option</label>
                    <input
                      id="new-item-text"
                      className={INPUT}
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Type a new label..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center h-9"
                    title="Add Option"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Items Display */}
              <div className="border border-border rounded-lg max-h-[200px] overflow-y-auto divide-y divide-border bg-card">
                {listKey === "countryCodes" ? (
                  countryCodes.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No countries configured.</p>
                  ) : (
                    countryCodes.map((c) => (
                      <div key={c.country} className="flex items-center justify-between px-3 py-2 text-xs">
                        <span className="font-semibold text-foreground">{c.country}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-muted-foreground">{c.code}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCountry(c.country)}
                            className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"
                            title={`Remove ${c.country}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  (() => {
                    const items =
                      listKey === "genders" ? genders :
                      listKey === "lifecycleStages" ? lifecycleStages :
                      listKey === "socialPlatforms" ? socialPlatforms :
                      listKey === "relationships" ? relationships :
                      listKey === "phoneLabels" ? phoneLabels :
                      listKey === "emailLabels" ? emailLabels :
                      addressLabels;
                    return items.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No options configured.</p>
                    ) : (
                      items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs font-semibold">
                          <span className="text-foreground">{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"
                            title={`Remove ${item}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Save / reset */}
      <div className="flex items-center gap-3 pt-2 border-t border-border sticky bottom-0 bg-background pb-2 flex-wrap">
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>{saved ? "Saved!" : "Save & Apply"}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            saveDefaultConfig({
              version: CONFIG_VERSION,
              enabled: Array.from(enabled),
              required: Array.from(required),
              enabledTabs: Array.from(enabledTabs),
              requiredTabs: Array.from(requiredTabs),
              tabFieldConfig: buildTabFieldConfig(),
              customFields,
              tabCustomFields,
              personas: config.personas || [],
              defaultPersonaId: config.defaultPersonaId || "general",
            });
            setSavedDefault(true);
            setTimeout(() => setSavedDefault(false), 2500);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors dark:bg-amber-955/20 dark:border-amber-900/50 dark:text-amber-400"
        >
          <Star className="w-4 h-4" />
          <span>{savedDefault ? "Set as Default!" : "Set as Default"}</span>
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors bg-card"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Defaults</span>
        </button>
      </div>
    </div>
  );
}

/** Tiny inline icon to avoid import just for text */
function GripIcon(): React.JSX.Element {
  return <span className="inline-block align-middle opacity-60">⠿</span>;
}
