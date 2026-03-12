import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '@/services/api/auth-api';

export const AUTH_SLICE_NAME = 'auth';

const OTP_EXPIRY_MS = 5 * 60 * 1000;

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isRehydrating: boolean;
  /** When true, redirect to OTP verification; 5-min countdown applies */
  otpRequired: boolean;
  /** Timestamp (ms) when OTP step expires */
  otpCountdownDeadline: number | null;
  /** Identifier (username/email/phone) for OTP or reset flow */
  pendingIdentifier: string | null;
  /** Optional temp token from login for verify-otp */
  tempToken: string | null;
  lastError: string | null;
  lastErrorCode: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isRehydrating: true,
  otpRequired: false,
  otpCountdownDeadline: null,
  pendingIdentifier: null,
  tempToken: null,
  lastError: null,
  lastErrorCode: null,
};

const authSlice = createSlice({
  name: AUTH_SLICE_NAME,
  initialState,
  reducers: {
    setSession(
      state,
      action: PayloadAction<{ user: AuthUser | null; isAuthenticated: boolean }>
    ) {
      state.user = action.payload.user;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.otpRequired = false;
      state.otpCountdownDeadline = null;
      state.pendingIdentifier = null;
      state.tempToken = null;
      state.lastError = null;
      state.lastErrorCode = null;
    },
    requireOtp(
      state,
      action: PayloadAction<{ identifier: string; tempToken?: string | null }>
    ) {
      state.otpRequired = true;
      state.otpCountdownDeadline = Date.now() + OTP_EXPIRY_MS;
      state.pendingIdentifier = action.payload.identifier;
      state.tempToken = action.payload.tempToken ?? null;
      state.lastError = null;
      state.lastErrorCode = null;
    },
    clearOtp(state) {
      state.otpRequired = false;
      state.otpCountdownDeadline = null;
      state.pendingIdentifier = null;
      state.tempToken = null;
    },
    setOtpCountdownDeadline(state, action: PayloadAction<number | null>) {
      state.otpCountdownDeadline = action.payload;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.otpRequired = false;
      state.otpCountdownDeadline = null;
      state.pendingIdentifier = null;
      state.tempToken = null;
      state.lastError = null;
      state.lastErrorCode = null;
    },
    setAuthError(
      state,
      action: PayloadAction<{ message: string; code?: string }>
    ) {
      state.lastError = action.payload.message;
      state.lastErrorCode = action.payload.code ?? null;
    },
    clearAuthError(state) {
      state.lastError = null;
      state.lastErrorCode = null;
    },
    setRehydrating(state, action: PayloadAction<boolean>) {
      state.isRehydrating = action.payload;
    },
  },
});

export default authSlice.reducer;
export const {
  setSession,
  requireOtp,
  clearOtp,
  setOtpCountdownDeadline,
  logout,
  setAuthError,
  clearAuthError,
  setRehydrating,
} = authSlice.actions;
