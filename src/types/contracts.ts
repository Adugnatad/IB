/**
 * Contracts management domain types.
 * Aligned with backend GET /api/contracts and POST /api/contracts.
 */

export const CONTRACT_STATUSES = [
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'EXPIRED',
  'TERMINATED',
  'INACTIVE',
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export interface Contract {
  id: string;
  customerId: string;
  contractName: string;
  description: string;
  status: ContractStatus;
  createdByUserId?: string;
  approvedByUserId?: string | null;
  approvedAt?: string | null;
  effectiveDate: string;
  expiryDate: string;
  metadata?: string | null;
  createdDate: string;
  lastModifiedDate: string;
  accountIds?: string[];
  users?: unknown[];
  activeUserCount: number;
  accountCount: number;
  active: boolean;
  deleted: boolean;
  operational: boolean;
}

export interface ContractsListParams {
  status?: ContractStatus;
  activeOnly?: boolean;
}

export interface CreateContractPayload {
  customerId: string;
  contractName: string;
  description: string;
  effectiveDate: string;
  expiryDate: string;
  accountNumbersToLink: string[];
  autoActivate: boolean;
  metadata?: string;
}

/** Payload for PUT /api/contracts/{contractId} */
export interface UpdateContractPayload {
  contractName: string;
  description: string;
  effectiveDate: string;
  expiryDate: string;
  isActive: boolean;
  metadata?: string;
}

export interface AddContractUserPayload {
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  addressLine1: string;
}

export const CONTRACT_USER_PERMISSION_TYPES = ['INITIATE', 'APPROVE', 'VIEW'] as const;
export type ContractUserPermissionType = (typeof CONTRACT_USER_PERMISSION_TYPES)[number];

export interface ContractUserSignatoryMetric {
  id: string;
  contractUserId: string;
  permissionType: string;
  amountConstraint: string;
  amountLimit: number;
  dailyLimit: number;
  scopeConstraint: string;
  approvalLevel: number;
  requiresAuthorization: boolean;
  priorityOrder: number;
  restrictions: string | null;
  active: boolean;
}

export interface ContractUser {
  id: string;
  contractId: string;
  userId: string;
  username: string;
  email: string;
  phone: string;
  roleName: string;
  addedByUserId: string;
  addedByUsername: string;
  addedAt: string;
  expiresAt: string | null;
  signatoryMetrics: ContractUserSignatoryMetric[];
  createdDate: string;
  active: boolean;
  expired: boolean;
  primaryAdmin: boolean;
}

export type ContractTableSortKey =
  | 'contractName'
  | 'customerId'
  | 'status'
  | 'effectiveDate'
  | 'expiryDate'
  | 'activeUserCount'
  | 'accountCount'
  | 'createdDate';

export type SortDirection = 'asc' | 'desc';

export interface ContractStatistics {
  totalContracts: number;
  activeContracts: number;
  pendingContracts: number;
  suspendedContracts: number;
  expiredContracts: number;
  terminatedContracts: number;
  operationalContracts: number;
}

export interface SignatoryApprovalRule {
  ruleId: string;
  approvalType: string;
  approvalAction: string;
  minAmount: number;
  maxAmount: number;
}

/** Approval rules at contract scope (GET/POST `/contracts/{contractId}/approval-rules`). */
export const CONTRACT_APPROVAL_RULE_TYPES = ['INTER_BANK_TRANSFER', 'INTRA_BANK_TRANSFER'] as const;
export type ContractApprovalRuleType = (typeof CONTRACT_APPROVAL_RULE_TYPES)[number];

export const CONTRACT_APPROVAL_RULE_ACTIONS = ['CREATE', 'EDIT', 'CANCEL'] as const;
export type ContractApprovalRuleAction = (typeof CONTRACT_APPROVAL_RULE_ACTIONS)[number];

export interface ContractApprovalRule {
  id: string;
  minAmount: number;
  maxAmount: number;
  approvalType: string;
  approvalAction: string;
  signatoryGroupId: string;
  signatoryGroupName?: string;
  contractId: string;
  active: boolean;
}

export interface UpsertContractApprovalRulePayload {
  minAmount: number;
  maxAmount: number;
  signatoryGroupId: string;
}

export interface SignatoryGroupMember {
  id: string;
  contractUserId: string;
  userFullName: string;
  userEmail: string;
  active: boolean;
  approvalOrder?: number;
}

export interface SignatoryGroup {
  id: string;
  name: string;
  description: string;
  approvalRules: SignatoryApprovalRule[];
  members: SignatoryGroupMember[];
  active: boolean;
}

export interface CreateSignatoryGroupPayload {
  name: string;
  description: string;
  members: Array<{
    contractUserId: string;
  }>;
}

export interface UpdateSignatoryGroupPayload {
  name: string;
  description: string;
}

export interface AddSignatoryGroupMemberPayload {
  contractUserId: string;
  approvalOrder?: number;
}

export interface ReorderSignatoryGroupMembersPayload {
  memberOrders: Array<{
    memberId: string;
    approvalOrder: number;
  }>;
}
