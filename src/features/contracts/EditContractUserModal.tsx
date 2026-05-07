'use client';

import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalHeader, ModalBody, Button, Form, FormGroup, Label, Input, Row, Col } from 'reactstrap';
import { Controller, useForm, type DefaultValues } from 'react-hook-form';
import { toast } from 'react-toastify';
import { AppLoader } from '@/Component/Loader';
import { TOAST_AUTO_CLOSE_MS } from '@/CommonComponents/ToastProvider';
import type { AddContractUserPayload, Contract, ContractUserPermissionType } from '@/types/contracts';
import { CONTRACT_USER_PERMISSION_TYPES } from '@/types/contracts';
import { editContractUserSchema, type EditContractUserFormValues } from './validation';
import { CONTRACT_ROLE_OPTIONS, roleNameToContractRoleId } from './contractRoleOptions';

const GENDER_OPTIONS = ['Male', 'Female'] as const;

export interface RawContractUserRow {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roleName?: string;
  signatoryMetrics?: Array<{ permissionType?: string; active?: boolean }>;
  dateOfBirth?: string;
  gender?: string;
  addressLine1?: string;
}

function toIsoDateOnly(value?: string): string {
  if (!value || typeof value !== 'string') return '';
  const slice = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(slice) ? slice : '';
}

function defaultPermissionType(metrics?: RawContractUserRow['signatoryMetrics']): ContractUserPermissionType {
  const list = Array.isArray(metrics) ? metrics : [];
  const pick = list.find((m) => m?.active !== false && m?.permissionType);
  const p = String(pick?.permissionType ?? '').toUpperCase().trim();
  if (
    CONTRACT_USER_PERMISSION_TYPES.some((allowed) => allowed === (p as ContractUserPermissionType))
  ) {
    return p as ContractUserPermissionType;
  }
  return 'INITIATE';
}

function toPayload(values: EditContractUserFormValues): AddContractUserPayload {
  return {
    phone: values.phone.trim(),
    email: values.email.trim(),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    gender: values.gender.trim(),
    dateOfBirth: values.dateOfBirth.trim(),
    addressLine1: values.addressLine1.trim(),
  };
}

export interface EditContractUserModalProps {
  isOpen: boolean;
  contract: Contract;
  /** Single element from contract.users — shape varies by backend. */
  contractUser: RawContractUserRow | null;
  submitLoading: boolean;
  onClose: () => void;
  onSubmit: (
    contractUserId: string,
    roleId: string,
    permissionType: ContractUserPermissionType,
    payload: AddContractUserPayload
  ) => Promise<void>;
}

