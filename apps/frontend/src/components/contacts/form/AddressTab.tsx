import React from "react";
import { motion } from "framer-motion";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { DEFAULT_TAB_FIELD_CONFIG } from "../../../lib/contactFields";
import { Field, INPUT, FormEmptyState, RequiredBanner, CustomFieldInput, CustomFieldConfig } from "./FormPrimitives";
import { useSortedFields } from "../../../hooks/useSortedFields";

interface ContactAddress {
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface ContactFormData {
  addresses?: ContactAddress[];
  [key: string]: unknown;
}

interface AddressTabProps {
  data: ContactFormData;
  onChange: (updatedData: ContactFormData) => void;
  required?: boolean;
  tabFieldCfg?: {
    enabled?: string[];
    required?: string[];
  };
  defaultCountry: string;
  defaultCity: string;
  defaultProvince: string;
  customFields?: unknown;
}

/**
 * AddressTab component for managing contact address records.
 * Only shows Street Address, City, State / Province, and Country fields.
 * @param props Component properties.
 * @returns React element.
 */
export default function AddressTab({
  data,
  onChange,
  required = false,
  tabFieldCfg,
  defaultCountry,
  defaultCity,
  defaultProvince,
  customFields
}: AddressTabProps): React.JSX.Element {
  const sortedCustomFields = useSortedFields("addresses").filter((f) => f.isCustom && f.showInForm !== false);
  const addresses = data.addresses || [];

  const upd = (list: ContactAddress[]): void => {
    onChange({ ...data, addresses: list });
  };

  const updField = (id: string, value: unknown): void => {
    onChange({ ...data, [id]: value });
  };

  const en = tabFieldCfg?.enabled ?? DEFAULT_TAB_FIELD_CONFIG.addresses.enabled;
  const req = tabFieldCfg?.required ?? DEFAULT_TAB_FIELD_CONFIG.addresses.required;

  const showLine1 = en.includes("line1");
  const showCity = en.includes("city");
  const showState = en.includes("state");
  const showCountry = en.includes("country");
  const reqLine1 = req.includes("line1");
  const reqCity = req.includes("city");
  const reqCountry = req.includes("country");

  const updateAddress = (i: number, patch: Partial<ContactAddress>): void => {
    upd(addresses.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  };

  return (
    <div className="space-y-4">
      {/* Address list */}
      <div>
        {required && addresses.length === 0 && <RequiredBanner message="At least one address is required" />}
        {addresses.length === 0 && <FormEmptyState icon={MapPin} text="No addresses yet. Add one below." />}

        {addresses.map((a, i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border p-4 space-y-3 bg-muted/20 mb-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Address {i + 1}
              </span>
              <button
                type="button"
                onClick={() => upd(addresses.filter((_, j) => j !== i))}
                className="p-1 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                aria-label={`Remove address ${i + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {showLine1 && (
              <Field label="Street Address" required={reqLine1}>
                <input
                  className={INPUT}
                  value={a.line1 || ""}
                  onChange={(e) => updateAddress(i, { line1: e.target.value })}
                  placeholder="House 12, Block B, Main Road"
                />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              {showCity && (
                <Field label="City" required={reqCity}>
                  <input
                    className={INPUT}
                    value={a.city || ""}
                    onChange={(e) => updateAddress(i, { city: e.target.value })}
                    placeholder="City"
                  />
                </Field>
              )}
              {showState && (
                <Field label="State / Province">
                  <input
                    className={INPUT}
                    value={a.state || ""}
                    onChange={(e) => updateAddress(i, { state: e.target.value })}
                    placeholder="State"
                  />
                </Field>
              )}
              {showCountry && (
                <Field label="Country" required={reqCountry}>
                  <input
                    className={INPUT}
                    value={a.country || ""}
                    onChange={(e) => updateAddress(i, { country: e.target.value })}
                    placeholder="Country"
                  />
                </Field>
              )}
            </div>
          </motion.div>
        ))}

        <button
          type="button"
          onClick={() =>
            upd([...addresses, { line1: "", city: defaultCity, state: defaultProvince, country: defaultCountry }])
          }
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors mt-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add address</span>
        </button>
      </div>

      {/* Inline custom fields (ordered per settings) */}
      {sortedCustomFields.map((field) => {
        const label = field.label as string;
        const reqField = field.required as boolean | undefined;
        return (
          <Field key={field.id} label={label} required={reqField}>
            <CustomFieldInput
              field={field as unknown as CustomFieldConfig}
              value={data[field.id]}
              onChange={(val) => updField(field.id, val)}
            />
          </Field>
        );
      })}
    </div>
  );
}
