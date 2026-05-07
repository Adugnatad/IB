/**
 * Contracts management API.
 * All URLs are relative to API_BASE_URL from environment.
 */
import { apiRequest, ApiError } from './client';
import type {
  Contract,
  ContractsListParams,
  CreateContractPayload,
  UpdateContractPayload,
  AddContractUserPayload,
  ContractUserPermissionType,
  ContractUser,
  ContractStatistics,
  SignatoryGroup,
  CreateSignatoryGroupPayload,
  UpdateSignatoryGroupPayload,
  SignatoryGroupMember,
  AddSignatoryGroupMemberPayload,
  ReorderSignatoryGroupMembersPayload,
  ContractApprovalRule,
  ContractApprovalRuleAction,
  ContractApprovalRuleType,
  UpsertContractApprovalRulePayload,
} from '@/types/contracts';

const CONTRACTS_PATH = '/contracts';

function buildQuery(params: ContractsListParams): string {
  const search = new URLSearchParams();
  if (params.status) {
    search.set('status', params.status);
  }
  // Only apply the active-only filter when explicitly enabled.
  // Sending `activeOnly=false` may be interpreted by the backend as excluding deleted contracts.
  if (params.activeOnly === true) {
    search.set('activeOnly', 'true');
  }
  const q = search.toString();
  return q ? `?${q}` : '';
}

export async function fetchContracts(params: ContractsListParams = {}): Promise<Contract[]> {
  const query = buildQuery(params);
  const { data } = await apiRequest<Contract[]>(`${CONTRACTS_PATH}${query}`, {
    method: 'GET',
    useContractsBase: true,
  });
  return Array.isArray(data) ? data : [];
}

/**
 * Get contract details by ID.
 * GET /api/contracts/{contractId}
 */
export async function fetchContractById(contractId: string): Promise<Contract> {
  const { data } = await apiRequest<Contract>(`${CONTRACTS_PATH}/${contractId}`, {
    method: 'GET',
    useContractsBase: true,
  });
  return data;
}

/**
 * Get contracts statistics for dashboard widgets.
 * GET /api/contracts/statistics
 */
export async function fetchContractStatistics(): Promise<ContractStatistics> {
  const { data } = await apiRequest<ContractStatistics>(`${CONTRACTS_PATH}/statistics`, {
    method: 'GET',
    useContractsBase: true,
  });
  return data;
}

/**
 * Create a contract. Requires the internal user UUID for the User-Id header.
 */
export async function createContract(
  payload: CreateContractPayload,
  createdByUserId: string
): Promise<Contract> {
  const headers = new Headers();
  headers.set('User-Id', createdByUserId);
  const { data } = await apiRequest<Contract>(CONTRACTS_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers,
    useContractsBase: true,
  });
  return data;
}

/**
 * Update a contract. PUT /api/contracts/{contractId}. Requires User-Id header.
 */
export async function updateContract(
  contractId: string,
  payload: UpdateContractPayload,
  userId: string
): Promise<Contract> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  const { data } = await apiRequest<Contract>(`${CONTRACTS_PATH}/${contractId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers,
    useContractsBase: true,
  });
  return data;
}

/**
 * Delete a contract. DELETE /api/contracts/{contractId}. Requires User-Id header.
 */
export async function deleteContract(contractId: string, userId: string): Promise<void> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  await apiRequest<void>(`${CONTRACTS_PATH}/${contractId}`, {
    method: 'DELETE',
    headers,
    useContractsBase: true,
  });
}

/**
 * Add user to contract.
 * POST /api/contracts/{contractId}/users?roleId={roleId}. Requires User-Id header.
 */
export async function addContractUser(
  contractId: string,
  roleId: string,
  permissionType: ContractUserPermissionType,
  payload: AddContractUserPayload,
  userId: string
): Promise<ContractUser> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  const encodedRoleId = encodeURIComponent(roleId.trim());
  const encodedPermissionType = encodeURIComponent(permissionType.trim());
  const { data } = await apiRequest<ContractUser>(
    `${CONTRACTS_PATH}/${contractId}/users?roleId=${encodedRoleId}&permissionType=${encodedPermissionType}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers,
      useContractsBase: true,
    }
  );
  return data;
}

/**
 * Update a linked contract user's profile and role/permission.
 * PUT /api/contracts/{contractId}/users/{contractUserId}?roleId=...&permissionType=...
 * Requires User-Id header. Body matches add-user payload.
 */
