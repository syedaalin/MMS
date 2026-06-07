import type { AppTranslationKey } from "./appTranslations.js";
import { translateApp, translateAppParams } from "./appTranslations.js";
import type { GlobalSettings } from "./settingsTypes.js";

export type PasswordPolicyLevel = "basic" | "medium" | "strong";

export type ThemeMode = GlobalSettings["theme"];

export const THEME_MODE_VALUES = ["light", "dark", "system"] as const;

/** Display mode options for global settings theme picker. */
export const THEME_MODE_OPTIONS: readonly {
  value: ThemeMode;
  labelKey: AppTranslationKey;
}[] = [
  { value: "light", labelKey: "global.themeLight" },
  { value: "dark", labelKey: "global.themeDark" },
  { value: "system", labelKey: "global.themeSystem" },
] as const;

/** Coerces stored theme mode to a supported value. */
export function normalizeThemeMode(value: string | undefined): ThemeMode {
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

/** Resolves light/dark chrome from stored theme mode and OS preference. */
export function resolveBrandingThemeMode(
  theme: ThemeMode,
  systemPrefersDark: boolean,
): "light" | "dark" {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return systemPrefersDark ? "dark" : "light";
}

/** Human-readable display-mode label for settings summary chips (incl. system resolve). */
export function formatThemeDisplayModeSummary(
  displayMode: ThemeMode,
  previewMode: "light" | "dark",
  language: string,
): string {
  if (displayMode === "system") {
    const resolved = translateApp(
      previewMode === "dark" ? "global.themeDark" : "global.themeLight",
      language,
    );
    return translateAppParams("theme.displayModeSystemResolved", language, { resolved });
  }
  const labelKey =
    THEME_MODE_OPTIONS.find((opt) => opt.value === displayMode)?.labelKey ?? "global.themeSystem";
  return translateApp(labelKey, language);
}

/** Allowed session timeout values (minutes) in global settings UI. */
export const SESSION_TIMEOUT_VALUES = ["15", "30", "60", "120", "480"] as const;

export type SessionTimeoutValue = (typeof SESSION_TIMEOUT_VALUES)[number];

/** Session timeout presets for global settings UI (value + translation key). */
export const SESSION_TIMEOUT_PRESETS: readonly {
  value: SessionTimeoutValue;
  labelKey: AppTranslationKey;
}[] = [
  { value: "15", labelKey: "global.timeout15" },
  { value: "30", labelKey: "global.timeout30" },
  { value: "60", labelKey: "global.timeout60" },
  { value: "120", labelKey: "global.timeout120" },
  { value: "480", labelKey: "global.timeout480" },
] as const;

/** Coerces stored session timeout to a supported select value. */
export function normalizeSessionTimeout(value: string | number | undefined): SessionTimeoutValue {
  const raw = String(value ?? "60");
  return (SESSION_TIMEOUT_VALUES as readonly string[]).includes(raw)
    ? (raw as SessionTimeoutValue)
    : "60";
}

/** Coerces stored password policy to a supported level. */
export function normalizePasswordPolicy(value: string | undefined): PasswordPolicyLevel {
  if (value === "basic" || value === "medium" || value === "strong") return value;
  return "strong";
}

/** Parses session timeout minutes from global settings (clamped 1–480). */
export function parseSessionTimeoutMinutes(value: string | number | undefined): number {
  return parseInt(normalizeSessionTimeout(value), 10);
}

/** Human-readable requirements for the active password policy. */
export function getPasswordPolicyHint(policy: string): string {
  switch (policy as PasswordPolicyLevel) {
    case "basic":
      return "At least 6 characters.";
    case "medium":
      return "At least 8 characters with at least one number.";
    case "strong":
      return "At least 12 characters with uppercase, lowercase, number, and symbol.";
    default:
      return getPasswordPolicyHint("strong");
  }
}

export type PasswordPolicyErrorKey = Extract<
  AppTranslationKey,
  | "global.passwordPolicyErrorMin6"
  | "global.passwordPolicyErrorMin8"
  | "global.passwordPolicyErrorNeedNumber"
  | "global.passwordPolicyErrorMin12"
  | "global.passwordPolicyErrorNeedUpper"
  | "global.passwordPolicyErrorNeedLower"
  | "global.passwordPolicyErrorNeedSymbol"
>;

const PASSWORD_POLICY_ERROR_MESSAGES: Record<PasswordPolicyErrorKey, string> = {
  "global.passwordPolicyErrorMin6": "Password must be at least 6 characters.",
  "global.passwordPolicyErrorMin8": "Password must be at least 8 characters.",
  "global.passwordPolicyErrorNeedNumber": "Password must include at least one number.",
  "global.passwordPolicyErrorMin12": "Password must be at least 12 characters.",
  "global.passwordPolicyErrorNeedUpper": "Password must include an uppercase letter.",
  "global.passwordPolicyErrorNeedLower": "Password must include a lowercase letter.",
  "global.passwordPolicyErrorNeedSymbol": "Password must include a symbol.",
};

export interface PasswordPolicyValidation {
  valid: boolean;
  errorKey?: PasswordPolicyErrorKey;
  message: string;
}

/**
 * Validates a password against the configured global policy level.
 */
export function validatePasswordPolicy(password: string, policy: string): PasswordPolicyValidation {
  const level = (policy as PasswordPolicyLevel) || "strong";

  const fail = (errorKey: PasswordPolicyErrorKey): PasswordPolicyValidation => ({
    valid: false,
    errorKey,
    message: PASSWORD_POLICY_ERROR_MESSAGES[errorKey],
  });

  if (level === "basic") {
    if (password.length < 6) return fail("global.passwordPolicyErrorMin6");
    return { valid: true, message: "" };
  }

  if (level === "medium") {
    if (password.length < 8) return fail("global.passwordPolicyErrorMin8");
    if (!/\d/.test(password)) return fail("global.passwordPolicyErrorNeedNumber");
    return { valid: true, message: "" };
  }

  if (password.length < 12) return fail("global.passwordPolicyErrorMin12");
  if (!/[A-Z]/.test(password)) return fail("global.passwordPolicyErrorNeedUpper");
  if (!/[a-z]/.test(password)) return fail("global.passwordPolicyErrorNeedLower");
  if (!/\d/.test(password)) return fail("global.passwordPolicyErrorNeedNumber");
  if (!/[^A-Za-z0-9]/.test(password)) return fail("global.passwordPolicyErrorNeedSymbol");
  return { valid: true, message: "" };
}

/** Translation key for the active password policy hint in settings UI. */
export function getPasswordPolicyHintKey(policy: string): AppTranslationKey {
  switch (normalizePasswordPolicy(policy)) {
    case "basic":
      return "global.passwordPolicyHintBasic";
    case "medium":
      return "global.passwordPolicyHintMedium";
    default:
      return "global.passwordPolicyHintStrong";
  }
}

/**
 * Whether the signed-in user must complete 2FA before accessing the app.
 * Global `twoFactor` enforces admin logins; per-user flag can extend later.
 */
export function requiresTwoFactor(
  settings: GlobalSettings,
  user: { role: string; twoFactorEnabled?: boolean } | null
): boolean {
  if (!user) return false;
  if (user.twoFactorEnabled) return true;
  return settings.twoFactor === true && user.role === "admin";
}

/** Master email notifications gate from global settings. */
export function canSendEmailNotifications(settings: GlobalSettings): boolean {
  return settings.emailNotifications === true;
}

/** Master SMS notifications gate from global settings. */
export function canSendSmsNotifications(settings: GlobalSettings): boolean {
  return settings.smsNotifications === true;
}

export type NotificationChannel = "email" | "sms" | "none";

/**
 * Primary outbound channel for verification codes and system alerts.
 * Email takes precedence when both master toggles are enabled.
 */
export function resolveNotificationChannel(settings: GlobalSettings): NotificationChannel {
  if (canSendEmailNotifications(settings)) return "email";
  if (canSendSmsNotifications(settings)) return "sms";
  return "none";
}

/** Masks an email for display, e.g. `a***@madrasa.app`. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.charAt(0);
  return `${visible}***@${domain}`;
}
