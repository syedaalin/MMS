import type { AppTranslationKey } from './appTranslations.js';
import { parseTenantScopedStorageKey } from './tenantStorage.js';

export type WorkspaceBackupStatus = 'success';

/** Local backup history entry (device export log). */
export interface WorkspaceBackupRecord {
  id: string;
  name: string;
  date: string;
  size: string;
  status: WorkspaceBackupStatus;
  /** Serialized export JSON — omitted when entry exceeds size cap. */
  data?: string;
}

export const DEFAULT_BACKUP_HISTORY: WorkspaceBackupRecord[] = [];

/** Max history entries kept on device. */
export const BACKUP_HISTORY_MAX = 10;

/** Max JSON payload stored per history row (bytes). */
export const BACKUP_HISTORY_MAX_BYTES = 512_000;

/** Formats byte size for backup history display. */
export function formatBackupSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** ISO-like display timestamp for backup history. */
export function formatBackupTimestamp(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.toISOString().slice(0, 10)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Default download filename for a workspace export. */
export function buildBackupFileName(date: Date): string {
  return `mms_backup_${date.toISOString().slice(0, 10)}.json`;
}

/** Extracts logical storage key from an exported localStorage key. */
export function extractLogicalStorageKey(key: string): string | null {
  if (!key.startsWith('mms_')) return null;
  const stripped = key.slice(4);
  const tenantParsed = parseTenantScopedStorageKey(stripped);
  if (tenantParsed) return tenantParsed.logicalKey;
  return stripped;
}

/** Remaps exported keys to the active workspace localStorage prefix. */
export function remapBackupKeysToPrefix(
  raw: Record<string, string>,
  targetPrefix: string,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const logical = extractLogicalStorageKey(key);
    if (!logical) continue;
    result[`${targetPrefix}${logical}`] = value;
  }
  return result;
}

export type BackupValidationResult =
  | { ok: true; data: Record<string, string> }
  | { ok: false; errorKey: AppTranslationKey };

/**
 * Validates exported workspace JSON before restore.
 * Accepts tenant-scoped or apex `mms_` keys and remaps to `targetPrefix`.
 */
export function validateWorkspaceBackupJson(
  jsonString: string,
  targetPrefix: string,
): BackupValidationResult {
  try {
    const parsed: unknown = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, errorKey: 'backup.invalidFormat' };
    }

    const raw: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value !== 'string') {
        return { ok: false, errorKey: 'backup.invalidFormat' };
      }
      raw[key] = value;
    }

    if (Object.keys(raw).length === 0) {
      return { ok: false, errorKey: 'backup.emptyBackup' };
    }

    const remapped = remapBackupKeysToPrefix(raw, targetPrefix);
    if (Object.keys(remapped).length === 0) {
      return { ok: false, errorKey: 'backup.invalidFormat' };
    }

    return { ok: true, data: remapped };
  } catch {
    return { ok: false, errorKey: 'backup.invalidFormat' };
  }
}

/** Prepends a new backup entry and enforces history limits. */
export function appendBackupHistory(
  history: WorkspaceBackupRecord[],
  entry: WorkspaceBackupRecord,
  max = BACKUP_HISTORY_MAX,
): WorkspaceBackupRecord[] {
  return [entry, ...history].slice(0, max);
}
