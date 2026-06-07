/**
 * Builds a `sms:` URI that opens the device Messages app with recipient and body pre-filled.
 * The user must tap Send — the app cannot send SMS silently.
 */
export function buildDeviceSmsUri(phone: string, body = ''): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/[^\d+]/g, '');
  if (normalized.replace(/\D/g, '').length < 8) return null;

  const address = normalized.startsWith('+') ? normalized : normalized;
  if (!body.trim()) return `sms:${address}`;

  return `sms:${address}?body=${encodeURIComponent(body.trim())}`;
}
