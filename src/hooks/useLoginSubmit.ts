'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/Redux/ReduxStore';
import { setSession, requireOtp, setAuthError, clearAuthError } from '@/Redux/Slices/authSlice';
import { tokenManager } from '@/lib/auth/token-manager';
import { startSessionScheduler } from '@/lib/auth/session-scheduler';
import { login, type LoginResponse } from '@/services/api/auth-api';
import { ApiError } from '@/services/api/client';
import { getAuthErrorMessage } from '@/lib/auth/error-messages';
import { persistAuthUser } from '@/components/Auth/AuthGate';
import { toast } from 'react-toastify';
import { TOAST_AUTO_CLOSE_MS } from '@/CommonComponents/ToastProvider';

const REQUEST_TIMEOUT_MS = 25000;

export function useLoginSubmit() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const submit = useCallback(
    async (identifier: string, password: string) => {
      dispatch(clearAuthError());
      if (!identifier.trim() || !password) {
        const message = 'Please enter your identifier and password.';
        dispatch(setAuthError({ message, code: 'VALIDATION' }));
        toast.error(message, { autoClose: TOAST_AUTO_CLOSE_MS });
        return;
      }

      setLoading(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const res = await login({ identifier: identifier.trim(), password });
        clearTimeout(timeoutId);

        const data = res as LoginResponse;

        if (data.otpRequired === true) {
          dispatch(
            requireOtp({
              identifier: identifier.trim(),
              tempToken: (data as { tempToken?: string }).tempToken ?? undefined,
            })
          );
          router.replace('/verify-otp');
          return;
        }

        const accessToken = data.accessToken;
        const refreshToken = data.refreshToken;
        if (!accessToken) {
          const message = 'Invalid login response. Please try again.';
          dispatch(setAuthError({ message, code: 'API_ERROR' }));
          toast.error(message, { autoClose: TOAST_AUTO_CLOSE_MS });
          return;
        }

        tokenManager.setTokenPair({
          accessToken,
          refreshToken: refreshToken ?? accessToken,
        });
        const user = data.user ?? { id: 'unknown' };
        persistAuthUser({ id: user.id, username: user.username, email: user.email });
        dispatch(setSession({ user, isAuthenticated: true }));
        startSessionScheduler();
        router.replace('/dashboard');
      } catch (err) {
        const message = err instanceof ApiError ? getAuthErrorMessage(err) : getAuthErrorMessage(err);
        const code = err instanceof ApiError ? err.code : 'UNKNOWN';
        dispatch(setAuthError({ message, code }));
        toast.error(message, { autoClose: TOAST_AUTO_CLOSE_MS });
      } finally {
        setLoading(false);
      }
    },
    [dispatch, router]
  );

  return { submit, loading };
}
