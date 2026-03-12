/**
 * Auth API service: login, verify-otp, reset-password.
 * Uses apiRequest for authenticated endpoints where applicable; login/verify-otp/reset use skipAuth.
 */
import { apiRequest, ApiError } from './client';

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  otpRequired?: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser;
  message?: string;
}

export interface AuthUser {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
  roles?: string[];
  [key: string]: unknown;
}

export interface VerifyOtpRequest {
  identifier: string;
  otp: string;
  /** Optional temporary token from login response when backend ties OTP to session */
  tempToken?: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  user?: AuthUser;
}

export interface ResetPasswordRequest {
  identifier: string;
  resetCode: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message?: string;
}

const AUTH = {
  LOGIN: '/auth/login',
  VERIFY_OTP: '/auth/verify-otp',
  RESET_PASSWORD: '/auth/reset-password',
} as const;

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiRequest<LoginResponse>(AUTH.LOGIN, {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
  return data;
}

export async function verifyOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  const body: Record<string, string> = {
    identifier: payload.identifier,
    otp: payload.otp,
  };
  if (payload.tempToken) body.tempToken = payload.tempToken;

  const { data } = await apiRequest<VerifyOtpResponse>(AUTH.VERIFY_OTP, {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  });

  if (!data.accessToken) {
    throw new ApiError('Invalid verification response', 'API_ERROR');
  }
  return data;
}

export async function resetPassword(payload: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  const { data } = await apiRequest<ResetPasswordResponse>(AUTH.RESET_PASSWORD, {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
  return data;
}

export { ApiError };
