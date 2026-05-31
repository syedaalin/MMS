import { useMemo } from "react";
import { useContactConfig } from "../lib/ContactConfigContext.js";
import { TAB_FIELD_DEFINITIONS } from "../lib/contactFields.js";

interface FieldDefinition extends Record<string, unknown> {
  id: string;
  isCustom?: boolean;
  alwaysOn?: boolean;
}

interface TabFieldConfig {
  order?: string[];
}

interface ContactConfigState {
  tabFieldConfig: Record<string, TabFieldConfig>;
  fieldConfig: {
    customFields?: FieldDefinition[];
    tabCustomFields?: Record<string, FieldDefinition[]>;
  };
}

/**
 * Hook to retrieve all field definitions (core and custom) for a specific tab
 * sorted by the custom order array.
 *
 * @param {string} tabId - The ID of the tab to get fields for.
 * @returns {FieldDefinition[]} The sorted field definitions list.
 */
export function useSortedFields(tabId: string): FieldDefinition[] {
  const { tabFieldConfig, tabCustomFields, fieldConfig } = useContactConfig();

  return useMemo(() => {
    const coreDefs = (TAB_FIELD_DEFINITIONS as unknown as Record<string, FieldDefinition[]>)[tabId] || [];

    // Use derived tabCustomFields which is already persona-aware
    const rawCustom = tabCustomFields[tabId] || [];

    const customDefs: FieldDefinition[] = rawCustom.map((f) => ({ ...f, isCustom: true, alwaysOn: false }));

    const allDefs = [...coreDefs, ...customDefs];
    const order = tabFieldConfig[tabId]?.order;
    if (!order || order.length === 0) return allDefs;

    const orderMap = Object.fromEntries(order.map((id, i) => [id, i]));
    return [...allDefs].sort((a, b) => {
      const ai = orderMap[a.id] ?? 9999;
      const bi = orderMap[b.id] ?? 9999;
      return ai - bi;
    });
  }, [tabId, tabFieldConfig, fieldConfig]);
}
