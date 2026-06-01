import React, { useState, useCallback } from "react";
import { Plus, Trash2, Check, X, Pencil, AlertTriangle, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

/** All supported custom field types with UI labels. */
const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "url", label: "URL" },
  { value: "email", label: "Email" },
  { value: "select", label: "Dropdown" },
  { value: "tags", label: "Tags (multi-select)" },
  { value: "boolean", label: "Yes / No" },
];

const INPUT = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1";

// ── ID generation ─────────────────────────────────────────────────────────────
/**
 * Generates a collision-resistant custom field ID.
 * Combines a base-36 timestamp with a 5-character random suffix.
 * @returns Unique field ID.
 */
function generateFieldId(): string {
  return `cf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Options helpers ───────────────────────────────────────────────────────────
/**
 * Converts an options value to a string[] regardless of its stored shape.
 * Backward-compatible: accepts a comma-separated string (legacy) or string[].
 * @param options Raw options value.
 * @returns Normalized array of option strings.
 */
function normalizeOptions(options: string | string[] | undefined): string[] {
  if (Array.isArray(options)) return options;
  if (typeof options === "string" && options.trim()) {
    return options.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Converts a string[] to a comma-separated display string for the input field.
 * @param arr Array of option strings.
 * @returns Comma-separated display string.
 */
function optionsToString(arr: string[]): string {
  return arr.join(", ");
}

export interface CustomFieldConfig {
  id: string;
  label: string;
  type: string;
  required: boolean;
  unique: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: string;
  options?: string[];
  showInForm?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  mask?: string;
}

/**
 * Returns a blank new custom field with sensible defaults.
 * @returns A new custom field configuration object.
 */
function newField(): CustomFieldConfig {
  return {
    id: generateFieldId(),
    label: "",
    type: "text",
    required: false,
    unique: false,
    placeholder: "",
    description: "",
    defaultValue: "",
    options: [], // string[] — stored as array, not comma string
    showInForm: true,
  };
}

interface FieldEditorProps {
  field: CustomFieldConfig;
  existingLabels?: string[];
  onSave: (field: CustomFieldConfig) => void;
  onCancel: () => void;
}

interface DraftFieldState extends Omit<CustomFieldConfig, "options"> {
  options: string[];
  _optionsString: string;
}

/**
 * Inline editor panel for creating or modifying a custom field.
 * @param props Component properties.
 * @returns React element.
 */
function FieldEditor({ field, existingLabels = [], onSave, onCancel }: FieldEditorProps): React.JSX.Element {
  const [draft, setDraft] = useState<DraftFieldState>(() => ({
    ...field,
    options: normalizeOptions(field.options),
    // Transient UI string for the options <input>
    _optionsString: optionsToString(normalizeOptions(field.options)),
  }));

  const upd = useCallback(<K extends keyof DraftFieldState>(k: K, v: DraftFieldState[K]): void => {
    setDraft((d) => ({ ...d, [k]: v }));
  }, []);

  // Validation
  const trimmedLabel = draft.label.trim();
  const isDuplicateLabel = existingLabels
    .filter((l) => l !== field.label) // exclude own label when editing
    .some((l) => l.toLowerCase() === trimmedLabel.toLowerCase());
  const isValid = trimmedLabel.length >= 2 && !isDuplicateLabel;

  const handleSave = (): void => {
    if (!isValid) return;
    // Persist options as string[] — strip the transient _optionsString key
    const { _optionsString, ...rest } = draft;
    onSave({ ...rest, options: normalizeOptions(_optionsString) });
  };

  const hasTextLength = draft.type === "text" || draft.type === "textarea";
  const hasOptions = draft.type === "select" || draft.type === "tags";
  const hasNumRange = draft.type === "number";

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
      {/* Row 1: Label + Type */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL} htmlFor={`label-${draft.id}`}>Field Name *</label>
          <input
            id={`label-${draft.id}`}
            className={INPUT}
            value={draft.label}
            onChange={(e) => upd("label", e.target.value)}
            placeholder="e.g. Father's Name"
            autoFocus
          />
          {isDuplicateLabel && (
            <p className="text-[11px] text-red-600 mt-1">A field with this name already exists.</p>
          )}
          {trimmedLabel.length > 0 && trimmedLabel.length < 2 && (
            <p className="text-[11px] text-amber-600 mt-1">Name must be at least 2 characters.</p>
          )}
        </div>
        <div>
          <label className={LABEL} htmlFor={`type-${draft.id}`}>Field Type</label>
          <select
            id={`type-${draft.id}`}
            className={INPUT}
            value={draft.type}
            onChange={(e) => upd("type", e.target.value)}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Description + Placeholder */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL} htmlFor={`desc-${draft.id}`}>
            Description <span className="normal-case font-normal text-muted-foreground/70">(admin note)</span>
          </label>
          <input
            id={`desc-${draft.id}`}
            className={INPUT}
            value={draft.description || ""}
            onChange={(e) => upd("description", e.target.value)}
            placeholder="What is this field for?"
          />
        </div>
        <div>
          <label className={LABEL} htmlFor={`placeholder-${draft.id}`}>Placeholder</label>
          <input
            id={`placeholder-${draft.id}`}
            className={INPUT}
            value={draft.placeholder || ""}
            onChange={(e) => upd("placeholder", e.target.value)}
            placeholder="Hint shown inside the input"
          />
        </div>
      </div>

      {/* Row 3: Default Value */}
      {draft.type !== "boolean" && draft.type !== "tags" && (
        <div>
          <label className={LABEL} htmlFor={`defVal-${draft.id}`}>
            Default Value <span className="normal-case font-normal text-muted-foreground/70">(optional, pre-filled in the form)</span>
          </label>
          <input
            id={`defVal-${draft.id}`}
            className={INPUT}
            value={draft.defaultValue || ""}
            onChange={(e) => upd("defaultValue", e.target.value)}
            placeholder="Leave blank for no default"
          />
        </div>
      )}

      {/* Row 4: Type-specific constraints */}
      {hasOptions && (
        <div>
          <label className={LABEL} htmlFor={`opts-${draft.id}`}>
            {draft.type === "tags" ? "Predefined Tags" : "Options"}{" "}
            <span className="normal-case font-normal text-muted-foreground/70">(comma-separated)</span>
          </label>
          <input
            id={`opts-${draft.id}`}
            className={INPUT}
            value={draft._optionsString}
            onChange={(e) => upd("_optionsString", e.target.value)}
            placeholder={draft.type === "tags" ? "e.g. Student, Alumni, Donor" : "Option A, Option B, Option C"}
          />
          {draft.type === "tags" && (
            <p className="text-[10px] text-muted-foreground mt-1">Users can also type and add custom tags not in this list.</p>
          )}
        </div>
      )}

      {hasTextLength && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL} htmlFor={`minlen-${draft.id}`}>Min Length</label>
            <input
              id={`minlen-${draft.id}`}
              type="number"
              min={0}
              className={INPUT}
              value={draft.minLength ?? ""}
              onChange={(e) => upd("minLength", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 2"
            />
          </div>
          <div>
            <label className={LABEL} htmlFor={`maxlen-${draft.id}`}>Max Length</label>
            <input
              id={`maxlen-${draft.id}`}
              type="number"
              min={1}
              className={INPUT}
              value={draft.maxLength ?? ""}
              onChange={(e) => upd("maxLength", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 100"
            />
          </div>
        </div>
      )}

      {hasNumRange && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={LABEL} htmlFor={`min-${draft.id}`}>Min Value</label>
            <input
              id={`min-${draft.id}`}
              type="number"
              className={INPUT}
              value={draft.min ?? ""}
              onChange={(e) => upd("min", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 0"
            />
          </div>
          <div>
            <label className={LABEL} htmlFor={`max-${draft.id}`}>Max Value</label>
            <input
              id={`max-${draft.id}`}
              type="number"
              className={INPUT}
              value={draft.max ?? ""}
              onChange={(e) => upd("max", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 999"
            />
          </div>
          <div>
            <label className={LABEL} htmlFor={`mask-${draft.id}`}>
              Input Mask <span className="normal-case font-normal text-muted-foreground/70">(optional)</span>
            </label>
            <input
              id={`mask-${draft.id}`}
              className={INPUT}
              value={draft.mask || ""}
              onChange={(e) => upd("mask", e.target.value)}
              placeholder="e.g. 99999-9999999-9"
            />
          </div>
        </div>
      )}

      {/* Row 5: Flags + action buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 select-none text-sm font-medium text-foreground">
          <button
            type="button"
            onClick={() => upd("required", !draft.required)}
            aria-label="Toggle field required status"
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
              draft.required ? "bg-primary border-primary" : "border-border bg-background"
            }`}
          >
            {draft.required && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
          </button>
          <span>Required</span>
        </div>
        <div className="flex items-center gap-2 select-none text-sm font-medium text-foreground">
          <button
            type="button"
            onClick={() => upd("unique", !draft.unique)}
            aria-label="Toggle field uniqueness guard"
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
              draft.unique ? "bg-primary border-primary" : "border-border bg-background"
            }`}
          >
            {draft.unique && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
          </button>
          <span>Unique</span>
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-card"
          aria-label="Cancel editing"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40 transition-colors hover:bg-primary/90"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Save Field</span>
        </button>
      </div>
    </div>
  );
}

interface FieldRowProps {
  field: CustomFieldConfig;
  isDragging: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  onEdit: () => void;
  onDelete: () => void;
  onToggleShowInForm: (id: string, val: boolean) => void;
}

/**
 * Single custom field row displayed in the list.
 */
function FieldRow({
  field,
  isDragging,
  dragHandleProps,
  onEdit,
  onDelete,
  onToggleShowInForm
}: FieldRowProps): React.JSX.Element {
  const [confirming, setConfirming] = useState<boolean>(false);
  const typeLabel = FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type;
  const optionCount = normalizeOptions(field.options).length;

  if (confirming) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50">
        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
        <p className="flex-1 text-xs text-red-700 dark:text-red-400 font-medium">
          Delete <strong>{field.label}</strong>? This cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-card"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            onDelete();
          }}
          className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-card transition-all
        ${isDragging ? "shadow-lg border-primary/40 bg-primary/5" : "border-border hover:border-primary/30"}`}
    >
      {/* Drag handle */}
      <span
        {...(dragHandleProps || {})}
        aria-label="Drag to reorder field"
        className="flex-shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </span>

      {/* Show-in-form toggle */}
      <button
        type="button"
        title="Show in Add Contact form"
        onClick={() => onToggleShowInForm(field.id, !(field.showInForm !== false))}
        className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer
          ${field.showInForm !== false ? "bg-primary border-primary" : "border-border bg-background"}`}
      >
        {field.showInForm !== false && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
      </button>

      {/* Field metadata */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{field.label}</span>
          <span className="text-[11px] text-muted-foreground">{typeLabel}</span>
          {field.required && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50">
              Required
            </span>
          )}
          {field.unique && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
              Unique
            </span>
          )}
          {optionCount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              [{optionCount} {field.type === "tags" ? "tags" : "options"}]
            </span>
          )}
          {field.type === "number" && field.mask && (
            <span className="text-[10px] text-muted-foreground font-mono">mask: {field.mask}</span>
          )}
        </div>
        {field.description && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{field.description}</p>}
      </div>

      {/* Actions */}
      <button
        type="button"
        onClick={onEdit}
        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        aria-label={`Edit ${field.label}`}
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
        aria-label={`Delete ${field.label}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface CustomFieldsBuilderProps {
  fields?: CustomFieldConfig[];
  droppableId?: string;
  onChange: (fields: CustomFieldConfig[]) => void;
}

