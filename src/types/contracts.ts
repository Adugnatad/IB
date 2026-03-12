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
