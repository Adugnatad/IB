'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
  Spinner,
} from 'reactstrap';
import { useForm, Controller } from 'react-hook-form';
import { getAccountByNumber } from '@/services/api/accounts-api';
import type { AccountLookupData } from '@/types/account';
import { createContractSchema, isValidAccountNumber, type CreateContractFormValues } from './validation';

export interface CreateContractFormProps {
  createdByUserId: string;
  submitLoading: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateContractFormValues & { accountNumbersToLink: string[] }) => Promise<void>;
}

const defaultValues: CreateContractFormValues = {
  contractName: '',
  description: '',
  accountNumber: '',
  customerId: '',
  effectiveDate: '',
  expiryDate: '',
  autoActivate: true,
  metadata: '',
};

export function CreateContractForm({
  createdByUserId,
  submitLoading,
  onCancel,
  onSubmit,
}: CreateContractFormProps) {
  const { t } = useTranslation();
  const [accountLookup, setAccountLookup] = useState<AccountLookupData | null>(null);
  const [accountLookupLoading, setAccountLookupLoading] = useState(false);
  const [accountLookupError, setAccountLookupError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CreateContractFormValues>({
    defaultValues,
  });

  const accountNumber = watch('accountNumber');

  const fetchAccount = useCallback(async (num: string) => {
    const trimmed = num.trim();
    if (!isValidAccountNumber(trimmed)) {
      setAccountLookup(null);
      setAccountLookupError(null);
      return;
    }
    setAccountLookupLoading(true);
    setAccountLookupError(null);
    try {
      const data = await getAccountByNumber(trimmed);
      setAccountLookup(data);
      setValue('customerId', data.customerId);
      clearErrors('customerId');
      clearErrors('accountNumber');
    } catch (err) {
      setAccountLookup(null);
      setValue('customerId', '');
      const message = err instanceof Error ? err.message : t('Account not found.');
      setAccountLookupError(message);
      setError('accountNumber', { message });
    } finally {
      setAccountLookupLoading(false);
    }
  }, [setValue, setError, clearErrors, t]);

  useEffect(() => {
    if (!accountNumber || !isValidAccountNumber(accountNumber.trim())) {
      setAccountLookup(null);
      setAccountLookupError(null);
      setValue('customerId', '');
      return;
    }
    const timer = setTimeout(() => fetchAccount(accountNumber), 400);
    return () => clearTimeout(timer);
  }, [accountNumber, setValue, fetchAccount]);

  const onFormSubmit = handleSubmit(async (values) => {
    if (!accountLookup || !values.customerId) {
      setError('accountNumber', { message: t('Enter a valid 13-digit account number and wait for lookup.') });
      return;
    }
    const accountNum = values.accountNumber.trim();
    if (!isValidAccountNumber(accountNum)) {
      setError('accountNumber', { message: t('Account number must be exactly 13 digits.') });
      return;
    }
    try {
      const valid = await createContractSchema.validate(values, { abortEarly: false });
      await onSubmit({
        ...valid,
        accountNumbersToLink: [accountNum],
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'inner' in err) {
        const inner = (err as { inner: { path?: string; message?: string }[] }).inner;
        inner?.forEach((e) => {
          if (e.path) setError(e.path as keyof CreateContractFormValues, { message: e.message });
        });
      }
    }
  });

  return (
    <Card className="mb-3">
      <CardHeader className="d-flex align-items-center justify-content-between">
        <h6 className="mb-0">{t('Create contract')}</h6>
        <Button color="link" size="sm" className="p-0 text-primary" onClick={onCancel} disabled={submitLoading}>
          {t('Cancel')}
        </Button>
      </CardHeader>
      <CardBody>
        <Form onSubmit={onFormSubmit}>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="contractName">{t('Contract Name')}</Label>
                <Controller
                  name="contractName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="contractName"
                      {...field}
                      invalid={!!errors.contractName}
                      disabled={submitLoading}
                      placeholder={t('Contract Name')}
                    />
                  )}
                />
                {errors.contractName && (
                  <small className="text-danger">{errors.contractName.message}</small>
                )}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="accountNumber">{t('Account Number')} (13 {t('digits')})</Label>
                <Controller
                  name="accountNumber"
                  control={control}
                  render={({ field }) => (
                    <div className="d-flex align-items-center gap-2">
                      <Input
                        id="accountNumber"
                        {...field}
                        maxLength={13}
                        placeholder="0000000000000"
                        invalid={!!errors.accountNumber || !!accountLookupError}
                        disabled={submitLoading}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '');
                          field.onChange(v);
                        }}
                      />
                      {accountLookupLoading && <Spinner size="sm" />}
                    </div>
                  )}
                />
                {accountLookupError && (
                  <small className="text-danger d-block">{accountLookupError}</small>
                )}
                {errors.accountNumber && !accountLookupError && (
                  <small className="text-danger">{errors.accountNumber.message}</small>
                )}
              </FormGroup>
            </Col>
            <Col md={12}>
              <FormGroup>
                <Label for="description">{t('Description')}</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="description"
                      type="textarea"
                      rows={2}
                      {...field}
                      invalid={!!errors.description}
                      disabled={submitLoading}
                      placeholder={t('Description')}
                    />
                  )}
                />
                {errors.description && (
                  <small className="text-danger">{errors.description.message}</small>
                )}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="customerId">{t('Customer ID')}</Label>
                <Controller
                  name="customerId"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="customerId"
                      {...field}
                      readOnly
                      invalid={!!errors.customerId}
                      disabled={submitLoading}
                      placeholder={t('Filled from account lookup')}
                    />
                  )}
                />
                {accountLookup && (
                  <small className="text-muted d-block mt-1">
                    {t('Customer')}: {accountLookup.customerName} · {accountLookup.displayName} ({accountLookup.accountType})
                  </small>
                )}
                {errors.customerId && (
                  <small className="text-danger">{errors.customerId.message}</small>
                )}
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label for="effectiveDate">{t('Effective Date')}</Label>
                <Controller
                  name="effectiveDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="effectiveDate"
                      type="date"
                      {...field}
                      invalid={!!errors.effectiveDate}
                      disabled={submitLoading}
                    />
                  )}
                />
                {errors.effectiveDate && (
                  <small className="text-danger">{errors.effectiveDate.message}</small>
                )}
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label for="expiryDate">{t('Expiry Date')}</Label>
                <Controller
                  name="expiryDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="expiryDate"
                      type="date"
                      {...field}
                      invalid={!!errors.expiryDate}
                      disabled={submitLoading}
                    />
                  )}
                />
                {errors.expiryDate && (
                  <small className="text-danger">{errors.expiryDate.message}</small>
                )}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="metadata">{t('Metadata')} ({t('optional')})</Label>
                <Controller
                  name="metadata"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="metadata"
                      type="textarea"
                      rows={1}
                      {...field}
                      disabled={submitLoading}
                      placeholder={t('Optional metadata')}
                    />
                  )}
                />
              </FormGroup>
            </Col>
            <Col md={6} className="d-flex align-items-center justify-content-end pb-2">
              <FormGroup check className="contract-auto-activate mb-0">
                <Controller
                  name="autoActivate"
                  control={control}
                  render={({ field }) => (
                    <label className="form-check-label">
                      <Input
                        type="checkbox"
                        className="form-check-input"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        disabled={submitLoading}
                      />
                      <span>{t('Auto activate')}</span>
                    </label>
                  )}
                />
              </FormGroup>
            </Col>
          </Row>
          <div className="d-flex gap-2 mt-2">
            <Button color="light" type="button" onClick={onCancel} disabled={submitLoading}>
              {t('Cancel')}
            </Button>
            <Button
              color="primary"
              type="submit"
              disabled={submitLoading || accountLookupLoading || !accountLookup}
            >
              {submitLoading ? (
                <>
                  <Spinner size="sm" className="me-1" /> {t('Submitting...')}
                </>
              ) : (
                t('Create contract')
              )}
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  );
}
