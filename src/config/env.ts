export const TOKEN_CONFIG = {
  ACCESS_TOKEN_VALIDITY_HOURS: 24,
  REFRESH_TOKEN_VALIDITY_DAYS: 7,
  OTP_EXPIRY_MINUTES: 5,
  /** Start silent refresh this many ms before access token expiry */
  REFRESH_BEFORE_EXPIRY_MS: 5 * 60 * 1000,
} as const;
