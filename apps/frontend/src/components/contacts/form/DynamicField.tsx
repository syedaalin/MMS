import React from "react";
import { useContactConfig } from "../../../lib/ContactConfigContext";
import { Field, INPUT, SELECT } from "./FormPrimitives";

interface FieldDef {
  id: string;
  label: string;
  type: string;
}

interface DynamicFieldProps {
  fieldDef: FieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
  required?: boolean;
}

/**
 * DynamicField component to dynamically render fields depending on their configured type.
 * @param props Component properties.
 * @returns React element.
 */
export default function DynamicField({ fieldDef, value, onChange, required = false }: DynamicFieldProps): React.JSX.Element {
  const { genders } = useContactConfig();

  const selectOptionsMap: Record<string, Array<{ value: string; label: string }>> = {
    gender: (genders || []).map((g) => ({ value: g, label: g.charAt(0).toUpperCase() + g.slice(1) })),
  };

  const typedValue = (value !== null && value !== undefined) ? String(value) : "";
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    onChange(e.target.value);
  };

  if (fieldDef.type === "select") {
    const opts = selectOptionsMap[fieldDef.id] || [];
    return (
      <Field label={fieldDef.label} required={required}>
        <select className={SELECT} value={typedValue} onChange={handleChange}>
          <option value="">Select…</option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  if (fieldDef.type === "boolean") {
    return (
      <Field label={fieldDef.label} required={required}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 accent-primary rounded cursor-pointer border-border bg-background"
          />
          <span className="text-sm text-foreground">{fieldDef.label}</span>
        </label>
      </Field>
    );
  }

  if (fieldDef.type === "date") {
    return (
      <Field label={fieldDef.label} required={required}>
        <input type="date" className={INPUT} value={typedValue} onChange={handleChange} />
      </Field>
    );
  }

  if (fieldDef.type === "textarea") {
    return (
      <Field label={fieldDef.label} required={required}>
        <textarea
          className={`${INPUT} min-h-[80px] resize-none`}
          value={typedValue}
          onChange={handleChange}
          placeholder={`${fieldDef.label}…`}
        />
      </Field>
    );
  }

  return (
    <Field label={fieldDef.label} required={required}>
      <input
        className={INPUT}
        value={typedValue}
        onChange={handleChange}
        placeholder={`${fieldDef.label}…`}
      />
    </Field>
  );
}
