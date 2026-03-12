/**
 * Account lookup response for contract creation.
 * GET /api/v1/accounts/by-account-number/{accountNumber}
 */

export interface AccountLookupData {
  accountId: string;
  customerId: string;
  customerName: string;
  displayName: string;
  accountType: string;
  currencyId: string;
  availableBalance: number;
}

export interface AccountLookupResponse {
  data: AccountLookupData;
}
