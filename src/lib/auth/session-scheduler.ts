/**
 * Silent refresh: proactively refresh access token before expiry.
 * Schedules next run based on JWT expiry minus REFRESH_BEFORE_EXPIRY_MS.
 */
import { tokenManager } from './token-manager';
import { TOKEN_CONFIG } from '@/config/env';

const MIN_INTERVAL_MS = 60 * 1000;
const MAX_INTERVAL_MS = 60 * 60 * 1000;

let scheduleTimeoutId: ReturnType<typeof setTimeout> | null = null;

function clearSchedule(): void {
  if (scheduleTimeoutId != null) {
    clearTimeout(scheduleTimeoutId);
    scheduleTimeoutId = null;
  }
}

function scheduleNextRefresh(): void {
  clearSchedule();
  if (!tokenManager.hasRefreshToken()) return;

  const ttlMs = tokenManager.getAccessTokenTtlMs();
  if (ttlMs <= 0) {
    tokenManager.refreshTokens().finally(() => scheduleNextRefresh());
    return;
  }

  const buffer = TOKEN_CONFIG.REFRESH_BEFORE_EXPIRY_MS;
  const delay = Math.max(MIN_INTERVAL_MS, Math.min(ttlMs - buffer, MAX_INTERVAL_MS));

  scheduleTimeoutId = setTimeout(() => {
    scheduleTimeoutId = null;
    tokenManager.refreshTokens().finally(() => scheduleNextRefresh());
  }, delay);
}

/**
 * Start proactive refresh scheduling. Call after login or rehydration.
 */
export function startSessionScheduler(): void {
  scheduleNextRefresh();
}

/**
 * Stop scheduling (e.g. on logout).
 */
export function stopSessionScheduler(): void {
  clearSchedule();
}
