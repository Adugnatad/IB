/**
 * Global API client with session validation interceptor.
 * On 401: attempt silent refresh → retry original request once → if refresh fails, emit session invalid.
 */
import { getApiBaseUrl, getContractsApiBaseUrl } from '@/config/env';
import { tokenManager } from '@/lib/auth/token-manager';

const DEFAULT_TIMEOUT_MS = 30000;

export type SessionInvalidCallback = () => void;
let sessionInvalidCallback: SessionInvalidCallback | null = null;

export function onSessionInvalid(cb: SessionInvalidCallback): void {
  sessionInvalidCallback = cb;
}

function notifySessionInvalid(): void {
  tokenManager.clearSession();
  sessionInvalidCallback?.();
}

export interface RequestConfig extends RequestInit {
  timeout?: number;
  skipAuth?: boolean;
  skipRefreshRetry?: boolean;
  /** Use contracts API base URL (no /v1). Use for /api/contracts and /api/accounts/... */
  useContractsBase?: boolean;
}

async function fetchWithTimeout(
  url: string,
  config: RequestConfig,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...config,
      signal: config.signal ?? controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Builds full URL from path. Path must start with /.
 * When useContractsBase is true, uses base without /v1 (e.g. .../api instead of .../api/v1).
 */
export function buildApiUrl(path: string, useContractsBase?: boolean): string {
  const base = useContractsBase ? getContractsApiBaseUrl() : getApiBaseUrl();
  if (!base) return '';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

/**
 * Authenticated request: adds Authorization header, on 401 tries refresh then retry once.
 */
export async function apiRequest<T = unknown>(
  path: string,
  config: RequestConfig = {}
): Promise<{ data: T; response: Response }> {
  const { timeout = DEFAULT_TIMEOUT_MS, skipAuth = false, skipRefreshRetry = false, useContractsBase = false, ...init } = config;
  const url = buildApiUrl(path, useContractsBase);
  if (!url) {
    throw new ApiError('API_BASE_URL is not configured', 'CONFIG_ERROR');
  }

  const headers = new Headers(init.headers ?? {});
  if (!skipAuth) {
    const token = tokenManager.getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const firstRes = await fetchWithTimeout(url, { ...init, headers }, timeout);

  if (firstRes.status !== 401 || skipAuth || skipRefreshRetry) {
    return handleResponse<T>(path, firstRes, url, init, headers, timeout);
  }

  const newPair = await tokenManager.refreshTokens();
  if (!newPair) {
    notifySessionInvalid();
    throw new ApiError('Session expired. Please sign in again.', 'UNAUTHORIZED');
  }

  headers.set('Authorization', `Bearer ${newPair.accessToken}`);
  const retryRes = await fetchWithTimeout(url, { ...init, headers }, timeout);
  return handleResponse<T>(path, retryRes, url, init, headers, timeout);
}

interface BackendErrorBody {
  errorCode?: string;
  errorMessage?: string;
  errorType?: string;
}

async function handleResponse<T>(
  path: string,
  res: Response,
  _url: string,
  _init: RequestInit,
  _headers: Headers,
  _timeout: number
): Promise<{ data: T; response: Response }> {
  const contentType = res.headers.get('Content-Type') ?? '';
  let data: T;
  if (contentType.includes('application/json')) {
    try {
      data = (await res.json()) as T;
    } catch {
      throw new ApiError('Invalid response from server', 'PARSE_ERROR');
    }
  } else {
    data = (await res.text()) as unknown as T;
  }

  if (res.status === 401) {
    const body = data as BackendErrorBody;
    if (body?.errorCode === 'INVALID_CREDENTIALS') {
      throw new ApiError(
        body.errorMessage ?? 'Invalid username or password',
        'INVALID_CREDENTIALS',
        401,
        data
      );
    }
    notifySessionInvalid();
    throw new ApiError('Session expired. Please sign in again.', 'UNAUTHORIZED', 401, data);
  }

  if (!res.ok) {
    const body = data as BackendErrorBody & { message?: string };
    const message =
      body?.errorMessage ??
      (typeof body?.message === 'string' ? body.message : null) ??
      `Request failed: ${path}`;
    const code = body?.errorCode ?? mapStatusToCode(res.status);
    throw new ApiError(message, code, res.status, data);
  }

  return { data, response: res };
}

function mapStatusToCode(status: number): string {
  if (status === 429) return 'RATE_LIMIT';
  if (status >= 500) return 'SERVER_ERROR';
  if (status === 400) return 'BAD_REQUEST';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  return 'API_ERROR';
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
