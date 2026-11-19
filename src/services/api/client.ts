/**
 * Local-only API client. All feature services are handled by the browser demo store.
 */
import { handleLocalApiRequest, LocalApiError } from './local-api';
import { tokenManager } from '@/lib/auth/token-manager';

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

/**
 * Normalizes a local service path. No URL or backend configuration is required.
 */
export function buildApiUrl(path: string, _useContractsBase?: boolean): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized;
}

/**
 * Authenticated request: adds Authorization header, on 401 tries refresh then retry once.
 */
export async function apiRequest<T = unknown>(
  path: string,
  config: RequestConfig = {}
): Promise<{ data: T; response: Response }> {
  const { timeout: _timeout, skipAuth: _skipAuth, skipRefreshRetry: _skipRefreshRetry, useContractsBase: _useContractsBase, ...init } = config;
  const url = buildApiUrl(path);
  const headers = new Headers(init.headers ?? {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  let result: { data: unknown; status: number };
  try {
    result = await handleLocalApiRequest(url, { ...init, headers });
  } catch (error) {
    if (error instanceof LocalApiError) {
      throw new ApiError(error.message, error.code, error.status);
    }
    throw error;
  }

  const response = new Response(JSON.stringify(result.data ?? null), {
    status: result.status,
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<T>(path, response, url, init, headers, 0);
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
