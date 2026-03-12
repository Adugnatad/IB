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
} from '@/types/contracts';

const CONTRACTS_PATH = '/contracts';

function buildQuery(params: ContractsListParams): string {
  const search = new URLSearchParams();
  if (params.status != null && params.status !== '') {
    search.set('status', params.status);
  }
  if (params.activeOnly != null) {
    search.set('activeOnly', String(params.activeOnly));
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

export { ApiError };
