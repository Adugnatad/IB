import type { Role } from '@/types/admin';

/**
 * Seed-aligned roles for bank employee assignment when GET /role returns 403.
 * Prefer API list when role:read is granted; keep UUIDs in sync with backend seed.
 */
export const ADMIN_ASSIGNABLE_ROLES: Role[] = [
  { id: '27948038-e9e3-4ccb-9c3e-d82092a61a2c', name: 'INTERNAL_ADMIN', roleType: 'INTERNAL', active: true },
  { id: 'a210add6-e913-4745-a99b-b9945cca21ee', name: 'INTERNAL_SUPPORT', roleType: 'INTERNAL', active: true },
  { id: 'd70d6b12-7674-4f18-ae2a-fedd3e5f38cf', name: 'INTERNAL_AUDITOR', roleType: 'INTERNAL', active: true },
  { id: '8e30c436-e7d1-4d4f-bf9f-bcaf726f84e0', name: 'INTERNAL_COMPLIANCE', roleType: 'INTERNAL', active: true },
  { id: '87a4e1bf-b933-4566-93fe-f41637f0fbd8', name: 'INTERNAL_PRODUCT_MANAGER', roleType: 'INTERNAL', active: true },
  { id: 'c9537cdf-25eb-4a56-a074-60e4c1d66528', name: 'SUPER_ADMIN', roleType: 'SYSTEM', active: true },
  { id: '21b0b948-54cc-473a-aaa6-aeb92b4bddab', name: 'ADMIN_CONTRACT', roleType: 'SYSTEM', active: true },
  { id: 'f482b625-7440-4b91-8839-3f2cb0e29b4c', name: 'BRANCH_MANAGER', roleType: 'SYSTEM', active: true },
  { id: 'e43769b3-a6de-4c19-bbb4-da5875a8e55f', name: 'USER', roleType: 'SYSTEM', active: true },
];

/** Roles suitable for the admin Users Management form (bank staff, not corporate/retail customers). */
export function filterStaffAssignableRoles(roles: Role[]): Role[] {
  return roles.filter(
    (role) => !role.roleType || role.roleType === 'INTERNAL' || role.roleType === 'SYSTEM'
  );
}
