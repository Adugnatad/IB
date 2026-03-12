/**
 * Admin / Users Management domain types.
 */

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: string;
  gender?: string;
  nationalId?: string;
  passportNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  occupation?: string;
  employeeId?: string;
  department?: string;
  position?: string;
  hireDate?: string;
  supervisorName?: string;
  workLocation?: string;
  profileComplete?: boolean;
  email?: string;
  phone?: string;
}

export interface RolePermission {
  id: string;
  name: string;
  resource: string;
  action: string;
  fullPermission: string;
  active: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  roleType?: string;
  permissions?: RolePermission[];
  active: boolean;
  systemRole?: boolean;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleId: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roleId?: string;
}

export type UserTableSortKey =
  | 'firstName'
  | 'lastName'
  | 'employeeId'
  | 'department'
  | 'position';

export type SortDirection = 'asc' | 'desc';
