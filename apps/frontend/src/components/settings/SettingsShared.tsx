import React from 'react';
import type { AppTranslationKey } from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export const SETTINGS_WIDTH = {
  narrow: 'max-w-2xl',
  medium: 'max-w-3xl',
  wide: 'max-w-4xl',
} as const;

interface SettingsPanelProps {
  width?: keyof typeof SETTINGS_WIDTH;
  /** Translation key for supplementary panel copy (`*Desc` sibling). */
  introKey: AppTranslationKey;
  isDirty?: boolean;
  saved?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Consistent settings tab shell — intro, status, content, sticky actions.
 */
export function SettingsPanel({
  width = 'medium',
  introKey,
  isDirty = false,
  saved = false,
  children,
  footer,
}: SettingsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const introDescKey = `${introKey}Desc` as AppTranslationKey;

  return (
    <div className={cn(SETTINGS_WIDTH[width], 'space-y-5 pb-2')}>
      {/* Title lives in sidebar / accordion — avoid repeating it here */}
      <SettingsPanelIntro description={t(introDescKey)} className="hidden lg:block" />
      <SettingsStatusBadges isDirty={isDirty} saved={saved} />
      <div className="space-y-5">{children}</div>
      {footer}
    </div>
  );
}

interface SettingsPanelIntroProps {
  description: string;
  className?: string;
}

export function SettingsPanelIntro({ description, className }: SettingsPanelIntroProps): React.JSX.Element {
  return (
    <p
      className={cn(
        'rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs leading-relaxed text-muted-foreground sm:px-5',
        className,
      )}
    >
      {description}
    </p>
  );
}

export function SettingsStatusBadges({
  isDirty,
  saved,
}: {
  isDirty: boolean;
  saved: boolean;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!isDirty && !saved) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-live="polite">
      {isDirty && (
        <span className="inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          {t('settings.unsavedChanges')}
        </span>
      )}
      {saved && !isDirty && (
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {t('settings.savedBadge')}
        </span>
      )}
    </div>
  );
}

interface SettingsToggleRowProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SettingsToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: SettingsToggleRowProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/10 px-3 py-3">
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="text-sm font-semibold text-foreground cursor-pointer">
          {label}
        </Label>
        {description ? (
          <p id={`${id}-desc`} className="mt-0.5 text-xs text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={description ? `${id}-desc` : undefined}
      />
    </div>
  );
}

export function SettingsFieldGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>{children}</div>;
}

export function SettingsCallout({
  variant = 'info',
  children,
}: {
  variant?: 'info' | 'warning';
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2.5 text-xs leading-relaxed',
        variant === 'warning'
          ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300'
          : 'border-border bg-muted/30 text-muted-foreground',
      )}
    >
      {children}
    </div>
  );
}

const META_BADGE_STYLES = {
  primary: 'border-primary/30 bg-primary/10 text-primary',
  muted: 'border-border bg-muted text-muted-foreground',
  warning:
    'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300',
  success:
    'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
  destructive:
    'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300',
} as const;

/** Compact status chip for settings section summaries. */
export function SettingsMetaBadge({
  variant = 'muted',
  children,
}: {
  variant?: keyof typeof META_BADGE_STYLES;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'rounded-md border px-2 py-0.5 text-[11px] font-medium',
        META_BADGE_STYLES[variant],
      )}
    >
      {children}
    </span>
  );
}

/** Primary + accent swatches with hex values for theme summary rows. */
export function SettingsColoursBadge({
  primaryColor,
  secondaryColor,
  ariaLabel,
}: {
  primaryColor: string;
  secondaryColor: string;
  ariaLabel: string;
}): React.JSX.Element {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
      aria-label={ariaLabel}
    >
      <span
        className="h-3 w-3 shrink-0 rounded-full border border-border"
        style={{ backgroundColor: primaryColor }}
        aria-hidden
      />
      <span>{primaryColor}</span>
      <span aria-hidden>·</span>
      <span
        className="h-3 w-3 shrink-0 rounded-full border border-border"
        style={{ backgroundColor: secondaryColor }}
        aria-hidden
      />
      <span>{secondaryColor}</span>
    </span>
  );
}
