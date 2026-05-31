import React, { memo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { GripVertical, Check } from "lucide-react";

/** Human-readable labels for every supported custom field type. */
const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  textarea: "Long Text",
  number: "Number",
  date: "Date",
  select: "Dropdown",
  tags: "Tags",
  boolean: "Yes / No",
  url: "URL",
  email: "Email",
};

export interface FieldDefinition {
  id: string;
  label: string;
  isCustom?: boolean;
  alwaysOn?: boolean;
  type?: string;
  description?: string;
}

interface FieldItemProps {
  field: FieldDefinition;
  isEnabled: boolean;
  isRequired: boolean;
  isUnique: boolean;
  onToggleEnabled: () => void;
  onToggleRequired: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isDragging: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const FieldItem = memo(
  /**
   * FieldItem component rendering a single field setting row.
   */
  function FieldItem({
    field,
    isEnabled,
    isRequired,
    isUnique,
    onToggleEnabled,
    onToggleRequired,
    dragHandleProps,
    isDragging,
    onEdit = undefined,
    onDelete = undefined,
  }: FieldItemProps): React.JSX.Element {
    return (
      <div
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all select-none
          ${
            isDragging
              ? "shadow-lg border-primary/40 bg-primary/5"
              : isEnabled
              ? "border-border bg-card"
              : "border-border/40 bg-muted/20 opacity-55"
          }`}
      >
        {/* Drag handle */}
        <span
          {...(dragHandleProps || {})}
          aria-label="Drag to reorder field"
          className="flex-shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </span>

        {/* Enable toggle */}
        {field.alwaysOn ? (
          <div className="w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center bg-primary border-primary opacity-70 cursor-not-allowed">
            <Check className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggleEnabled}
            className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all cursor-pointer
              ${isEnabled ? "bg-primary border-primary" : "border-border bg-background"}`}
          >
            {isEnabled && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
          </button>
        )}

        {/* Label + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold text-foreground">{field.label}</p>
            {field.isCustom && field.type && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/50">
                Custom · {FIELD_TYPE_LABELS[field.type] || field.type}
              </span>
            )}
            {field.alwaysOn && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Pre-selected
              </span>
            )}
            {isUnique && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
                Unique
              </span>
            )}
          </div>
          {field.description && <p className="text-[11px] text-muted-foreground">{field.description}</p>}
        </div>

        {/* Required toggle */}
        {isEnabled && (
          <button
            type="button"
            onClick={onToggleRequired}
            className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border transition-all
              ${
                isRequired
                  ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400"
                  : "bg-muted border-border text-muted-foreground hover:text-foreground"
              }`}
          >
            {isRequired ? "Required" : "Optional"}
          </button>
        )}
      </div>
    );
  }
);

interface DraggableFieldListProps {
  tabId: string;
  fields: FieldDefinition[];
  enabledSet: Set<string>;
  requiredSet: Set<string>;
  onToggleEnabled: (id: string) => void;
  onToggleRequired: (id: string) => void;
  onReorder: (reordered: FieldDefinition[]) => void;
  isUniqueField?: (tabId: string, fieldId: string) => boolean;
}

/**
 * DraggableFieldList component rendering a sortable set of fields for a tab layout config.
 * @param props Component properties.
 * @returns React element.
 */
export default function DraggableFieldList({
  tabId,
  fields,
  enabledSet,
  requiredSet,
  onToggleEnabled,
  onToggleRequired,
  onReorder,
  isUniqueField
}: DraggableFieldListProps): React.JSX.Element {
  const handleDragEnd = (result: DropResult): void => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = Array.from(fields);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorder(reordered);
  };

  if (fields.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed border-border rounded-lg bg-card">
        No fields available for this tab.
      </p>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={`tab-fields-${tabId}`}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5 bg-card rounded-lg">
            {fields.map((field, index) => (
              <Draggable key={field.id} draggableId={field.id} index={index}>
                {(drag, snapshot) => (
                  <div ref={drag.innerRef} {...drag.draggableProps}>
                    <FieldItem
                      field={field}
                      isEnabled={!!field.alwaysOn || enabledSet.has(field.id)}
                      isRequired={!!field.alwaysOn || requiredSet.has(field.id)}
                      isUnique={isUniqueField?.(tabId, field.id) || false}
                      onToggleEnabled={() => onToggleEnabled(field.id)}
                      onToggleRequired={() => onToggleRequired(field.id)}
                      dragHandleProps={drag.dragHandleProps}
                      isDragging={snapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
