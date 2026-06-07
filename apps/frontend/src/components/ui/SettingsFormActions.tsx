import React from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SettingsFormActionsProps {
  resetLabel: string;
  saveLabel: string;
  savingLabel?: string;
  savedLabel?: string;
  onReset: () => void;
  onSave?: () => void;
  dirty?: boolean;
  saving?: boolean;
  saved?: boolean;
  resetDisabled?: boolean;
  saveDisabled?: boolean;
  showSave?: boolean;
}

/**
 * Consistent Save + Reset actions for `/settings` panels.
 */
export default function SettingsFormActions({
  resetLabel,
  saveLabel,
  savingLabel = "Saving…",
  savedLabel = "Saved",
  onReset,
  onSave,
  dirty = false,
  saving = false,
  saved = false,
  resetDisabled = false,
  saveDisabled = false,
  showSave = true,
}: SettingsFormActionsProps): React.JSX.Element {
  const saveText = saving ? savingLabel : saved ? savedLabel : saveLabel;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 pt-1",
        dirty &&
          "sticky bottom-0 z-10 -mx-1 mt-2 border-t border-border bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80",
      )}
    >
      <button
        type="button"
        onClick={onReset}
        disabled={resetDisabled || saving}
        className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>{resetLabel}</span>
      </button>
      {showSave && onSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled || !dirty || saving}
          className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saveText}</span>
        </button>
      )}
    </div>
  );
}
