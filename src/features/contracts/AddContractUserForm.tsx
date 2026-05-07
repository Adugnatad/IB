'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardHeader, Button, Form, FormGroup, Label, Input, Row, Col } from 'reactstrap';
import { Controller, useForm, type DefaultValues } from 'react-hook-form';
import { toast } from 'react-toastify';
import { AppLoader } from '@/Component/Loader';
import { TOAST_AUTO_CLOSE_MS } from '@/CommonComponents/ToastProvider';
import type { AddContractUserPayload, Contract, ContractUserPermissionType } from '@/types/contracts';
import { addContractUserSchema, type AddContractUserFormValues } from './validation';
import { CONTRACT_ROLE_OPTIONS } from './contractRoleOptions';

const GENDER_OPTIONS = ['Male', 'Female'] as const;
const CONTRACT_PERMISSION_TYPE_OPTIONS: ContractUserPermissionType[] = ['INITIATE', 'APPROVE', 'VIEW'];

export interface AddContractUserFormProps {
  contract: Contract;
  defaultRoleId: string;
  submitLoading: boolean;
  onCancel: () => void;
  onSubmit: (
    contractId: string,
    roleId: string,
    permissionType: ContractUserPermissionType,
    payload: AddContractUserPayload
  ) => Promise<void>;
}

const defaultValues: DefaultValues<AddContractUserFormValues> = {
  roleId: '',
  permissionType: 'INITIATE',
  phone: '',
  email: '',
  firstName: '',
  lastName: '',
  gender: undefined,
  dateOfBirth: '',
  addressLine1: '',
};

function toPayload(values: AddContractUserFormValues): AddContractUserPayload {
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

export function AddContractUserForm({
  contract,
  defaultRoleId,
  submitLoading,
  onCancel,
  onSubmit,
}: AddContractUserFormProps) {
  const { t } = useTranslation();
  const initialRoleId = CONTRACT_ROLE_OPTIONS.some((role) => role.value === defaultRoleId)
    ? defaultRoleId
    : '';
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AddContractUserFormValues>({
    defaultValues: { ...defaultValues, roleId: initialRoleId },
  });

  const onFormSubmit = handleSubmit(
    async (values) => {
      try {
        const valid = await addContractUserSchema.validate(values, { abortEarly: false });
        await onSubmit(
          contract.id,
          valid.roleId.trim(),
          valid.permissionType as ContractUserPermissionType,
          toPayload(valid)
        );
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'inner' in err) {
          const inner = (err as { inner: { path?: string; message?: string }[] }).inner;
          inner?.forEach((e) => {
            if (e.path) setError(e.path as keyof AddContractUserFormValues, { message: e.message });
          });
          const first = inner?.find((e) => e.message);
          toast.error(first?.message || t('Please fix the highlighted fields and try again.'), {
            autoClose: TOAST_AUTO_CLOSE_MS,
          });
          return;
        }
        const msg = err instanceof Error ? err.message : t('Failed to add contract user.');
        toast.error(msg, { autoClose: TOAST_AUTO_CLOSE_MS });
      }
    },
    (formErrors) => {
      const firstKey = Object.keys(formErrors)[0] as keyof AddContractUserFormValues | undefined;
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
        <h6 className="mb-0">
          {t('Add user to contract')}: {contract.contractName}
        </h6>
        <Button color="link" size="sm" className="p-0 text-primary" onClick={onCancel} disabled={submitLoading}>
          {t('Cancel')}
        </Button>
      </CardHeader>
      <CardBody>
        <Form onSubmit={onFormSubmit}>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="add-roleId">{t('Role')}</Label>
                <Controller
                  name="roleId"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="add-roleId"
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
                <Label for="add-phone">{t('Phone')}</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input id="add-phone" {...field} invalid={!!errors.phone} disabled={submitLoading} placeholder={t('Phone')} />
                  )}
                />
                {errors.phone && <small className="text-danger">{errors.phone.message}</small>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="add-permissionType">{t('Permission Type')}</Label>
                <Controller
                  name="permissionType"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="add-permissionType"
                      type="select"
                      {...field}
                      invalid={!!errors.permissionType}
                      disabled={submitLoading}
                    >
                      {CONTRACT_PERMISSION_TYPE_OPTIONS.map((option) => (
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
                <Label for="add-email">{t('Email')}</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input id="add-email" {...field} type="email" invalid={!!errors.email} disabled={submitLoading} placeholder={t('Email')} />
                  )}
                />
                {errors.email && <small className="text-danger">{errors.email.message}</small>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="add-firstName">{t('First Name')}</Label>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="add-firstName"
                      {...field}
                      invalid={!!errors.firstName}
                      disabled={submitLoading}
                      placeholder={t('First Name')}
                    />
                  )}
                />
                {errors.firstName && <small className="text-danger">{errors.firstName.message}</small>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="add-lastName">{t('Last Name')}</Label>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="add-lastName"
                      {...field}
                      invalid={!!errors.lastName}
                      disabled={submitLoading}
                      placeholder={t('Last Name')}
                    />
                  )}
                />
                {errors.lastName && <small className="text-danger">{errors.lastName.message}</small>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="add-gender">{t('Gender')}</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="add-gender"
                      type="select"
                      {...field}
                      invalid={!!errors.gender}
                      disabled={submitLoading}
                    >
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
                <Label for="add-dateOfBirth">{t('Date of Birth')}</Label>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="add-dateOfBirth"
                      type="date"
                      {...field}
                      invalid={!!errors.dateOfBirth}
                      disabled={submitLoading}
                    />
                  )}
                />
                {errors.dateOfBirth && <small className="text-danger">{errors.dateOfBirth.message}</small>}
              </FormGroup>
            </Col>
            <Col md={12}>
              <FormGroup>
                <Label for="add-addressLine1">{t('Address')}</Label>
                <Controller
                  name="addressLine1"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="add-addressLine1"
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
                t('Add user')
              )}
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  );
}
