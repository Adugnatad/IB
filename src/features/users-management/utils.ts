import type { AdminUser } from '@/types/admin';

export function getFullName(user: AdminUser): string {
  const parts = [user.firstName, user.middleName, user.lastName].filter(Boolean);
  return parts.join(' ').trim() || '—';
}

export function normalizeFilter(value: string): string {
  return value.trim().toLowerCase();
}

export function matchesGlobalSearch(user: AdminUser, query: string): boolean {
  if (!query.trim()) return true;
  const q = normalizeFilter(query);
  const searchable = [
    user.firstName,
    user.lastName,
    user.middleName,
    user.employeeId,
    user.department,
    user.position,
    user.email,
    user.phone,
  ]
    .filter(Boolean)
    .join(' ');
  return normalizeFilter(searchable).includes(q);
}

export function matchesColumnFilter(
  value: string | undefined,
  filter: string
): boolean {
  if (!filter.trim()) return true;
  if (value == null || value === '') return false;
  return normalizeFilter(value).includes(normalizeFilter(filter));
}
