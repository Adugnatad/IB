/**
 * Admin / Users Management API.
 * All URLs are relative to API_BASE_URL from environment.
 */
import { apiRequest, ApiError } from './client';
import type { AdminUser, Role, CreateUserPayload, UpdateUserPayload } from '@/types/admin';
import {
  ADMIN_ASSIGNABLE_ROLES,
  filterStaffAssignableRoles,
} from '@/features/users-management/adminRoleOptions';

const ADMIN_USERS = '/admin/users';

/** Canonical roles list (requires role:read). Do not use /admin/roles — backend returns 500. */
const ROLE_LIST_PATH = '/role';

export async function fetchUsers(): Promise<AdminUser[]> {
  const { data } = await apiRequest<AdminUser[]>(ADMIN_USERS, { method: 'GET' });
  return Array.isArray(data) ? data : [];
}

export async function createUser(payload: CreateUserPayload): Promise<AdminUser> {
  const { data } = await apiRequest<AdminUser>(ADMIN_USERS, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<AdminUser> {
  const { data } = await apiRequest<AdminUser>(`${ADMIN_USERS}/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

export async function deleteUser(userId: string): Promise<void> {
  await apiRequest<void>(`${ADMIN_USERS}/${userId}`, { method: 'DELETE' });
}

function parseRolesResponse(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of ['content', 'data', 'roles', 'items', 'result'] as const) {
      const nested = record[key];
      if (Array.isArray(nested)) return nested;
    }
  }
  return [];
}

function toRole(raw: unknown): Role | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id.trim() : '';
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  if (!id || !name) return null;
  if (record.active === false) return null;
  return {
    id,
    name,
    description: typeof record.description === 'string' ? record.description : undefined,
    roleType: typeof record.roleType === 'string' ? record.roleType : undefined,
    active: record.active !== false,
    systemRole: record.systemRole === true,
  };
}

function normalizeRoles(data: unknown): Role[] {
  return parseRolesResponse(data)
    .map(toRole)
    .filter((role): role is Role => role !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface FetchRolesResult {
  roles: Role[];
  /** True when API denied role:read and a built-in staff role list was used. */
  fromFallback: boolean;
}

async function requestRolesFromPath(path: string): Promise<Role[]> {
  const { data } = await apiRequest<unknown>(path, { method: 'GET' });
  return filterStaffAssignableRoles(normalizeRoles(data));
}

/**
 * Load roles for the Add user form (option label = name, value = id).
 * GET /api/v1/role; on 403 uses seed-aligned INTERNAL/SYSTEM roles.
 */
export async function fetchRoles(): Promise<FetchRolesResult> {
  try {
    const roles = await requestRolesFromPath(ROLE_LIST_PATH);
    if (roles.length > 0) {
      return { roles, fromFallback: false };
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      const fallback = filterStaffAssignableRoles(ADMIN_ASSIGNABLE_ROLES);
      if (fallback.length > 0) {
        return { roles: fallback, fromFallback: true };
      }
      throw new ApiError(
        'You do not have permission to list roles (role:read). Ask an administrator to grant this permission to your role.',
        'FORBIDDEN',
        403
      );
    }
    throw err;
  }

  return { roles: [], fromFallback: false };
}

export { ApiError };
