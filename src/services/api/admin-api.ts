/**
 * Admin / Users Management API.
 * All URLs are relative to API_BASE_URL from environment.
 */
import { apiRequest, ApiError } from './client';
import type { AdminUser, Role, CreateUserPayload, UpdateUserPayload } from '@/types/admin';

const ADMIN_USERS = '/admin/users';
const ROLE = '/role';

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

export async function fetchRoles(): Promise<Role[]> {
  const { data } = await apiRequest<Role[]>(ROLE, {
    method: 'GET',
    // Roles endpoint is exposed on /api (no /v1), same as contracts APIs.
    useContractsBase: true,
  });
  return Array.isArray(data) ? data : [];
}

export { ApiError };
