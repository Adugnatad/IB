/**
 * Runtime environment configuration.
 * API base must be set via environment variables; never hardcode full URLs.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export function getApiBaseUrl(): string {
  if (!API_BASE_URL || typeof API_BASE_URL !== 'string') {
    if (typeof window !== 'undefined') {
      console.error('NEXT_PUBLIC_API_BASE_URL is not set. Set it in .env.local.');
    }
    return '';
  }
  return API_BASE_URL.replace(/\/$/, '');
}

/**
 * Base URL for contracts and account lookup APIs (no /v1 segment).
 * Example: getApiBaseUrl() = "http://host/api/v1" → "http://host/api"
 */
export function getContractsApiBaseUrl(): string {
  const base = getApiBaseUrl();
  if (!base) return '';
  return base.replace(/\/v1\/?$/, '') || base;
}

export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REFRESH_TOKEN: '/auth/refresh-token',
  VERIFY_OTP: '/auth/verify-otp',
  RESET_PASSWORD: '/auth/reset-password',
} as const;

export const TOKEN_CONFIG = {
  ACCESS_TOKEN_VALIDITY_HOURS: 24,
  REFRESH_TOKEN_VALIDITY_DAYS: 7,
  OTP_EXPIRY_MINUTES: 5,
  /** Start silent refresh this many ms before access token expiry */
  REFRESH_BEFORE_EXPIRY_MS: 5 * 60 * 1000,
} as const;
