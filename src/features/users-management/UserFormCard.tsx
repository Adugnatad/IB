'use client';

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardHeader, Button, Form, FormGroup, Label, Input, Row, Col, Spinner } from 'reactstrap';
import { useForm, Controller } from 'react-hook-form';
import type { AdminUser } from '@/types/admin';
import type { Role } from '@/types/admin';
import { createUserSchema, updateUserSchema, type CreateUserFormValues, type UpdateUserFormValues } from './validation';

export type UserFormMode = 'create' | 'edit';

export interface UserFormCardProps {
  mode: UserFormMode;
  user?: AdminUser | null;
  roles: Role[];
  rolesLoading: boolean;
  submitLoading: boolean;
  onCancel: () => void;
  onSubmitCreate: (values: CreateUserFormValues) => Promise<void>;
  onSubmitUpdate: (userId: string, values: UpdateUserFormValues) => Promise<void>;
}

const defaultCreateValues: CreateUserFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  roleId: '',
};

type FormValues = CreateUserFormValues & UpdateUserFormValues;

export function UserFormCard({
  mode,
  user,
  roles,
  rolesLoading,
  submitLoading,
  onCancel,
  onSubmitCreate,
  onSubmitUpdate,
}: UserFormCardProps) {
  const { t } = useTranslation();
  const schema = mode === 'create' ? createUserSchema : updateUserSchema;
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: defaultCreateValues,
  });

  useEffect(() => {
    if (mode === 'edit' && user) {
      reset({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: (user as { email?: string }).email ?? '',
        phone: (user as { phone?: string }).phone ?? user.emergencyContactPhone ?? '',
        roleId: (user as { roleId?: string }).roleId ?? '',
      });
    } else {
      reset(defaultCreateValues);
    }
  }, [mode, user, reset]);

  const onFormSubmit = handleSubmit(async (values) => {
    try {
      const valid = await schema.validate(values, { abortEarly: false });
      if (mode === 'create') {
        await onSubmitCreate(valid as CreateUserFormValues);
      } else if (user?.id) {
        await onSubmitUpdate(user.id, valid as UpdateUserFormValues);
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'inner' in err) {
        const inner = (err as { inner: { path?: string; message?: string }[] }).inner;
        inner?.forEach((e) => {
          if (e.path) setError(e.path as keyof FormValues, { message: e.message });
        });
      }
    }
  });

  const title = mode === 'create' ? t('Add user') : t('Edit user');
  const submitLabel = mode === 'create' ? t('Create user') : t('Save changes');

  return (
    <Card className="mb-3">
      <CardHeader className="d-flex align-items-center justify-content-between">
        <h6 className="mb-0">{title}</h6>
        <Button color="link" size="sm" className="p-0 text-primary" onClick={onCancel}>
          {t('Cancel')}
        </Button>
      </CardHeader>
      <CardBody>
        <Form onSubmit={onFormSubmit}>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="firstName">{t('First name')}</Label>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="firstName"
                      {...field}
                      invalid={!!errors.firstName}
                      disabled={submitLoading}
                      placeholder={t('First name')}
                    />
                  )}
                />
                {errors.firstName && (
                  <small className="text-danger">{errors.firstName.message}</small>
                )}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="lastName">{t('Last name')}</Label>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="lastName"
                      {...field}
                      invalid={!!errors.lastName}
                      disabled={submitLoading}
                      placeholder={t('Last name')}
                    />
                  )}
                />
                {errors.lastName && (
                  <small className="text-danger">{errors.lastName.message}</small>
                )}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="email">{t('Email')}</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="email"
                      type="email"
                      {...field}
                      invalid={!!errors.email}
                      disabled={submitLoading}
                      placeholder={t('Email')}
                    />
                  )}
                />
                {errors.email && (
                  <small className="text-danger">{errors.email.message}</small>
                )}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="phone">{t('Phone')}</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="phone"
                      {...field}
                      invalid={!!errors.phone}
                      disabled={submitLoading}
                      placeholder={t('Phone')}
                    />
                  )}
                />
                {errors.phone && (
                  <small className="text-danger">{errors.phone.message}</small>
                )}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="roleId">{t('Role')}</Label>
                <Controller
                  name="roleId"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="roleId"
                      type="select"
                      {...field}
                      invalid={!!errors.roleId}
                      disabled={submitLoading || rolesLoading}
                    >
                      <option value="">{t('Select role')}</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </Input>
                  )}
                />
                {rolesLoading && (
                  <small className="text-muted">{t('Loading roles...')}</small>
                )}
                {!rolesLoading && roles.length === 0 && (
                  <small className="text-warning">{t('No roles available.')}</small>
                )}
                {errors.roleId && (
                  <small className="text-danger">{errors.roleId.message}</small>
                )}
              </FormGroup>
            </Col>
          </Row>
          <div className="d-flex gap-2 mt-2">
            <Button color="light" type="button" onClick={onCancel} disabled={submitLoading}>
              {t('Cancel')}
            </Button>
            <Button color="primary" type="submit" disabled={submitLoading}>
              {submitLoading ? <><Spinner size="sm" className="me-1" /> {t('Submitting...')}</> : submitLabel}
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  );
}
