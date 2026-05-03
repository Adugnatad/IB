/**
 * Account lookup API for contract creation.
 * GET /accounts/by-account-number/{accountNumber}
 */
import { apiRequest, ApiError } from './client';
import type { AccountLookupData, AccountLookupRawResponse } from '@/types/account';

const ACCOUNTS_BY_NUMBER_PATH = '/accounts/by-account-number';

export async function getAccountByNumber(accountNumber: string): Promise<AccountLookupData> {
  const path = `${ACCOUNTS_BY_NUMBER_PATH}/${encodeURIComponent(accountNumber)}`;
  const { data } = await apiRequest<AccountLookupRawResponse>(path, { method: 'GET' });
  const customerDetails = data?.customerDetails ?? {};
  const customerId =
    (typeof customerDetails.customerId === 'string' ? customerDetails.customerId : '') ||
    (typeof (data as unknown as { customerId?: string })?.customerId === 'string'
      ? (data as unknown as { customerId?: string }).customerId ?? ''
      : '');

  if (!customerId) {
    throw new ApiError('Account not found', 'NOT_FOUND', 404);
  }

  const customerName =
    (typeof customerDetails.customerName === 'string' ? customerDetails.customerName : '') ||
    (typeof data?.customerName === 'string' ? data.customerName : '');
  const displayName =
    (typeof customerDetails.displayName === 'string' ? customerDetails.displayName : '') ||
    (typeof data?.displayName === 'string' ? data.displayName : '');

  return {
    customerId: String(customerId).trim(),
    customerName: String(customerName ?? '').trim(),
    displayName: String(displayName ?? '').trim(),
    productName: typeof customerDetails.productName === 'string' ? customerDetails.productName : undefined,
    categoryName: typeof customerDetails.categoryName === 'string' ? customerDetails.categoryName : undefined,
    accountId: typeof customerDetails.accountId === 'string' ? customerDetails.accountId : undefined,
    accountStatus: typeof customerDetails.accountStatus === 'string' ? customerDetails.accountStatus : undefined,
    currencyId: typeof customerDetails.currencyId === 'string' ? customerDetails.currencyId : undefined,
  };
}

export { ApiError };
