'use client';

import React, { useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, Button, Form, FormGroup, Label, Input, Spinner } from 'reactstrap';
import { useForm, Controller } from 'react-hook-form';
import type { AdminUser } from '@/types/admin';
import type { Role } from '@/types/admin';
import { createUserSchema, updateUserSchema, type CreateUserFormValues, type UpdateUserFormValues } from './validation';

export type UserFormMode = 'create' | 'edit';

export interface UserFormModalProps {
  isOpen: boolean;
  toggle: () => void;
  mode: UserFormMode;
  user?: AdminUser | null;
  roles: Role[];
  rolesLoading: boolean;
  submitLoading: boolean;
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

export function UserFormModal({
  isOpen,
  toggle,
  mode,
  user,
  roles,
  rolesLoading,
  submitLoading,
  onSubmitCreate,
  onSubmitUpdate,
}: UserFormModalProps) {
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
    if (!isOpen) return;
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
  }, [isOpen, mode, user, reset]);

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

  const title = mode === 'create' ? 'Add user' : 'Edit user';
  const submitLabel = mode === 'create' ? 'Create user' : 'Save changes';

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="md">
      <ModalHeader toggle={toggle}>{title}</ModalHeader>
      <ModalBody>
        <Form onSubmit={onFormSubmit}>
          <FormGroup>
            <Label for="firstName">First name</Label>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <Input
                  id="firstName"
                  {...field}
                  invalid={!!errors.firstName}
                  disabled={submitLoading}
                  placeholder="First name"
                />
              )}
            />
            {errors.firstName && (
              <small className="text-danger">{errors.firstName.message}</small>
            )}
          </FormGroup>
          <FormGroup>
            <Label for="lastName">Last name</Label>
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <Input
                  id="lastName"
                  {...field}
                  invalid={!!errors.lastName}
                  disabled={submitLoading}
                  placeholder="Last name"
                />
              )}
            />
            {errors.lastName && (
              <small className="text-danger">{errors.lastName.message}</small>
            )}
          </FormGroup>
          <FormGroup>
            <Label for="email">Email</Label>
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
                  placeholder="Email"
                />
              )}
            />
            {errors.email && (
              <small className="text-danger">{errors.email.message}</small>
            )}
          </FormGroup>
          <FormGroup>
            <Label for="phone">Phone</Label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input
                  id="phone"
                  {...field}
                  invalid={!!errors.phone}
                  disabled={submitLoading}
                  placeholder="Phone"
                />
              )}
            />
            {errors.phone && (
              <small className="text-danger">{errors.phone.message}</small>
            )}
          </FormGroup>
          <FormGroup>
            <Label for="roleId">Role</Label>
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
                  <option value="">Select role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Input>
              )}
            />
            {rolesLoading && (
              <small className="text-muted">Loading roles...</small>
            )}
            {!rolesLoading && roles.length === 0 && (
              <small className="text-warning">No roles available.</small>
            )}
            {errors.roleId && (
              <small className="text-danger">{errors.roleId.message}</small>
            )}
          </FormGroup>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button color="light" onClick={toggle} disabled={submitLoading}>
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={submitLoading}>
              {submitLoading ? <><Spinner size="sm" /> Submitting...</> : submitLabel}
            </Button>
          </div>
        </Form>
      </ModalBody>
    </Modal>
  );
}
