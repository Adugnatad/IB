'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/Redux/ReduxStore';
import { Card, CardBody, Button } from 'reactstrap';
import { Plus } from 'react-feather';
import { toast } from 'react-toastify';
import { TOAST_AUTO_CLOSE_MS } from '@/CommonComponents/ToastProvider';
import {
  fetchContracts,
  createContract,
  updateContract,
  deleteContract,
  ApiError,
} from '@/services/api/contracts-api';
import { decodeJwtPayload } from '@/lib/auth/jwt';
import { tokenManager } from '@/lib/auth/token-manager';
import type { Contract } from '@/types/contracts';
import type { ContractTableSortKey, SortDirection } from '@/types/contracts';
import type { UpdateContractPayload } from '@/types/contracts';
import type { CreateContractFormValues } from './validation';
import { ContractsTable, defaultFilters } from './ContractsTable';
import { CreateContractForm } from './CreateContractForm';
import { EditContractForm } from './EditContractForm';
import { DeleteContractModal } from './DeleteContractModal';

const getErrorMessage = (err: unknown): string => {
  if (err instanceof ApiError) {
    const body = err.body as { errorMessage?: string; message?: string; errorCode?: string } | undefined;
    const details =
      body?.errorMessage ??
      (typeof body?.message === 'string' ? body.message : undefined) ??
      undefined;
    const code = body?.errorCode ?? err.code;
    const status = err.status ? ` (${err.status})` : '';
    return `${details ?? err.message}${code ? ` [${code}]` : ''}${status}`;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
};

function toCreatePayload(
  values: CreateContractFormValues & { accountNumbersToLink: string[] }
): Parameters<typeof createContract>[0] {
  return {
    customerId: values.customerId,
    contractName: values.contractName,
    description: values.description,
    effectiveDate: new Date(values.effectiveDate).toISOString(),
    expiryDate: new Date(values.expiryDate).toISOString(),
    accountNumbersToLink: values.accountNumbersToLink,
    autoActivate: values.autoActivate,
    metadata: values.metadata || undefined,
  };
}

export function ContractsTab() {
  const { t } = useTranslation();
  const authUser = useAppSelector((s) => s.auth?.user);
  const jwtSub = decodeJwtPayload(tokenManager.getAccessToken() ?? '')?.sub;
  const createdByUserId = (authUser?.id || jwtSub || '') as string;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<ContractTableSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState(defaultFilters);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [contractToEdit, setContractToEdit] = useState<Contract | null>(null);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: filters.status || undefined,
        activeOnly: filters.activeOnly,
      };
      const data = await fetchContracts(params);
      setContracts(data);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg, { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.activeOnly]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const handleSort = useCallback((key: ContractTableSortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  const handleCreateSubmit = useCallback(
    async (values: CreateContractFormValues & { accountNumbersToLink: string[] }) => {
      if (!createdByUserId) {
        toast.error(t('You must be signed in to create a contract.'), { autoClose: TOAST_AUTO_CLOSE_MS });
        return;
      }
      setSubmitLoading(true);
      try {
        const payload = toCreatePayload(values);
        await createContract(payload, createdByUserId);
        toast.success(t('Contract created successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
        setShowCreateForm(false);
        loadContracts();
      } catch (err) {
        toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
        throw err;
      } finally {
        setSubmitLoading(false);
      }
    },
    [createdByUserId, loadContracts, t]
  );

  const handleEditClick = useCallback((contract: Contract) => {
    setShowCreateForm(false);
    setContractToEdit(contract);
  }, []);

  const handleDeleteClick = useCallback((contract: Contract) => {
    setContractToDelete(contract);
  }, []);

  const handleEditSubmit = useCallback(
    async (contractId: string, payload: UpdateContractPayload) => {
      if (!createdByUserId) {
        toast.error(t('You must be signed in to update a contract.'), { autoClose: TOAST_AUTO_CLOSE_MS });
        return;
      }
      setUpdateLoading(true);
      try {
        await updateContract(contractId, payload, createdByUserId);
        toast.success(t('Contract updated successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
        setContractToEdit(null);
        loadContracts();
      } catch (err) {
        toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
        throw err;
      } finally {
        setUpdateLoading(false);
      }
    },
    [createdByUserId, loadContracts, t]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!contractToDelete?.id) return;
    if (!createdByUserId) {
      toast.error(t('You must be signed in to delete a contract.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteContract(contractToDelete.id, createdByUserId);
      toast.success(t('Contract deleted successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      setContractToDelete(null);
      loadContracts();
    } catch (err) {
      toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
      throw err;
    } finally {
      setDeleteLoading(false);
    }
  }, [contractToDelete, createdByUserId, loadContracts, t]);

  return (
    <>
      {contractToEdit && (
        <EditContractForm
          contract={contractToEdit}
          submitLoading={updateLoading}
          onCancel={() => setContractToEdit(null)}
          onSubmit={handleEditSubmit}
        />
      )}
      {showCreateForm && (
        <CreateContractForm
          createdByUserId={createdByUserId}
          submitLoading={submitLoading}
          onCancel={() => setShowCreateForm(false)}
          onSubmit={handleCreateSubmit}
        />
      )}

      <Card>
        <CardBody>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <h5 className="mb-0">{t('Contracts List')}</h5>
            {!showCreateForm && !contractToEdit && (
              <Button
                color="primary"
                onClick={() => {
                  setContractToEdit(null);
                  setShowCreateForm(true);
                }}
                disabled={!createdByUserId}
              >
                <Plus size={16} className="me-1" />
                {t('Create contract')}
              </Button>
            )}
          </div>
          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
              <span>{error}</span>
              <Button color="link" size="sm" className="p-0 ms-2" onClick={loadContracts}>
                {t('Retry')}
              </Button>
            </div>
          )}
          <DeleteContractModal
            isOpen={!!contractToDelete}
            toggle={() => setContractToDelete(null)}
            contract={contractToDelete}
            loading={deleteLoading}
            onConfirm={handleDeleteConfirm}
          />
          <ContractsTable
            contracts={contracts}
            loading={loading}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            filters={filters}
            onFiltersChange={setFilters}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </CardBody>
      </Card>
    </>
  );
}
