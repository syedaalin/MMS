import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "./EmptyState";

export interface DataTableColumn<T> {
  key: string;
  label: React.ReactNode;
  className?: string;
  headerClassName?: string;
  render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows?: T[];
  keyField?: keyof T | string;
  loading?: boolean;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  emptyTitle?: string;
  emptyDesc?: string;
  emptyAction?: React.ReactNode;
  footer?: React.ReactNode;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
}

/**
 * DataTable — generic, production-quality table wrapper.
 *
 * @param {DataTableProps<T>} props - The component props.
 * @returns {React.ReactElement} The rendered DataTable.
 */
export default function DataTable<T>({
  columns,
  rows = [],
  keyField = "id",
  loading = false,
  emptyIcon,
  emptyTitle = "No data found",
  emptyDesc = "There are no records to display.",
  emptyAction,
  footer,
  rowClassName,
  onRowClick,
}: DataTableProps<T>): React.ReactElement {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  const handleMouseDown = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();

    const thElement = e.currentTarget.parentElement;
    if (!thElement) return;

    const parentTr = thElement.parentElement;
    if (!parentTr) return;

    // Get current rendered widths of all columns to lock layout
    const initialWidths: Record<string, number> = { ...columnWidths };
    if (Object.keys(columnWidths).length === 0) {
      const ths = parentTr.children;
      columns.forEach((col, idx) => {
        const el = ths[idx] as HTMLElement;
        if (el) {
          initialWidths[col.key] = el.getBoundingClientRect().width;
        }
      });
    }

    const startWidth = initialWidths[colKey] || thElement.getBoundingClientRect().width;
    const startX = e.clientX;

    // Lock initial widths immediately in state
    setColumnWidths(initialWidths);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + deltaX);
      setColumnWidths((prev) => ({
        ...prev,
        [colKey]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table 
          className="min-w-full text-sm" 
          style={{ 
            tableLayout: Object.keys(columnWidths).length > 0 ? "fixed" : "auto", 
            width: Object.keys(columnWidths).length > 0 ? "max-content" : "100%" 
          }}
        >
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap relative group select-none ${col.headerClassName || ""}`}
                  style={{
                    width: columnWidths[col.key] ? `${columnWidths[col.key]}px` : undefined,
                    minWidth: columnWidths[col.key] ? `${columnWidths[col.key]}px` : undefined,
                  }}
                >
                  <div className="truncate pr-3">
                    {col.label}
                  </div>
                  <div
                    onMouseDown={(e) => handleMouseDown(e, col.key)}
                    onDragStart={(e) => e.preventDefault()}
                    className="absolute right-[-5px] top-0 h-full w-2.5 cursor-col-resize select-none bg-transparent hover:bg-primary/20 active:bg-primary/40 transition-colors"
                    style={{ zIndex: 10 }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <Skeleton className="h-4 rounded-md" style={{ width: `${60 + Math.random() * 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16">
                  <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDesc} action={emptyAction} />
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {rows.map((row, i) => {
                  const rowKey = String((row as Record<string, unknown>)[keyField as string] ?? i);
                  return (
                    <motion.tr
                      key={rowKey}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      onClick={() => onRowClick?.(row)}
                      className={`hover:bg-muted/25 transition-colors ${onRowClick ? "cursor-pointer" : ""} ${rowClassName?.(row) || ""}`}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-3 truncate ${col.className || ""}`}
                          style={{
                            width: columnWidths[col.key] ? `${columnWidths[col.key]}px` : undefined,
                            minWidth: columnWidths[col.key] ? `${columnWidths[col.key]}px` : undefined,
                            maxWidth: columnWidths[col.key] ? `${columnWidths[col.key]}px` : undefined,
                          }}
                        >
                          {col.render ? col.render(row) : ((row as Record<string, unknown>)[col.key] as React.ReactNode ?? "—")}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer bar */}
      {(footer !== undefined || (!loading && rows.length > 0)) && (
        <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {typeof footer === "string" ? footer : `${rows.length} record${rows.length !== 1 ? "s" : ""}`}
          </p>
          {typeof footer !== "string" && footer}
        </div>
      )}
    </div>
  );
}
