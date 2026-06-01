import React from "react";
import { motion } from "framer-motion";
import { Mail, Plus, Trash2 } from "lucide-react";
import { DEFAULT_TAB_FIELD_CONFIG } from "../../../lib/contactFields";
import { INPUT, SELECT, LABEL, Field, FormEmptyState, RequiredBanner, CustomFieldInput, CustomFieldConfig, EditableSelect } from "./FormPrimitives";
import { useSortedFields } from "../../../hooks/useSortedFields";
import { useContactConfig } from "../../../lib/ContactConfigContext";

interface ContactEmail {
  label: string;
  address: string;
}

interface ContactFormData {
  emails?: ContactEmail[];
  [key: string]: unknown;
}

interface EmailTabProps {
  data: ContactFormData;
  onChange: (updatedData: ContactFormData) => void;
  required?: boolean;
  tabFieldCfg?: {
    enabled?: string[];
    required?: string[];
  };
  customFields?: unknown;
}

/**
 * EmailTab component for managing contact email addresses.
 * @param props Component properties.
 * @returns React element.
 */
export default function EmailTab({
  data,
  onChange,
  required = false,
  tabFieldCfg,
  customFields
}: EmailTabProps): React.JSX.Element {
  const sortedCustomFields = useSortedFields("emails").filter((f) => f.isCustom && f.showInForm !== false);
  const { emailLabels, updateEmailLabels } = useContactConfig();
  const emails = data.emails && data.emails.length > 0 ? data.emails : [{ label: "Personal", address: "" }];

  const upd = (list: ContactEmail[]): void => {
    onChange({ ...data, emails: list });
  };

  const updField = (id: string, value: unknown): void => {
    onChange({ ...data, [id]: value });
  };

  const en = tabFieldCfg?.enabled ?? DEFAULT_TAB_FIELD_CONFIG.emails.enabled;
  const req = tabFieldCfg?.required ?? DEFAULT_TAB_FIELD_CONFIG.emails.required;
  const showLabel = en.includes("label");
  const showAddress = en.includes("address");
  const reqAddress = req.includes("address");

  const updateEmail = (i: number, patch: Partial<ContactEmail>): void => {
    upd(emails.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  };

  return (
    <div className="space-y-3">
      {required && emails.length === 0 && <RequiredBanner message="At least one email address is required" />}
      {emails.length === 0 && <FormEmptyState icon={Mail} text="No email addresses yet. Add one below." />}

      {emails.map((e, i) => (
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
                  options={emailLabels || []}
                  value={e.label}
                  onChange={(val) => updateEmail(i, { label: val })}
                  onUpdateOptions={updateEmailLabels}
                  placeholder="Select label..."
                  className="w-28"
                />
              </div>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={() => upd(emails.filter((_, j) => j !== i))}
              className="p-1 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
              aria-label={`Remove email address ${i + 1}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {showAddress && reqAddress && (
            <span className={LABEL}>
              Email Address <span className="text-red-500">*</span>
            </span>
          )}
          {showAddress && (
            <input
              type="email"
              className={INPUT}
              value={e.address}
              onChange={(ev) => updateEmail(i, { address: ev.target.value })}
              placeholder="name@example.com"
              aria-label={`Email address ${i + 1}`}
            />
          )}
        </motion.div>
      ))}

      <button
        type="button"
        onClick={() => upd([...emails, { label: emailLabels[0] || "Personal", address: "" }])}
        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add email</span>
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
