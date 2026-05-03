'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/Redux/ReduxStore';
import { setSession, logout, setRehydrating } from '@/Redux/Slices/authSlice';
import { onSessionInvalid } from '@/services/api/client';
import { tokenManager } from '@/lib/auth/token-manager';
import { startSessionScheduler, stopSessionScheduler } from '@/lib/auth/session-scheduler';
import { decodeJwtPayload } from '@/lib/auth/jwt';

const AUTH_USER_STORAGE_KEY = 'auth_user_snapshot';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value.trim());
}

function getStoredUser(): { id: string; roleId?: string; username?: string; email?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id: string; roleId?: string; username?: string; email?: string };
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: { id: string; roleId?: string; username?: string; email?: string } | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) sessionStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
  } catch {
    // no-op
  }
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const invalidRef = useRef(false);

  useEffect(() => {
    const handleSessionInvalid = () => {
      if (invalidRef.current) return;
      invalidRef.current = true;
      dispatch(logout());
      stopSessionScheduler();
      setStoredUser(null);
      router.replace('/');
    };

    onSessionInvalid(handleSessionInvalid);

    let mounted = true;

    (async () => {
      if (!tokenManager.hasRefreshToken()) {
        dispatch(setRehydrating(false));
        return;
      }
      const pair = await tokenManager.refreshTokens();
      if (!mounted) return;
      dispatch(setRehydrating(false));
      if (pair) {
        const payload = decodeJwtPayload(pair.accessToken);
        const sub = payload?.sub;
        const storedUser = getStoredUser();
        const user = storedUser ?? (isUuid(sub) ? { id: sub } : null);
        const snapshot = user ?? null;
        if (snapshot) setStoredUser(snapshot);
        dispatch(setSession({ user: snapshot, isAuthenticated: true }));
        startSessionScheduler();
      } else {
        setStoredUser(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [dispatch, router]);

  return <>{children}</>;
}

export function persistAuthUser(user: { id: string; roleId?: string; username?: string; email?: string }): void {
  setStoredUser(user);
}
