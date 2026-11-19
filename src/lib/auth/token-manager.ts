/**
 * Token manager for the local demo session lifecycle.
 */
import { tokenStorage } from './token-storage';
import { decodeJwtPayload, getAccessTokenExpiryMs, isTokenExpiredOrExpiringSoon } from './jwt';
import { TOKEN_CONFIG } from '@/config/env';
import { createLocalTokenPair } from './local-token';

export type TokenPair = { accessToken: string; refreshToken: string };

let refreshPromise: Promise<TokenPair | null> | null = null;

function clearTokens(): void {
  tokenStorage.clearAll();
}

/**
 * Persists the local demo token pair.
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
 * Renews the local token without contacting a backend.
 * Concurrent calls share one in-flight refresh.
 */
export async function refreshTokens(): Promise<TokenPair | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async (): Promise<TokenPair | null> => {
    try {
      const currentToken = tokenStorage.getAccessToken() ?? refreshToken;
      const payload = currentToken ? decodeJwtPayload(currentToken) : null;
      if (typeof payload?.sub !== 'string' || !payload.sub) {
        clearTokens();
        return null;
      }

      const pair = createLocalTokenPair({
        id: payload.sub,
        username: typeof payload.username === 'string' ? payload.username : undefined,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        roleId: typeof payload.roleId === 'string' ? payload.roleId : undefined,
      });
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
