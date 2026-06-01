import React from "react";
import { motion } from "framer-motion";
import { Phone, Plus, Trash2 } from "lucide-react";
import { DEFAULT_TAB_FIELD_CONFIG } from "../../../lib/contactFields";
import { INPUT, SELECT, LABEL, Field, FormEmptyState, RequiredBanner, CustomFieldInput, CustomFieldConfig, EditableSelect } from "./FormPrimitives";
import { useSortedFields } from "../../../hooks/useSortedFields";
import { useContactConfig } from "../../../lib/ContactConfigContext";

interface ContactPhone {
  label: string;
  number: string;
  countryCode?: string;
  whatsapp?: boolean;
}

interface ContactFormData {
  phones?: ContactPhone[];
  [key: string]: unknown;
}

interface PhoneTabProps {
  data: ContactFormData;
  onChange: (updatedData: ContactFormData) => void;
  required?: boolean;
  tabFieldCfg?: {
    enabled?: string[];
    required?: string[];
  };
  defaultCountry: string;
  customFields?: unknown;
}

/**
 * PhoneTab component for managing contact phone numbers and country codes.
 * @param props Component properties.
 * @returns React element.
 */
export default function PhoneTab({
  data,
  onChange,
  required = false,
  tabFieldCfg,
  defaultCountry,
  customFields
}: PhoneTabProps): React.JSX.Element {
  const sortedCustomFields = useSortedFields("phones").filter((f) => f.isCustom && f.showInForm !== false);
  const { phoneLabels, countryCodesMap, updatePhoneLabels } = useContactConfig();
  const phones = data.phones && data.phones.length > 0 ? data.phones : [{ label: "Mobile", number: "", countryCode: countryCodesMap[defaultCountry] || "+92", whatsapp: false }];

  const upd = (list: ContactPhone[]): void => {
    onChange({ ...data, phones: list });
  };

  const updField = (id: string, value: unknown): void => {
    onChange({ ...data, [id]: value });
  };

  const en = tabFieldCfg?.enabled ?? DEFAULT_TAB_FIELD_CONFIG.phones.enabled;
  const req = tabFieldCfg?.required ?? DEFAULT_TAB_FIELD_CONFIG.phones.required;
  const showLabel = en.includes("label");
  const reqNumber = req.includes("number");
  const defaultCode = countryCodesMap[defaultCountry] || "+92";

  const updatePhone = (i: number, patch: Partial<ContactPhone>): void => {
    upd(phones.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  };

  return (
    <div className="space-y-3">
      {required && phones.length === 0 && <RequiredBanner message="At least one phone number is required" />}
      {phones.length === 0 && <FormEmptyState icon={Phone} text="No phone numbers yet. Add one below." />}

      {phones.map((p, i) => (
        <motion.div
          key={i}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-muted/20 p-3 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            {showLabel ? (
              <div className="flex items-center gap-2">
                <span className={LABEL + " !mb-0 text-[10px]"}>Type:</span>
                <EditableSelect
                  options={phoneLabels || []}
                  value={p.label}
                  onChange={(val) => updatePhone(i, { label: val })}
                  onUpdateOptions={updatePhoneLabels}
                  placeholder="Select label..."
                  className="w-28"
                />
              </div>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={() => upd(phones.filter((_, j) => j !== i))}
              className="p-1 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
              aria-label={`Remove phone number ${i + 1}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {reqNumber && (
            <span className={LABEL}>
              Phone Number <span className="text-red-500">*</span>
            </span>
          )}
          <div className="flex gap-2">
            <div className="w-20 flex-shrink-0">
              <input
                className={INPUT}
                value={p.countryCode || defaultCode}
                onChange={(e) => updatePhone(i, { countryCode: e.target.value })}
                placeholder="+92"
                aria-label={`Country code ${i + 1}`}
              />
            </div>
            <input
              className={INPUT}
              value={p.number}
              onChange={(e) => updatePhone(i, { number: e.target.value })}
              placeholder="300 0000000"
              aria-label={`Phone number ${i + 1}`}
            />
          </div>
        </motion.div>
      ))}

      <button
        type="button"
        onClick={() =>
          upd([
            ...phones,
            { label: phoneLabels[0] || "Mobile", number: "", countryCode: defaultCode, whatsapp: false }
          ])
        }
        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add phone number</span>
      </button>

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
