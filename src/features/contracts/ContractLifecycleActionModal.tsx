'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalHeader, ModalBody, Button, FormGroup, Label, Input } from 'reactstrap';
import { AppLoader } from '@/Component/Loader';
import type { Contract } from '@/types/contracts';

export type ContractLifecycleAction = 'terminate' | 'suspend' | 'activate';

export interface ContractLifecycleActionModalProps {
  isOpen: boolean;
  action: ContractLifecycleAction;
  contract: Contract | null;
  loading: boolean;
  toggle: () => void;
  onConfirm: (reason?: string) => Promise<void>;
}

const actionLabelMap: Record<ContractLifecycleAction, string> = {
  terminate: 'Terminate',
  suspend: 'Suspend',
  activate: 'Activate',
};

const actionColorMap: Record<ContractLifecycleAction, 'danger' | 'warning' | 'success'> = {
  terminate: 'danger',
  suspend: 'warning',
  activate: 'success',
};

export function ContractLifecycleActionModal({
  isOpen,
  action,
  contract,
  loading,
  toggle,
  onConfirm,
}: ContractLifecycleActionModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const requiresReason = action === 'terminate' || action === 'suspend';
  const label = actionLabelMap[action];

  const handleConfirm = async () => {
    if (requiresReason && !reason.trim()) return;
    await onConfirm(reason.trim() || undefined);
    setReason('');
  };

  const handleClose = () => {
    if (loading) return;
    setReason('');
    toggle();
  };

  return (
    <Modal isOpen={isOpen} toggle={handleClose}>
      <ModalHeader toggle={handleClose}>{t('{{action}} contract', { action: t(label) })}</ModalHeader>
      <ModalBody>
        <p>
          {t('Contract')}: <strong>{contract?.contractName ?? '—'}</strong>
        </p>

        {requiresReason ? (
          <FormGroup>
            <Label for="contract-action-reason">{t('Reason')}</Label>
            <Input
              id="contract-action-reason"
              type="textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder={t('Enter reason')}
            />
            {!reason.trim() && (
              <small className="text-muted">{t('Reason is required for this action.')}</small>
            )}
          </FormGroup>
        ) : (
          <p className="mb-0">{t('Are you sure you want to activate this contract?')}</p>
        )}

        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button color="light" onClick={handleClose} disabled={loading}>
            {t('Cancel')}
          </Button>
          <Button
            color={actionColorMap[action]}
            onClick={handleConfirm}
            disabled={loading || (requiresReason && !reason.trim())}
          >
            {loading ? (
              <>
                <AppLoader size="sm" className="me-1" aria-label={t('Loading')} />
                {t('Submitting...')}
              </>
            ) : (
              t(label)
            )}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
