'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalHeader, ModalBody, Button, Spinner } from 'reactstrap';
import type { AdminUser } from '@/types/admin';
import { getFullName } from './utils';

export interface DeleteUserModalProps {
  isOpen: boolean;
  toggle: () => void;
  user: AdminUser | null;
  loading: boolean;
  onConfirm: () => Promise<void>;
}

export function DeleteUserModal({
  isOpen,
  toggle,
  user,
  loading,
  onConfirm,
}: DeleteUserModalProps) {
  const { t } = useTranslation();
  const name = user ? getFullName(user) : '';

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>{t('Delete user')}</ModalHeader>
      <ModalBody>
        <p className="mb-0">
          {t('Are you sure you want to delete {{name}}? This action cannot be undone.', { name })}
        </p>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button color="light" onClick={toggle} disabled={loading}>
            {t('Cancel')}
          </Button>
          <Button color="danger" onClick={handleConfirm} disabled={loading}>
            {loading ? <><Spinner size="sm" className="me-1" /> {t('Deleting...')}</> : t('Delete')}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
