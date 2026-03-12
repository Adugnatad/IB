/**
 * JWT decode utilities for client-side expiry only. No signature verification (handled by backend).
 * Used for proactive session management and refresh scheduling.
 */
export interface JwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: unknown;
}

const BASE64_URL_REGEX = /^[A-Za-z0-9_-]+$/;

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = str.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  try {
    return decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return '';
  }
}

/**
 * Decodes a JWT payload without verification (client-side). Returns null on invalid/unsafe input.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64] = parts;
  if (!BASE64_URL_REGEX.test(headerB64) || !BASE64_URL_REGEX.test(payloadB64)) return null;
  try {
    const json = base64UrlDecode(payloadB64);
    const payload = JSON.parse(json) as JwtPayload;
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Returns access token expiry time in ms (Date.now() scale), or null if missing/invalid.
 */
export function getAccessTokenExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp || typeof payload.exp !== 'number') return null;
  return payload.exp * 1000;
}

/**
 * Returns true if token is expired or will expire within bufferMs.
 */
export function isTokenExpiredOrExpiringSoon(token: string, bufferMs: number = 0): boolean {
  const expiryMs = getAccessTokenExpiryMs(token);
  if (expiryMs == null) return true;
  return Date.now() + bufferMs >= expiryMs;
}
