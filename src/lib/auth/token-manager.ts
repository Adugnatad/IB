/**
 * Token manager: coordinates storage and JWT expiry for session lifecycle.
 * Refresh tokens are single-use; after a successful refresh the new pair replaces the old.
 */
import { tokenStorage } from './token-storage';
import { getAccessTokenExpiryMs, isTokenExpiredOrExpiringSoon } from './jwt';
import { getApiBaseUrl } from '@/config/env';
import { AUTH_ENDPOINTS, TOKEN_CONFIG } from '@/config/env';

export type TokenPair = { accessToken: string; refreshToken: string };

let refreshPromise: Promise<TokenPair | null> | null = null;

function clearTokens(): void {
  tokenStorage.clearAll();
}

/**
 * Persists new token pair after login or refresh. Caller must ensure refresh is single-use on backend.
 */
export function setTokenPair(pair: TokenPair): void {
  tokenStorage.setAccessToken(pair.accessToken);
  tokenStorage.setRefreshToken(pair.refreshToken);
}

/**
 * Returns current access token or null.
 */
export function getAccessToken(): string | null {
  return tokenStorage.getAccessToken();
}

/**
 * Returns ms until access token expires, or 0 if expired/missing.
 */
export function getAccessTokenTtlMs(): number {
  const token = tokenStorage.getAccessToken();
  if (!token) return 0;
  const expiry = getAccessTokenExpiryMs(token);
  if (expiry == null) return 0;
  const ttl = expiry - Date.now();
  return Math.max(0, ttl);
}

/**
 * True if access token is expired or will expire within REFRESH_BEFORE_EXPIRY_MS.
 */
export function shouldRefreshAccessToken(): boolean {
  const token = tokenStorage.getAccessToken();
  if (!token) return false;
  return isTokenExpiredOrExpiringSoon(token, TOKEN_CONFIG.REFRESH_BEFORE_EXPIRY_MS);
}

/**
 * Performs refresh token exchange. Single-use: backend invalidates previous refresh token.
 * Concurrent calls share one in-flight request to avoid race and multiple refresh use.
 */
export async function refreshTokens(): Promise<TokenPair | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  if (refreshPromise) {
    return refreshPromise;
  }

  const base = getApiBaseUrl();
  if (!base) return null;

  refreshPromise = (async (): Promise<TokenPair | null> => {
    try {
      const res = await fetch(`${base}${AUTH_ENDPOINTS.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearTokens();
        return null;
      }

      const data = (await res.json()) as { accessToken?: string; refreshToken?: string };
      const accessToken = data?.accessToken;
      const newRefreshToken = data?.refreshToken;

      if (!accessToken || typeof accessToken !== 'string') {
        clearTokens();
        return null;
      }

      const pair: TokenPair = {
        accessToken,
        refreshToken: typeof newRefreshToken === 'string' ? newRefreshToken : refreshToken,
      };
      setTokenPair(pair);
      return pair;
    } catch {
      clearTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Clears session (e.g. logout or session compromise).
 */
export function clearSession(): void {
  refreshPromise = null;
  clearTokens();
}

export const tokenManager = {
  getAccessToken,
  setTokenPair,
  getAccessTokenTtlMs,
  shouldRefreshAccessToken,
  refreshTokens,
  clearSession,
  hasValidAccessToken(): boolean {
    const t = tokenStorage.getAccessToken();
    return !!t && !isTokenExpiredOrExpiringSoon(t, 0);
  },
  hasRefreshToken(): boolean {
    return tokenStorage.hasRefreshToken();
  },
};
