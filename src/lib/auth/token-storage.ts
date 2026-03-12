/**
 * Secure token storage abstraction.
 * - Access token: memory only (never persisted) to reduce XSS exposure window.
 * - Refresh token: memory + sessionStorage under a namespaced key for 7-day validity across reloads.
 * Tokens are never written to DOM or exposed in React state beyond what's necessary for API headers.
 */

const REFRESH_STORAGE_KEY = 'auth_refresh';
const MEMORY_ACCESS_KEY = '__access';
const MEMORY_REFRESH_KEY = '__refresh';

let memoryStore: Record<string, string> = {};

function getFromMemory(key: string): string | null {
  try {
    return memoryStore[key] ?? null;
  } catch {
    return null;
  }
}

function setInMemory(key: string, value: string): void {
  try {
    memoryStore[key] = value;
  } catch {
    // no-op
  }
}

function removeFromMemory(key: string): void {
  try {
    delete memoryStore[key];
  } catch {
    // no-op
  }
}

function getFromSession(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function setInSession(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // no-op
  }
}

function removeFromSession(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // no-op
  }
}

export const tokenStorage = {
  getAccessToken(): string | null {
    return getFromMemory(MEMORY_ACCESS_KEY);
  },

  setAccessToken(token: string): void {
    if (token && typeof token === 'string') {
      setInMemory(MEMORY_ACCESS_KEY, token);
    }
  },

  getRefreshToken(): string | null {
    return getFromMemory(MEMORY_REFRESH_KEY) ?? getFromSession(REFRESH_STORAGE_KEY);
  },

  setRefreshToken(token: string): void {
    if (token && typeof token === 'string') {
      setInMemory(MEMORY_REFRESH_KEY, token);
      setInSession(REFRESH_STORAGE_KEY, token);
    }
  },

  clearAll(): void {
    removeFromMemory(MEMORY_ACCESS_KEY);
    removeFromMemory(MEMORY_REFRESH_KEY);
    removeFromSession(REFRESH_STORAGE_KEY);
  },

  hasRefreshToken(): boolean {
    return !!this.getRefreshToken();
  },

  hasAccessToken(): boolean {
    return !!this.getAccessToken();
  },
};
