import React, { useState, useRef, useEffect } from "react";
import { AlertCircle, X, LucideIcon, Upload, MapPin, BrainCircuit, FileText } from "lucide-react";

// ── Shared style constants ─────────────────────────────────────────────────────
export const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
export const SELECT = INPUT + " cursor-pointer";
export const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

interface EditableSelectProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  onUpdateOptions: (opts: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function EditableSelect({
  options,
  value,
  onChange,
  onUpdateOptions,
  placeholder = "Select...",
  className = "w-28",
}: EditableSelectProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [customVal, setCustomVal] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const handleAdd = () => {
    const text = customVal.trim();
    if (text && !options.includes(text)) {
      const next = [...options, text];
      onUpdateOptions(next);
      onChange(text);
      setCustomVal("");
    }
  };

  const handleRemove = (opt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = options.filter((o) => o !== opt);
    onUpdateOptions(next);
    if (value === opt) {
      onChange(next[0] || "");
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-background text-foreground hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-left"
      >
        <span className="truncate">{value || placeholder}</span>
        <span className="ml-2 text-muted-foreground/60 text-[10px]">▼</span>
      </button>

      {open && (
        <div className="absolute left-0 mt-1 w-44 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden divide-y divide-border/60">
          <div className="max-h-40 overflow-y-auto py-1">
            {options.map((opt) => (
              <div
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors hover:bg-muted/70 ${
                  value === opt ? "bg-primary/5 text-primary font-bold" : "text-foreground"
                }`}
              >
                <span className="truncate">{opt}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemove(opt, e)}
                  className="p-0.5 rounded hover:bg-red-50 text-muted-foreground/60 hover:text-red-500 transition-colors"
                  title={`Remove option ${opt}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {options.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground italic">No options</div>
            )}
          </div>
          <div className="p-2 flex gap-1 bg-muted/20">
            <input
              type="text"
              value={customVal}
              onChange={(e) => setCustomVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="Add new type..."
              className="flex-1 min-w-0 px-2 py-1 text-[11px] rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/60"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="px-2 py-1 text-[10px] font-bold rounded bg-primary text-primary-foreground hover:bg-primary/95 flex-shrink-0"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

/**
 * Field wrapper component.
 * @param props Component properties.
 * @returns React element.
 */
export function Field({ label, required = false, hint = undefined, children }: FieldProps): React.JSX.Element {
  return (
    <div>
      <span className={LABEL}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

interface FormEmptyStateProps {
  icon: LucideIcon;
  text: string;
}

/**
 * Empty state placeholder component.
 * @param props Component properties.
 * @returns React element.
 */
export function FormEmptyState({ icon: Icon, text }: FormEmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm gap-2 bg-card">
      <Icon className="w-7 h-7 opacity-25" />
      <span>{text}</span>
    </div>
  );
}

interface RequiredBannerProps {
  message: string;
}

/**
 * Inline required warning banner component.
 * @param props Component properties.
 * @returns React element.
 */
export function RequiredBanner({ message }: RequiredBannerProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-semibold dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

interface TagsInputProps {
  selected?: string[];
  predefined?: string[];
  onChange: (tags: string[]) => void;
}

/**
 * TagsInput component for multi-selecting tags.
 * Shows predefined chips to toggle and a free-text input for custom tags.
 * @param props Component properties.
 * @returns React element.
 */
function TagsInput({ selected = [], predefined = [], onChange }: TagsInputProps): React.JSX.Element {
  const [inputVal, setInputVal] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = (tag: string): void => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  const addCustom = (raw: string): void => {
    const tag = raw.trim();
    if (!tag || selected.includes(tag)) return;
    onChange([...selected, tag]);
    setInputVal("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
      e.preventDefault();
      addCustom(inputVal);
    } else if (e.key === "Backspace" && !inputVal && selected.length > 0) {
      onChange(selected.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
            >
              {tag}
              <button
                type="button"
                onClick={() => toggle(tag)}
                className="hover:text-primary/60 transition-colors"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Predefined tag chips (only show un-selected ones) */}
      {predefined.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {predefined.filter((t) => !selected.includes(t)).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-muted/50 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}

      {/* Custom tag input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          className={`${INPUT} flex-1`}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputVal.trim()) addCustom(inputVal);
          }}
          placeholder="Type a tag and press Enter…"
        />
        {inputVal.trim() && (
          <button
            type="button"
            onClick={() => addCustom(inputVal)}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            Add
          </button>
        )}
      </div>
    </div>
  );
}

export interface CustomFieldConfig {
  id: string;
  type: string;
  placeholder?: string;
  mask?: string;
  options?: string | string[];
}

interface CustomFieldInputProps {
  field: CustomFieldConfig;
  value: unknown;
  onChange: (val: unknown) => void;
}

/**
 * CustomFieldInput component to render dynamic custom fields of various types.
 * @param props Component properties.
 * @returns React element.
 */
export function CustomFieldInput({ field, value, onChange }: CustomFieldInputProps): React.JSX.Element {
  const displayValue = value ?? "";

  const getOptionsArray = (opts: string | string[] | undefined): string[] => {
    if (Array.isArray(opts)) return opts;
    if (typeof opts === "string") {
      return opts.split(",").map((o) => o.trim()).filter(Boolean);
    }
    return [];
  };

  if (field.type === "tags" || field.type === "multiselect") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    const predefined = getOptionsArray(field.options);
    return <TagsInput selected={selected} predefined={predefined} onChange={onChange} />;
  }

  if (field.type === "textarea") {
    return (
      <textarea
        className={`${INPUT} resize-none h-20`}
        value={String(displayValue)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || ""}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        className={INPUT}
        value={String(displayValue)}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Select —</option>
        {getOptionsArray(field.options).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "boolean") {
    const isChecked = !!value;
    return (
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onChange(!isChecked)}
          aria-label={`Toggle option ${field.id}`}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            isChecked ? "bg-primary border-primary" : "border-border bg-background"
          }`}
        >
          {isChecked && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
        </button>
        <span className="text-sm text-muted-foreground">{isChecked ? "Yes" : "No"}</span>
      </div>
    );
  }

  if (field.type === "file") {
    const file = value as { name: string; url: string; size?: number } | null;
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        onChange({
          name: f.name,
          url: ev.target?.result,
          size: f.size,
          type: f.type
        });
      };
      reader.readAsDataURL(f);
    };

    return (
      <div className="space-y-2">
        {file ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted border border-border">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-semibold truncate">{file.name}</span>
            </div>
            <button onClick={() => onChange(null)} className="p-1 hover:text-red-500 transition-colors" type="button">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded-xl hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground">Click to upload document</span>
            <input type="file" className="hidden" onChange={handleFile} />
          </label>
        )}
      </div>
    );
  }

  if (field.type === "location") {
    const loc = (value as { lat: number; lng: number; address?: string }) || { lat: 24.8607, lng: 67.0011 };
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            className={INPUT}
            type="number"
            step="any"
            placeholder="Latitude"
            value={loc.lat}
            onChange={(e) => onChange({ ...loc, lat: parseFloat(e.target.value) })}
          />
          <input
            className={INPUT}
            type="number"
            step="any"
            placeholder="Longitude"
            value={loc.lng}
            onChange={(e) => onChange({ ...loc, lng: parseFloat(e.target.value) })}
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-[10px] text-primary font-bold">
          <MapPin className="w-3 h-3" />
          <span>Location set to {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</span>
        </div>
      </div>
    );
  }

  if (field.type === "ai_summary") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded w-fit">
          <BrainCircuit className="w-3 h-3" /> 2026 AI Insights
        </div>
        <div className="p-3 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground italic leading-relaxed">
          {String(displayValue) || "AI summary will appear here after more contact activities are logged."}
        </div>
      </div>
    );
  }

  // Fallback to text, number, date inputs
  const inputType = field.type === "number" ? "number" : field.type === "date" ? "date" : "text";
  return (
    <input
      className={INPUT}
      type={inputType}
      value={String(displayValue)}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.mask || field.placeholder || ""}
    />
  );
}
