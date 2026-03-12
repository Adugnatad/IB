'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap';
import { AppLoader } from '@/Component/Loader';
import type { Contract } from '@/types/contracts';

export interface DeleteContractModalProps {
  isOpen: boolean;
  toggle: () => void;
  contract: Contract | null;
  loading: boolean;
  onConfirm: () => Promise<void>;
}

export function DeleteContractModal({
  isOpen,
  toggle,
  contract,
  loading,
  onConfirm,
}: DeleteContractModalProps) {
  const { t } = useTranslation();
  const name = contract?.contractName ?? '';

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>{t('Delete contract')}</ModalHeader>
      <ModalBody>
        <p className="mb-0">
          {t('Are you sure you want to delete the contract "{{name}}"? This action cannot be undone.', {
            name,
          })}
        </p>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button color="light" onClick={toggle} disabled={loading}>
            {t('Cancel')}
          </Button>
          <Button color="danger" onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <AppLoader size="sm" className="me-1" aria-label={t('Loading')} />
                {t('Deleting...')}
              </>
            ) : (
              t('Delete')
            )}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
