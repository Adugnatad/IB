'use client';

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardHeader, Button, Form, FormGroup, Label, Input, Row, Col } from 'reactstrap';
import { useForm, Controller } from 'react-hook-form';
import { AppLoader } from '@/Component/Loader';
import type { Contract, UpdateContractPayload } from '@/types/contracts';
import { updateContractSchema, type UpdateContractFormValues } from './validation';
import { isoToDateInputValue } from './utils';
import { toast } from 'react-toastify';
import { TOAST_AUTO_CLOSE_MS } from '@/CommonComponents/ToastProvider';

export interface EditContractFormProps {
  contract: Contract;
  submitLoading: boolean;
  onCancel: () => void;
  onSubmit: (contractId: string, payload: UpdateContractPayload) => Promise<void>;
}

const defaultValues: UpdateContractFormValues = {
  contractName: '',
  description: '',
  effectiveDate: '',
  expiryDate: '',
  isActive: true,
  metadata: '',
};

function toPayload(values: UpdateContractFormValues): UpdateContractPayload {
  return {
    contractName: values.contractName.trim(),
    description: values.description.trim(),
    effectiveDate: new Date(values.effectiveDate).toISOString(),
    expiryDate: new Date(values.expiryDate).toISOString(),
    isActive: values.isActive,
    metadata: values.metadata?.trim() || undefined,
  };
}

export function EditContractForm({ contract, submitLoading, onCancel, onSubmit }: EditContractFormProps) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UpdateContractFormValues>({ defaultValues });

  useEffect(() => {
    reset({
      contractName: contract.contractName ?? '',
      description: contract.description ?? '',
      effectiveDate: isoToDateInputValue(contract.effectiveDate),
      expiryDate: isoToDateInputValue(contract.expiryDate),
      isActive: contract.active ?? true,
      metadata: contract.metadata ?? '',
    });
  }, [contract, reset]);

  const onFormSubmit = handleSubmit(
    async (values) => {
      try {
        const valid = await updateContractSchema.validate(values, { abortEarly: false });
        await onSubmit(contract.id, toPayload(valid));
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'inner' in err) {
          const inner = (err as { inner: { path?: string; message?: string }[] }).inner;
          inner?.forEach((e) => {
            if (e.path) setError(e.path as keyof UpdateContractFormValues, { message: e.message });
          });
          const first = inner?.find((e) => e.message);
          toast.error(first?.message || t('Please fix the highlighted fields and try again.'), {
            autoClose: TOAST_AUTO_CLOSE_MS,
          });
          return;
        }
        const msg = err instanceof Error ? err.message : t('Failed to save changes.');
        toast.error(msg, { autoClose: TOAST_AUTO_CLOSE_MS });
      }
    },
    (formErrors) => {
      const firstKey = Object.keys(formErrors)[0] as keyof UpdateContractFormValues | undefined;
      const firstMessage = firstKey ? formErrors[firstKey]?.message : undefined;
      toast.error(
        (typeof firstMessage === 'string' && firstMessage) || t('Please fix the highlighted fields and try again.'),
        { autoClose: TOAST_AUTO_CLOSE_MS }
      );
    }
  );

  return (
    <Card className="mb-3">
      <CardHeader className="d-flex align-items-center justify-content-between">
        <h6 className="mb-0">{t('Edit contract')}</h6>
        <Button color="link" size="sm" className="p-0 text-primary" onClick={onCancel} disabled={submitLoading}>
          {t('Cancel')}
        </Button>
      </CardHeader>
      <CardBody>
        <Form onSubmit={onFormSubmit}>
          <Row>
            <Col md={12}>
              <FormGroup>
                <Label for="edit-contractName">{t('Contract Name')}</Label>
                <Controller
                  name="contractName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="edit-contractName"
                      {...field}
                      invalid={!!errors.contractName}
                      disabled={submitLoading}
                      placeholder={t('Contract Name')}
                    />
                  )}
                />
                {errors.contractName && <small className="text-danger">{errors.contractName.message}</small>}
              </FormGroup>
            </Col>
            <Col md={12}>
              <FormGroup>
                <Label for="edit-description">{t('Description')}</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="edit-description"
                      type="textarea"
                      rows={2}
                      {...field}
                      invalid={!!errors.description}
                      disabled={submitLoading}
                      placeholder={t('Description')}
                    />
                  )}
                />
                {errors.description && <small className="text-danger">{errors.description.message}</small>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="edit-effectiveDate">{t('Effective Date')}</Label>
                <Controller
                  name="effectiveDate"
                  control={control}
                  render={({ field }) => (
                    <Input id="edit-effectiveDate" type="date" {...field} invalid={!!errors.effectiveDate} disabled={submitLoading} />
                  )}
                />
                {errors.effectiveDate && <small className="text-danger">{errors.effectiveDate.message}</small>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="edit-expiryDate">{t('Expiry Date')}</Label>
                <Controller
                  name="expiryDate"
                  control={control}
                  render={({ field }) => (
                    <Input id="edit-expiryDate" type="date" {...field} invalid={!!errors.expiryDate} disabled={submitLoading} />
                  )}
                />
                {errors.expiryDate && <small className="text-danger">{errors.expiryDate.message}</small>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <div className="contract-auto-activate">
                      <Label check className="form-check-label">
                        <Input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          disabled={submitLoading}
                        />
                        {t('Active')}
                      </Label>
                    </div>
                  )}
                />
              </FormGroup>
            </Col>
            <Col md={12}>
              <FormGroup>
                <Label for="edit-metadata">{t('Metadata')}</Label>
                <Controller
                  name="metadata"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="edit-metadata"
                      type="textarea"
                      rows={1}
                      {...field}
                      invalid={!!errors.metadata}
                      disabled={submitLoading}
                      placeholder={t('Metadata (optional)')}
                    />
                  )}
                />
                {errors.metadata && <small className="text-danger">{errors.metadata.message}</small>}
              </FormGroup>
            </Col>
          </Row>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <Button color="light" type="button" onClick={onCancel} disabled={submitLoading}>
              {t('Cancel')}
            </Button>
            <Button color="primary" type="submit" disabled={submitLoading}>
              {submitLoading ? (
                <>
                  <AppLoader size="sm" className="me-1" aria-label={t('Loading')} />
                  {t('Saving...')}
                </>
              ) : (
                t('Save changes')
              )}
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  );
}

