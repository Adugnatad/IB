/**
 * Contract-scoped role UUIDs (query param on add/update user). Keep in sync with backend seed.
 */
export const CONTRACT_ROLE_OPTIONS = [
  { label: 'Corporate Authorizer', value: '74183901-18bd-41a2-8ea2-94bde3c3995b' },
  { label: 'Branch manager', value: 'f482b625-7440-4b91-8839-3f2cb0e29b4c' },
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
