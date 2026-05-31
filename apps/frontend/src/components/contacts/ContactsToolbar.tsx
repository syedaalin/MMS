import React from "react";
import { Search, SlidersHorizontal, RefreshCw, X } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ColumnCustomizer, { ColumnSpec } from "./ColumnCustomizer";
import { useContactConfig } from "@/lib/ContactConfigContext";

interface SortOption {
  field: string;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { field: "name", label: "Name" },
  { field: "city", label: "City" },
  { field: "createdAt", label: "Date Added" },
  { field: "updatedAt", label: "Last Updated" },
];

interface ContactsToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  filterGender: string;
  onGenderChange: (gender: string) => void;
  sortField: string;
  onSort: (field: string) => void;
  tableColumns: ColumnSpec[];
  onColumnsChange: (columns: ColumnSpec[]) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  onClearFilters: () => void;
}

/**
 * ContactsToolbar component rendering a search bar,
 * advanced filter/sorting menus, and column customization.
 * @param props Component properties.
 * @returns React element.
 */
export default function ContactsToolbar({
  search,
  onSearchChange,
  filterGender,
  onGenderChange,
  sortField,
  onSort,
  tableColumns,
  onColumnsChange,
  hasActiveFilters,
  activeFilterCount,
  onClearFilters,
}: ContactsToolbarProps): React.JSX.Element {
  const { availableColumns } = useContactConfig();

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name, phone, email, ID, city, area…"
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search query"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Filters + Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                activeFilterCount > 0
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
            <DropdownMenuLabel className="text-xs text-foreground">Gender</DropdownMenuLabel>
            {["", "male", "female", "other"].map((g) => (
              <DropdownMenuCheckboxItem
                key={g}
                checked={filterGender === g}
                onCheckedChange={() => onGenderChange(g)}
                className="text-sm"
              >
                {g ? g.charAt(0).toUpperCase() + g.slice(1) : "All genders"}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuLabel className="text-xs text-foreground">Sort by</DropdownMenuLabel>
            {SORT_OPTIONS.map((s) => (
              <DropdownMenuCheckboxItem
                key={s.field}
                checked={sortField === s.field}
                onCheckedChange={() => onSort(s.field)}
                className="text-sm"
              >
                {s.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}

        {/* Column customizer */}
        <ColumnCustomizer
          columns={tableColumns}
          onChange={onColumnsChange}
          availableColumns={availableColumns}
        />
      </div>
    </div>
  );
}
