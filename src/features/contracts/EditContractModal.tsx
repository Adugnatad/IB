'use client';

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ModalHeader,
  ModalBody,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
} from 'reactstrap';
import { useForm, Controller } from 'react-hook-form';
import { AppLoader } from '@/Component/Loader';
import type { Contract } from '@/types/contracts';
import type { UpdateContractPayload } from '@/types/contracts';
import { updateContractSchema, type UpdateContractFormValues } from './validation';
import { isoToDateInputValue } from './utils';

export interface EditContractModalProps {
  isOpen: boolean;
  toggle: () => void;
  contract: Contract | null;
  submitLoading: boolean;
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

export function EditContractModal({
  isOpen,
  toggle,
  contract,
  submitLoading,
  onSubmit,
}: EditContractModalProps) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UpdateContractFormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (contract && isOpen) {
      reset({
        contractName: contract.contractName ?? '',
        description: contract.description ?? '',
        effectiveDate: isoToDateInputValue(contract.effectiveDate),
        expiryDate: isoToDateInputValue(contract.expiryDate),
        isActive: contract.active ?? true,
        metadata: contract.metadata ?? '',
      });
    }
  }, [contract, isOpen, reset]);

  const onFormSubmit = handleSubmit(async (values) => {
    if (!contract) return;
    try {
      const valid = await updateContractSchema.validate(values, { abortEarly: false });
      await onSubmit(contract.id, toPayload(valid));
      toggle();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'inner' in err) {
        const inner = (err as { inner: { path?: string; message?: string }[] }).inner;
        inner?.forEach((e) => {
          if (e.path) setError(e.path as keyof UpdateContractFormValues, { message: e.message });
        });
      }
    }
  });

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>{t('Edit contract')}</ModalHeader>
      <ModalBody>
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
                {errors.contractName && (
                  <small className="text-danger">{errors.contractName.message}</small>
                )}
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
                {errors.description && (
                  <small className="text-danger">{errors.description.message}</small>
                )}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="edit-effectiveDate">{t('Effective Date')}</Label>
                <Controller
                  name="effectiveDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="edit-effectiveDate"
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
            <Col md={6}>
              <FormGroup>
                <Label for="edit-expiryDate">{t('Expiry Date')}</Label>
                <Controller
                  name="expiryDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="edit-expiryDate"
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
                {errors.metadata && (
                  <small className="text-danger">{errors.metadata.message}</small>
                )}
              </FormGroup>
            </Col>
          </Row>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button color="light" type="button" onClick={toggle} disabled={submitLoading}>
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
      </ModalBody>
    </Modal>
  );
}
