/**
 * Account lookup response for contract creation.
 * GET /api/v1/accounts/by-account-number/{accountNumber}
 *
 * Backend response contains `customerDetails.customerId` which is used as Customer ID in contract creation.
 */

export interface AccountLookupCustomerDetails {
  customerId?: string;
  customerName?: string;
  displayName?: string;
  productName?: string;
  categoryName?: string;
  accountStatus?: string;
  accountId?: string;
  currencyId?: string;
  IBAN?: string;
  balance?: string;
  phoneNumber?: string;
  email?: string;
  [key: string]: unknown;
}

export interface AccountLookupRawResponse {
  displayName?: string;
  customerName?: string;
  success?: boolean;
  customerDetails?: AccountLookupCustomerDetails;
  responseCode?: string;
  responseMessage?: string;
}

/**
 * Normalized data shape used by UI.
 */
export interface AccountLookupData {
  customerId: string;
  customerName: string;
  displayName: string;
  productName?: string;
  categoryName?: string;
  accountId?: string;
  accountStatus?: string;
  currencyId?: string;
}
