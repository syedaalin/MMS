import React from "react";
import { Field, CustomFieldInput, CustomFieldConfig } from "./FormPrimitives";

interface ContactFormData {
  [key: string]: unknown;
}

interface ExtendedCustomFieldConfig extends CustomFieldConfig {
  label: string;
  required?: boolean;
  showInForm?: boolean;
}

interface TabCustomFieldsProps {
  customFields?: ExtendedCustomFieldConfig[];
  data: ContactFormData;
  onChange: (updatedData: ContactFormData) => void;
}

/**
 * TabCustomFields component to render dynamic custom fields inside contact form tabs.
 * @param props Component properties.
 * @returns React element or null.
 */
export default function TabCustomFields({
  customFields = [],
  data,
  onChange
}: TabCustomFieldsProps): React.JSX.Element | null {
  if (!customFields || customFields.length === 0) return null;

  const visible = customFields.filter((f) => f.showInForm !== false);
  if (visible.length === 0) return null;

  const upd = (id: string, value: unknown): void => {
    onChange({ ...data, [id]: value });
  };

  return (
    <section className="rounded-lg border border-border p-3 space-y-3 mt-2 bg-card">
      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Additional Fields</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visible.map((field) => (
          <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
            <Field label={field.label} required={field.required}>
              <CustomFieldInput
                field={field}
                value={data[field.id]}
                onChange={(value) => upd(field.id, value)}
              />
            </Field>
          </div>
        ))}
      </div>
    </section>
  );
}