/**
 * Full custom fields manager component. Supports add, edit, drag-reorder, and
 * delete (with inline confirmation) of custom fields for a given tab.
 * @param props Component properties.
 * @returns React element.
 */
export default function CustomFieldsBuilder({
  fields = [],
  droppableId = "custom-fields",
  onChange
}: CustomFieldsBuilderProps): React.JSX.Element {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState<boolean>(false);
  const [draft, setDraft] = useState<CustomFieldConfig | null>(null);

  const existingLabels = fields.map((f) => f.label);

  const startAdd = (): void => {
    setAdding(true);
    setEditingId(null);
    setDraft(newField());
  };

  const handleSaveNew = (f: CustomFieldConfig): void => {
    onChange([...fields, f]);
    setAdding(false);
    setDraft(null);
  };

  const handleSaveEdit = (f: CustomFieldConfig): void => {
    onChange(fields.map((x) => (x.id === f.id ? f : x)));
    setEditingId(null);
  };

  const handleDelete = (id: string): void => {
    onChange(fields.filter((f) => f.id !== id));
  };

  const handleToggleShowInForm = (id: string, val: boolean): void => {
    onChange(fields.map((f) => (f.id === id ? { ...f, showInForm: val } : f)));
  };

  const handleDragEnd = (result: DropResult): void => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = Array.from(fields);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-left">
        <div>
          <h4 className="text-sm font-bold text-foreground">Custom Fields</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add your own fields. They appear below the built-in fields in this tab.
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={startAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Field</span>
          </button>
        )}
      </div>

      {/* Field list */}
      {fields.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed border-border text-muted-foreground gap-2 bg-card">
          <Plus className="w-6 h-6 opacity-30" />
          <p className="text-xs font-semibold">No custom fields yet</p>
          <p className="text-[11px] text-center max-w-xs px-4">
            Click &ldquo;Add Field&rdquo; to create fields that will appear in the contact form.
          </p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={droppableId}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {fields.map((field, index) =>
                  editingId === field.id ? (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      existingLabels={existingLabels}
                      onSave={handleSaveEdit}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                      {(drag, snapshot) => (
                        <div ref={drag.innerRef} {...drag.draggableProps}>
                          <FieldRow
                            field={field}
                            isDragging={snapshot.isDragging}
                            dragHandleProps={drag.dragHandleProps}
                            onEdit={() => {
                              setEditingId(field.id);
                              setAdding(false);
                            }}
                            onDelete={() => handleDelete(field.id)}
                            onToggleShowInForm={handleToggleShowInForm}
                          />
                        </div>
                      )}
                    </Draggable>
                  )
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* New field editor */}
      {adding && draft && (
        <FieldEditor
          field={draft}
          existingLabels={existingLabels}
          onSave={handleSaveNew}
          onCancel={() => {
            setAdding(false);
            setDraft(null);
          }}
        />
      )}
    </div>
  );
}