export async function updateContractUser(
  contractId: string,
  contractUserId: string,
  roleId: string,
  permissionType: ContractUserPermissionType,
  payload: AddContractUserPayload,
  userId: string
): Promise<ContractUser> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  const encodedRoleId = encodeURIComponent(roleId.trim());
  const encodedPermissionType = encodeURIComponent(permissionType.trim());
  const encodedUserId = encodeURIComponent(contractUserId.trim());
  const { data } = await apiRequest<ContractUser>(
    `${CONTRACTS_PATH}/${contractId}/users/${encodedUserId}?roleId=${encodedRoleId}&permissionType=${encodedPermissionType}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers,
      useContractsBase: true,
    }
  );
  return data;
}

/**
 * Terminate contract.
 * PUT /api/contracts/{contractId}/terminate?reason={reason}. Requires User-Id header.
 */
export async function terminateContract(
  contractId: string,
  reason: string,
  userId: string
): Promise<Contract> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  const encodedReason = encodeURIComponent(reason.trim());
  const { data } = await apiRequest<Contract>(
    `${CONTRACTS_PATH}/${contractId}/terminate?reason=${encodedReason}`,
    {
      method: 'POST',
      headers,
      useContractsBase: true,
    }
  );
  return data;
}

/**
 * Suspend contract.
 * PUT /api/contracts/{contractId}/suspend?reason={reason}. Requires User-Id header.
 */
export async function suspendContract(
  contractId: string,
  reason: string,
  userId: string
): Promise<Contract> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  const encodedReason = encodeURIComponent(reason.trim());
  const { data } = await apiRequest<Contract>(
    `${CONTRACTS_PATH}/${contractId}/suspend?reason=${encodedReason}`,
    {
      method: 'PUT',
      headers,
      useContractsBase: true,
    }
  );
  return data;
}

/**
 * Activate contract.
 * PUT /api/contracts/{contractId}/activate. Requires User-Id header.
 */
export async function activateContract(contractId: string, userId: string): Promise<Contract> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  const { data } = await apiRequest<Contract>(`${CONTRACTS_PATH}/${contractId}/activate`, {
    method: 'POST',
    headers,
    useContractsBase: true,
  });
  return data;
}

/**
 * Get all signatory groups for a contract.
 * GET /api/contracts/{contractId}/signatory-groups
 */
export async function fetchSignatoryGroups(
  contractId: string,
  approvalType?: string
): Promise<SignatoryGroup[]> {
  const query = approvalType?.trim()
    ? `?approvalType=${encodeURIComponent(approvalType.trim())}`
    : '';
  const { data } = await apiRequest<SignatoryGroup[]>(
    `${CONTRACTS_PATH}/${contractId}/signatory-groups${query}`,
    {
      method: 'GET',
      useContractsBase: true,
    }
  );
  return Array.isArray(data) ? data : [];
}

/**
 * Create signatory group for a contract.
 * POST /api/contracts/{contractId}/signatory-groups
 */
export async function createSignatoryGroup(
  contractId: string,
  payload: CreateSignatoryGroupPayload,
  userId: string
): Promise<SignatoryGroup> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  const { data } = await apiRequest<SignatoryGroup>(
    `${CONTRACTS_PATH}/${contractId}/signatory-groups`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers,
      useContractsBase: true,
    }
  );
  return data;
}

/**
 * Update signatory group basic fields.
 * PUT /api/contracts/{contractId}/signatory-groups/{groupId}
 */
export async function updateSignatoryGroup(
  contractId: string,
  groupId: string,
  payload: UpdateSignatoryGroupPayload,
  userId: string
): Promise<SignatoryGroup> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  const { data } = await apiRequest<SignatoryGroup>(
    `${CONTRACTS_PATH}/${contractId}/signatory-groups/${groupId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers,
      useContractsBase: true,
    }
  );
  return data;
}

/**
 * Deactivate signatory group.
 * DELETE /api/contracts/{contractId}/signatory-groups/{groupId}
 */
export async function deactivateSignatoryGroup(
  contractId: string,
  groupId: string,
  userId: string
): Promise<void> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  await apiRequest<void>(`${CONTRACTS_PATH}/${contractId}/signatory-groups/${groupId}`, {
    method: 'DELETE',
    headers,
    useContractsBase: true,
  });
}

/**
 * Get all members for a signatory group.
 * GET /api/contracts/{contractId}/signatory-groups/{groupId}/members
 */
export async function fetchSignatoryGroupMembers(
  contractId: string,
  groupId: string
): Promise<SignatoryGroupMember[]> {
  const { data } = await apiRequest<SignatoryGroupMember[]>(
    `${CONTRACTS_PATH}/${contractId}/signatory-groups/${groupId}/members`,
    {
      method: 'GET',
      useContractsBase: true,
    }
  );
  return Array.isArray(data) ? data : [];
}

/**
 * Add member to signatory group.
 * POST /api/contracts/{contractId}/signatory-groups/{groupId}/members
 */
export async function addSignatoryGroupMember(
  contractId: string,
  groupId: string,
  payload: AddSignatoryGroupMemberPayload,
  userId: string
): Promise<SignatoryGroupMember> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  const { data } = await apiRequest<SignatoryGroupMember>(
    `${CONTRACTS_PATH}/${contractId}/signatory-groups/${groupId}/members`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      useContractsBase: true,
    }
  );
  return data;
}

/**
 * Remove member from signatory group.
 * DELETE /api/contracts/{contractId}/signatory-groups/{groupId}/members/{memberId}
 */
export async function removeSignatoryGroupMember(
  contractId: string,
  groupId: string,
  memberId: string,
  userId: string
): Promise<void> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  await apiRequest<void>(
    `${CONTRACTS_PATH}/${contractId}/signatory-groups/${groupId}/members/${memberId}`,
    {
      method: 'DELETE',
      headers,
      useContractsBase: true,
    }
  );
}

