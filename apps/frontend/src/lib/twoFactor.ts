import {
  resolveNotificationChannel,
  type GlobalSettings,
} from "@mms/shared";
import { sendEmailNotification, sendSmsNotification } from "./notifications";

const PENDING_KEY = "mms_2fa_pending";
const VERIFIED_KEY = "mms_2fa_verified";
const CODE_KEY = "mms_2fa_code";
const CODE_EXP_KEY = "mms_2fa_code_exp";
const CODE_TTL_MS = 10 * 60 * 1000;

export function is2FAPending(): boolean {
  return sessionStorage.getItem(PENDING_KEY) === "1";
}

export function is2FAVerified(): boolean {
  return sessionStorage.getItem(VERIFIED_KEY) === "1";
}

export function clear2FAState(): void {
  sessionStorage.removeItem(PENDING_KEY);
  sessionStorage.removeItem(VERIFIED_KEY);
  sessionStorage.removeItem(CODE_KEY);
  sessionStorage.removeItem(CODE_EXP_KEY);
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Starts a 2FA challenge and returns the one-time code (for dispatch/logging). */
export function start2FAChallenge(): string {
  const code = generateCode();
  sessionStorage.setItem(PENDING_KEY, "1");
  sessionStorage.removeItem(VERIFIED_KEY);
  sessionStorage.setItem(CODE_KEY, code);
  sessionStorage.setItem(CODE_EXP_KEY, String(Date.now() + CODE_TTL_MS));
  return code;
}

export function verify2FACode(input: string): boolean {
  const stored = sessionStorage.getItem(CODE_KEY);
  const exp = Number(sessionStorage.getItem(CODE_EXP_KEY));
  if (!stored || !Number.isFinite(exp) || Date.now() > exp) return false;
  return input.replace(/\s/g, "") === stored;
}

export function mark2FAVerified(): void {
  sessionStorage.setItem(VERIFIED_KEY, "1");
  sessionStorage.removeItem(PENDING_KEY);
  sessionStorage.removeItem(CODE_KEY);
  sessionStorage.removeItem(CODE_EXP_KEY);
}

export interface TwoFactorDispatchResult {
  channel: "email" | "sms" | "none";
  delivered: boolean;
}

/**
 * Dispatches a 2FA code when master notification toggles allow it.
 * Returns channel used; logs code in dev when no channel is enabled.
 */
export async function dispatch2FACode(
  settings: GlobalSettings,
  email: string,
  code: string
): Promise<TwoFactorDispatchResult> {
  const channel = resolveNotificationChannel(settings);

  if (channel === "email") {
    const delivered = await sendEmailNotification(
      {
        to: email,
        subject: "MMS verification code",
        body: `Your verification code is ${code}. It expires in 10 minutes.`,
      },
      settings
    );
    return { channel: "email", delivered };
  }

  if (channel === "sms") {
    const delivered = sendSmsNotification(
      {
        to: email,
        body: `MMS verification code: ${code}`,
      },
      settings
    );
    return { channel: "sms", delivered };
  }

  if (import.meta.env.DEV) {
    console.info(`[MMS] 2FA code (notifications off): ${code}`);
  }
  return { channel: "none", delivered: false };
}
