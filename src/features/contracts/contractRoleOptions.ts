/**
 * Contract-scoped role UUIDs (query param on add/update user). Keep in sync with backend seed.
 */
export const CONTRACT_ROLE_OPTIONS = [
  { label: 'Admin', value: 'f3665181-2954-4012-9db8-6a28eeaaaf32' },
  { label: 'Branch manager', value: '20b7a3e3-dee8-40fc-8c0f-efa6e0d45bd6' },
] as const;

/** Map API contract user `roleName` to dropdown value when known. */
export function roleNameToContractRoleId(roleName: unknown): string {
  const key = typeof roleName === 'string' ? roleName.trim().toUpperCase() : '';
  const map: Record<string, string> = {
    ADMIN_CONTRACT: CONTRACT_ROLE_OPTIONS[0].value,
    BRANCH_MANAGER: CONTRACT_ROLE_OPTIONS[1].value,
  };
  return map[key] ?? '';
}
