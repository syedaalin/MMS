import { getObject } from '../db/database.js';
import {
  mergeGlobalSettings,
  parseSessionTimeoutMinutes,
  validatePasswordPolicy,
  type GlobalSettings,
} from '@mms/shared';

/** Loads merged global settings from the objects store. */
export async function loadGlobalSettings(): Promise<GlobalSettings> {
  const raw = await getObject('global_settings');
  return mergeGlobalSettings(raw as Partial<GlobalSettings> | null);
}

/** JWT `expiresIn` string from session timeout preference. */
export async function getJwtExpiresIn(): Promise<string> {
  const settings = await loadGlobalSettings();
  return `${parseSessionTimeoutMinutes(settings.sessionTimeout)}m`;
}

/**
 * Validates password against stored policy. Throws Error with statusCode 400 when invalid.
 */
export async function assertPasswordMeetsPolicy(password: string): Promise<void> {
  const settings = await loadGlobalSettings();
  const result = validatePasswordPolicy(password, settings.passwordPolicy);
  if (!result.valid) {
    const err = new Error(result.message);
    (err as Error & { statusCode: number }).statusCode = 400;
    throw err;
  }
}