export function EditContractUserModal({
  isOpen,
  contract,
  contractUser,
  submitLoading,
  onClose,
  onSubmit,
}: EditContractUserModalProps) {
  const { t } = useTranslation();

  const contractUserId = contractUser?.id?.trim() ?? '';

  const defaultValues = useMemo((): DefaultValues<EditContractUserFormValues> => {
    const roleId = roleNameToContractRoleId(contractUser?.roleName);
    const genderRaw = typeof contractUser?.gender === 'string' ? contractUser.gender.trim() : '';
    const gender = GENDER_OPTIONS.includes(genderRaw as (typeof GENDER_OPTIONS)[number])
      ? (genderRaw as (typeof GENDER_OPTIONS)[number])
      : undefined;
    return {
      roleId: CONTRACT_ROLE_OPTIONS.some((r) => r.value === roleId) ? roleId : '',
      permissionType: defaultPermissionType(contractUser?.signatoryMetrics),
      phone: (contractUser?.phone ?? '').trim(),
      email: (contractUser?.email ?? '').trim(),
      firstName: (contractUser?.firstName ?? '').trim(),
      lastName: (contractUser?.lastName ?? '').trim(),
      gender,
      dateOfBirth: toIsoDateOnly(contractUser?.dateOfBirth),
      addressLine1: (contractUser?.addressLine1 ?? '').trim(),
    };
  }, [contractUser]);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<EditContractUserFormValues>({ defaultValues });

  useEffect(() => {
    if (isOpen && contractUser?.id) {
      reset(defaultValues);
    }
  }, [isOpen, contractUser?.id, defaultValues, reset]);

  const onFormSubmit = handleSubmit(
    async (values) => {
      try {
        if (!contractUserId) {
          toast.error(t('Missing linked user identifier.'), { autoClose: TOAST_AUTO_CLOSE_MS });
          return;
        }
        const valid = await editContractUserSchema.validate(values, { abortEarly: false });
        await onSubmit(contractUserId, valid.roleId.trim(), valid.permissionType as ContractUserPermissionType, toPayload(valid));
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'inner' in err) {
          const inner = (err as { inner: { path?: string; message?: string }[] }).inner;
          inner?.forEach((e) => {
            if (e.path) setError(e.path as keyof EditContractUserFormValues, { message: e.message });
          });
          const first = inner?.find((e) => e.message);
          toast.error(first?.message || t('Please fix the highlighted fields and try again.'), {
            autoClose: TOAST_AUTO_CLOSE_MS,
          });
          return;
        }
        const msg = err instanceof Error ? err.message : t('Failed to update contract user.');
        toast.error(msg, { autoClose: TOAST_AUTO_CLOSE_MS });
      }
    },
    (formErrors) => {
      const firstKey = Object.keys(formErrors)[0] as keyof EditContractUserFormValues | undefined;
      const firstMessage = firstKey ? formErrors[firstKey]?.message : undefined;
      toast.error(
        (typeof firstMessage === 'string' && firstMessage) || t('Please fix the highlighted fields and try again.'),
        { autoClose: TOAST_AUTO_CLOSE_MS }
      );
    }
  );

  const headline = contractUser?.username ?? contractUser?.email ?? '';

  return (
    <Modal isOpen={isOpen} toggle={submitLoading ? undefined : onClose} size="lg">
      <ModalHeader toggle={submitLoading ? undefined : onClose}>
        {t('Edit linked user')}
        {headline ? ` — ${headline}` : ''}
      </ModalHeader>
      <ModalBody>
        <p className="text-muted small mb-3">
          {t('Contract')}: {contract.contractName || contract.id}
        </p>
        <Form onSubmit={onFormSubmit}>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="edit-roleId">{t('Role')}</Label>
                <Controller
                  name="roleId"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="edit-roleId"
                      type="select"
                      {...field}
                      invalid={!!errors.roleId}
                      disabled={submitLoading}
                    >
                      <option value="">{t('Select role')}</option>
                      {CONTRACT_ROLE_OPTIONS.map((role) => (
                        <option key={role.value} value={role.value}>
                          {t(role.label)}
                        </option>
                      ))}
                    </Input>
                  )}
                />
                {errors.roleId && <small className="text-danger">{errors.roleId.message}</small>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="edit-phone">{t('Phone')}</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input id="edit-phone" {...field} invalid={!!errors.phone} disabled={submitLoading} placeholder={t('Phone')} />
                  )}
                />
                {errors.phone && <small className="text-danger">{errors.phone.message}</small>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="edit-permissionType">{t('Permission Type')}</Label>
                <Controller
                  name="permissionType"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="edit-permissionType"
                      type="select"
                      {...field}
                      invalid={!!errors.permissionType}
                      disabled={submitLoading}
                    >
                      {CONTRACT_USER_PERMISSION_TYPES.map((option) => (
                        <option key={option} value={option}>
                          {t(option)}
                        </option>
                      ))}
                    </Input>
                  )}
                />
                {errors.permissionType && <small className="text-danger">{errors.permissionType.message}</small>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="edit-email">{t('Email')}</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input id="edit-email" {...field} type="email" invalid={!!errors.email} disabled={submitLoading} placeholder={t('Email')} />
                  )}
                />
                {errors.email && <small className="text-danger">{errors.email.message}</small>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="edit-firstName">{t('First Name')}</Label>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <Input id="edit-firstName" {...field} invalid={!!errors.firstName} disabled={submitLoading} placeholder={t('First Name')} />
                  )}
                />
                {errors.firstName && <small className="text-danger">{errors.firstName.message}</small>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="edit-lastName">{t('Last Name')}</Label>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <Input id="edit-lastName" {...field} invalid={!!errors.lastName} disabled={submitLoading} placeholder={t('Last Name')} />
                  )}
                />
                {errors.lastName && <small className="text-danger">{errors.lastName.message}</small>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="edit-gender">{t('Gender')}</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Input id="edit-gender" type="select" {...field} invalid={!!errors.gender} disabled={submitLoading}>
                      <option value="">{t('Select gender')}</option>
                      {GENDER_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {t(option)}
                        </option>
                      ))}
                    </Input>
                  )}
                />
                {errors.gender && <small className="text-danger">{errors.gender.message}</small>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="edit-dateOfBirth">{t('Date of Birth')}</Label>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <Input id="edit-dateOfBirth" type="date" {...field} invalid={!!errors.dateOfBirth} disabled={submitLoading} />
                  )}
                />
                {errors.dateOfBirth && <small className="text-danger">{errors.dateOfBirth.message}</small>}
              </FormGroup>
            </Col>
            <Col md={12}>
              <FormGroup>
                <Label for="edit-addressLine1">{t('Address')}</Label>
                <Controller
                  name="addressLine1"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="edit-addressLine1"
                      {...field}
                      invalid={!!errors.addressLine1}
                      disabled={submitLoading}
                      placeholder={t('Address line 1')}
                    />
                  )}
                />
                {errors.addressLine1 && <small className="text-danger">{errors.addressLine1.message}</small>}
              </FormGroup>
            </Col>
          </Row>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <Button color="light" type="button" onClick={onClose} disabled={submitLoading}>
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
