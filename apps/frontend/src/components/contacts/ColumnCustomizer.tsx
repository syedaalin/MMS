import React, { useState } from "react";
import { Settings2, GripVertical, Eye, EyeOff, RotateCcw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface ColumnSpec {
  id: string;
  label: string;
  fixed?: boolean;
}

/**
 * Detailed specification of all columns available in the Contacts table.
 */
export const ALL_COLUMNS: ColumnSpec[] = [
  { id: "name", label: "Name", fixed: true },
  { id: "isSyed", label: "Is Syed" },
  { id: "gender", label: "Gender" },
  { id: "dob", label: "Date of Birth" },
  { id: "phone", label: "Phone" },
  { id: "email", label: "Email" },
  { id: "city", label: "City" },
];

/**
 * Array of column IDs that are visible by default.
 */
export const DEFAULT_COLUMNS: string[] = ["name", "isSyed", "phone", "email", "city"];

interface ColumnCustomizerProps {
  columns: ColumnSpec[];
  onChange: (columns: ColumnSpec[]) => void;
  availableColumns?: ColumnSpec[];
}

/**
 * ColumnCustomizer component rendering a popover that enables users to toggle column visibility
 * and drag-and-drop to reorder visible columns.
 * @param props Component properties.
 * @returns React element.
 */
export default function ColumnCustomizer({
  columns,
  onChange,
  availableColumns
}: ColumnCustomizerProps): React.JSX.Element {
  const ALL_COLS = availableColumns || ALL_COLUMNS;
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const toggle = (id: string): void => {
    if (columns.find((c) => c.id === id && c.fixed)) return;
    const exists = columns.find((c) => c.id === id);
    if (exists) {
      onChange(columns.filter((c) => c.id !== id));
    } else {
      const col = ALL_COLS.find((c) => c.id === id);
      if (col) {
        onChange([...columns, col]);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string): void => {
    setDragging(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string): void => {
    e.preventDefault();
    if (id !== dragging) setDragOver(id);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string): void => {
    e.preventDefault();
    if (!dragging || dragging === targetId) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    const items = [...columns];
    const fromIdx = items.findIndex((c) => c.id === dragging);
    const toIdx = items.findIndex((c) => c.id === targetId);
    if (fromIdx !== -1 && toIdx !== -1) {
      const [moved] = items.splice(fromIdx, 1);
      items.splice(toIdx, 0, moved);
      onChange(items);
    }
    setDragging(null);
    setDragOver(null);
  };

  const reset = (): void => {
    onChange(ALL_COLS.filter((c) => DEFAULT_COLUMNS.includes(c.id)));
  };

  const enabledIds = new Set(columns.map((c) => c.id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Columns</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">Columns</h4>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Active columns — draggable */}
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Visible & Order</span>
          {columns.map((col) => (
            <div
              key={col.id}
              draggable={!col.fixed}
              onDragStart={(e) => !col.fixed && handleDragStart(e, col.id)}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              onDragEnd={() => {
                setDragging(null);
                setDragOver(null);
              }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all select-none ${
                dragging === col.id ? "opacity-40" : dragOver === col.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"
              }`}
            >
              <GripVertical className={`w-3.5 h-3.5 flex-shrink-0 ${col.fixed ? "opacity-20" : "text-muted-foreground cursor-grab"}`} />
              <span className="flex-1 text-sm text-foreground text-left">{col.label}</span>
              {col.fixed ? (
                <span className="text-[10px] text-muted-foreground">Fixed</span>
              ) : (
                <button
                  type="button"
                  onClick={() => toggle(col.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Hide column ${col.label}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Hidden columns */}
        {ALL_COLS.filter((c) => !enabledIds.has(c.id)).length > 0 && (
          <div className="space-y-1 pt-1 border-t border-border">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Hidden</span>
            {ALL_COLS.filter((c) => !enabledIds.has(c.id)).map((col) => (
              <button
                type="button"
                key={col.id}
                onClick={() => toggle(col.id)}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <EyeOff className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{col.label}</span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
