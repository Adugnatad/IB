/**
 * User-facing error messages and API error mapping.
 */
import { ApiError } from '@/services/api/client';

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        return 'Session expired. Please sign in again.';
      case 'INVALID_CREDENTIALS':
        return error.message || 'Invalid username or password.';
      case 'RATE_LIMIT':
        return 'Too many attempts. Please try again later.';
      case 'BAD_REQUEST':
        return error.message || 'Invalid request. Please check your input.';
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action.';
      case 'SERVER_ERROR':
        return 'Server error. Please try again later.';
      case 'CONFIG_ERROR':
        return 'Application configuration error. Please contact support.';
      case 'PARSE_ERROR':
        return 'Invalid response from server. Please try again.';
      default:
        return error.message || 'Something went wrong. Please try again.';
    }
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export const OTP_ERROR_MESSAGES = {
  WRONG_OTP: 'Invalid verification code. Please try again.',
  EXPIRED_OTP: 'Verification code has expired. Please request a new one.',
  RATE_LIMIT: 'Too many attempts. Please try again later.',
  NETWORK: 'Network error. Please check your connection and try again.',
} as const;

export const RESET_PASSWORD_MESSAGES = {
  INVALID_CODE: 'Invalid or expired reset code. Please request a new password reset.',
  WEAK_PASSWORD: 'Password does not meet security requirements.',
  SUCCESS: 'Password has been reset successfully. You can sign in with your new password.',
} as const;
