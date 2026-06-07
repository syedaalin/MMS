import {
  canSendEmailNotifications,
  canSendSmsNotifications,
  type GlobalSettings,
} from "@mms/shared";
import { getGlobalSettings } from "./db";
import { sendVerificationCodeEmail } from "./emailIntegrationApi";

export interface NotificationPayload {
  to: string;
  subject: string;
  body: string;
}

/**
 * Sends a verification code email via the backend SMTP integration when configured.
 */
export async function sendEmailNotification(
  payload: NotificationPayload,
  settings: GlobalSettings = getGlobalSettings()
): Promise<boolean> {
  if (!canSendEmailNotifications(settings)) {
    return false;
  }

  const codeMatch = payload.body.match(/\b(\d{4,8})\b/);
  if (codeMatch && payload.subject.toLowerCase().includes('verification')) {
    const delivered = await sendVerificationCodeEmail(codeMatch[1]);
    if (delivered) return true;
  }

  if (import.meta.env.DEV) {
    console.info(`[MMS Email] To: ${payload.to} | ${payload.subject}`);
  }
  return false;
}

/**
 * Attempts to send an SMS notification if the global master toggle allows it.
 */
export function sendSmsNotification(
  payload: Pick<NotificationPayload, "to" | "body">,
  settings: GlobalSettings = getGlobalSettings()
): boolean {
  if (!canSendSmsNotifications(settings)) {
    return false;
  }
  if (import.meta.env.DEV) {
    console.info(`[MMS SMS] To: ${payload.to}`);
  }
  return true;
}
