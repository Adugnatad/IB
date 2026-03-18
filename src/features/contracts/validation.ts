import * as yup from 'yup';

const ACCOUNT_NUMBER_LENGTH = 13;
const ACCOUNT_NUMBER_REGEX = /^\d{13}$/;

export const accountNumberSchema = yup
  .string()
  .trim()
  .required('Account number is required')
  .length(ACCOUNT_NUMBER_LENGTH, `Account number must be exactly ${ACCOUNT_NUMBER_LENGTH} digits`)
  .matches(ACCOUNT_NUMBER_REGEX, `Account number must be exactly ${ACCOUNT_NUMBER_LENGTH} digits`);

export const createContractSchema = yup.object({
  contractName: yup.string().trim().required('Contract name is required').max(255, 'Max 255 characters'),
  description: yup.string().trim().required('Description is required').max(2000, 'Max 2000 characters'),
  accountNumber: accountNumberSchema,
  customerId: yup.string().trim().required('Customer ID is required (enter a valid account number first)'),
  effectiveDate: yup.string().trim().required('Effective date is required'),
  expiryDate: yup.string().trim().required('Expiry date is required'),
  autoActivate: yup.boolean().default(true),
  metadata: yup.string().trim().max(1000).optional(),
}).test(
  'dates-order',
  'Expiry date must be after effective date',
  function (value) {
    if (!value?.effectiveDate || !value?.expiryDate) return true;
    const effective = new Date(value.effectiveDate).getTime();
    const expiry = new Date(value.expiryDate).getTime();
    return expiry > effective;
  }
);

export type CreateContractFormValues = yup.InferType<typeof createContractSchema>;

/** Schema for update contract form (edit dialog). */
export const updateContractSchema = yup
  .object({
    contractName: yup.string().trim().required('Contract name is required').max(255, 'Max 255 characters'),
    description: yup.string().trim().required('Description is required').max(2000, 'Max 2000 characters'),
    effectiveDate: yup.string().trim().required('Effective date is required'),
    expiryDate: yup.string().trim().required('Expiry date is required'),
    isActive: yup.boolean().default(true),
    metadata: yup.string().trim().max(1000).optional(),
  })
  .test(
    'dates-order',
    'Expiry date must be on or after effective date',
    function (value) {
      if (!value?.effectiveDate || !value?.expiryDate) return true;
      const effective = new Date(value.effectiveDate).getTime();
      const expiry = new Date(value.expiryDate).getTime();
      if (Number.isNaN(effective) || Number.isNaN(expiry)) return true;
      // Allow same-day expiry (>= instead of >)
      return expiry >= effective;
    }
  );

export type UpdateContractFormValues = yup.InferType<typeof updateContractSchema>;

export function isValidAccountNumber(value: string): boolean {
  return /^\d{13}$/.test((value ?? '').trim());
}
