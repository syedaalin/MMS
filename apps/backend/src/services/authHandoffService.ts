import { randomBytes } from 'node:crypto';
import type { AuthResult } from './authService.js';

interface HandoffEntry {
  result: AuthResult;
  expiresAt: number;
}

const HANDOFF_TTL_MS = 2 * 60 * 1000;
const handoffs = new Map<string, HandoffEntry>();

/**
 * One-time auth handoff for cross-subdomain redirect after onboarding.
 */
export function createAuthHandoff(result: AuthResult): string {
  const code = randomBytes(24).toString('hex');
  handoffs.set(code, {
    result,
    expiresAt: Date.now() + HANDOFF_TTL_MS,
  });
  return code;
}

export function exchangeAuthHandoff(code: string): AuthResult | null {
  const entry = handoffs.get(code);
  if (!entry) return null;
  handoffs.delete(code);
  if (Date.now() > entry.expiresAt) return null;
  return entry.result;
}