/**
 * Reorder all members in signatory group.
 * PUT /api/contracts/{contractId}/signatory-groups/{groupId}/members/reorder
 */
export async function reorderSignatoryGroupMembers(
  contractId: string,
  groupId: string,
  payload: ReorderSignatoryGroupMembersPayload,
  userId: string
): Promise<void> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  await apiRequest<void>(
    `${CONTRACTS_PATH}/${contractId}/signatory-groups/${groupId}/members/reorder`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
      useContractsBase: true,
    }
  );
}

/**
 * Update approval order of single member.
 * PATCH /api/contracts/{contractId}/signatory-groups/{groupId}/members/{memberId}/approval-order
 */
export async function updateSignatoryGroupMemberApprovalOrder(
  contractId: string,
  groupId: string,
  memberId: string,
  approvalOrder: number,
  userId: string
): Promise<void> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  await apiRequest<void>(
    `${CONTRACTS_PATH}/${contractId}/signatory-groups/${groupId}/members/${memberId}/approval-order`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ approvalOrder }),
      useContractsBase: true,
    }
  );
}

/**
 * GET /api/contracts/{contractId}/approval-rules
 * Optional query: approvalType (INTER_BANK_TRANSFER | INTRA_BANK_TRANSFER)
 */
export async function fetchContractApprovalRules(
  contractId: string,
  approvalType?: string
): Promise<ContractApprovalRule[]> {
  const q = approvalType?.trim()
    ? `?approvalType=${encodeURIComponent(approvalType.trim())}`
    : '';
  const { data } = await apiRequest<ContractApprovalRule[]>(
    `${CONTRACTS_PATH}/${contractId}/approval-rules${q}`,
    {
      method: 'GET',
      useContractsBase: true,
    }
  );
  return Array.isArray(data) ? data : [];
}

/**
 * GET /api/contracts/{contractId}/approval-rules/{ruleId}
 */
export async function fetchContractApprovalRule(
  contractId: string,
  ruleId: string
): Promise<ContractApprovalRule> {
  const { data } = await apiRequest<ContractApprovalRule>(
    `${CONTRACTS_PATH}/${contractId}/approval-rules/${encodeURIComponent(ruleId)}`,
    {
      method: 'GET',
      useContractsBase: true,
    }
  );
  return data;
}

/**
 * GET /api/contracts/{contractId}/approval-rules/signatory-group/{signatoryGroupId}
 */
export async function fetchContractApprovalRulesBySignatoryGroup(
  contractId: string,
  signatoryGroupId: string
): Promise<ContractApprovalRule[]> {
  const { data } = await apiRequest<ContractApprovalRule[]>(
    `${CONTRACTS_PATH}/${contractId}/approval-rules/signatory-group/${encodeURIComponent(signatoryGroupId)}`,
    {
      method: 'GET',
      useContractsBase: true,
    }
  );
  return Array.isArray(data) ? data : [];
}

/**
 * POST /api/contracts/{contractId}/approval-rules?approvalType=&approvalAction=
 */
export async function createContractApprovalRule(
  contractId: string,
  approvalType: ContractApprovalRuleType,
  approvalAction: ContractApprovalRuleAction,
  payload: UpsertContractApprovalRulePayload,
  userId: string
): Promise<ContractApprovalRule> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  const qt = encodeURIComponent(approvalType);
  const qa = encodeURIComponent(approvalAction);
  const { data } = await apiRequest<ContractApprovalRule>(
    `${CONTRACTS_PATH}/${contractId}/approval-rules?approvalType=${qt}&approvalAction=${qa}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers,
      useContractsBase: true,
    }
  );
  return data;
}

/**
 * PUT /api/contracts/{contractId}/approval-rules/{ruleId}?approvalType=&approvalAction=
 */
export async function updateContractApprovalRule(
  contractId: string,
  ruleId: string,
  approvalType: ContractApprovalRuleType,
  approvalAction: ContractApprovalRuleAction,
  payload: UpsertContractApprovalRulePayload,
  userId: string
): Promise<ContractApprovalRule> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  const qt = encodeURIComponent(approvalType);
  const qa = encodeURIComponent(approvalAction);
  const { data } = await apiRequest<ContractApprovalRule>(
    `${CONTRACTS_PATH}/${contractId}/approval-rules/${encodeURIComponent(ruleId)}?approvalType=${qt}&approvalAction=${qa}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers,
      useContractsBase: true,
    }
  );
  return data;
}

/**
 * DELETE /api/contracts/{contractId}/approval-rules/{ruleId} — soft delete (inactive).
 */
export async function deleteContractApprovalRule(
  contractId: string,
  ruleId: string,
  userId: string
): Promise<void> {
  const headers = new Headers();
  headers.set('User-Id', userId);
  await apiRequest<void>(
    `${CONTRACTS_PATH}/${contractId}/approval-rules/${encodeURIComponent(ruleId)}`,
    {
      method: 'DELETE',
      headers,
      useContractsBase: true,
    }
  );
}

export { ApiError };
