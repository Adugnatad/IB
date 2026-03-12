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

function getStoredUser(): { id: string; username?: string; email?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id: string; username?: string; email?: string };
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: { id: string; username?: string; email?: string } | null): void {
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
        const user = sub ? { id: sub, ...getStoredUser() } : getStoredUser();
        const snapshot = user ?? (sub ? { id: sub } : null);
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

export function persistAuthUser(user: { id: string; username?: string; email?: string }): void {
  setStoredUser(user);
}
