/**
 * Account lookup API for contract creation.
 * GET /accounts/by-account-number/{accountNumber}
 */
import { apiRequest, ApiError } from './client';
import type { AccountLookupResponse } from '@/types/account';

const ACCOUNTS_BY_NUMBER_PATH = '/accounts/by-account-number';

export async function getAccountByNumber(accountNumber: string): Promise<AccountLookupResponse['data']> {
  const path = `${ACCOUNTS_BY_NUMBER_PATH}/${encodeURIComponent(accountNumber)}`;
  const { data } = await apiRequest<AccountLookupResponse>(path, { method: 'GET' });
  if (!data?.data) {
    throw new ApiError('Account not found', 'NOT_FOUND', 404);
  }
  return data.data;
}

export { ApiError };
