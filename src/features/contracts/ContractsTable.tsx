'use client';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  Button,
  Input,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Pagination,
  PaginationItem,
  PaginationLink,
  Badge,
} from 'reactstrap';
import { AppLoader } from '@/Component/Loader';
import { ChevronDown, ChevronUp, MoreVertical, Edit2, Trash2 } from 'react-feather';
import type { Contract } from '@/types/contracts';
import type { ContractTableSortKey, SortDirection } from '@/types/contracts';
import { CONTRACT_STATUSES } from '@/types/contracts';
import { formatContractDate, getContractStatusBadgeClass } from './utils';

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;
const STATUS_ALL = '';

export interface ContractsTableFilters {
  status: string;
  activeOnly: boolean;
  global: string;
}

export const defaultFilters: ContractsTableFilters = {
  status: STATUS_ALL,
  activeOnly: false,
  global: '',
};

export interface ContractsTableProps {
  contracts: Contract[];
  loading: boolean;
  sortKey: ContractTableSortKey | null;
  sortDir: SortDirection;
  onSort: (key: ContractTableSortKey) => void;
  filters: ContractsTableFilters;
  onFiltersChange: (f: ContractsTableFilters) => void;
  onEdit?: (contract: Contract) => void;
  onDelete?: (contract: Contract) => void;
}

function filterByGlobalSearch(list: Contract[], query: string): Contract[] {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return list;
  return list.filter((c) => {
    const name = (c.contractName ?? '').toLowerCase();
    const customerId = (c.customerId ?? '').toLowerCase();
    const status = (c.status ?? '').toLowerCase();
    const desc = (c.description ?? '').toLowerCase();
    return name.includes(q) || customerId.includes(q) || status.includes(q) || desc.includes(q);
  });
}

function sortContracts(
  list: Contract[],
  key: ContractTableSortKey | null,
  dir: SortDirection
): Contract[] {
  if (!key) return list;
  return [...list].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return dir === 'asc' ? 1 : -1;
    if (bVal == null) return dir === 'asc' ? -1 : 1;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return dir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    const aStr = String(aVal);
    const bStr = String(bVal);
    const cmp = aStr.localeCompare(bStr, undefined, { sensitivity: 'base' });
    return dir === 'asc' ? cmp : -cmp;
  });
}

export function ContractsTable({
  contracts,
  loading,
  sortKey,
  sortDir,
  onSort,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
}: ContractsTableProps) {
  const { t } = useTranslation();
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(0);

  const filtered = useMemo(
    () => filterByGlobalSearch(contracts, filters.global),
    [contracts, filters.global]
  );
  const sorted = useMemo(
    () => sortContracts(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir]
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageIndex = Math.min(currentPage, totalPages - 1);
  const paginated = useMemo(() => {
    const start = pageIndex * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageIndex, pageSize]);

  const setStatus = (status: string) => {
    onFiltersChange({ ...filters, status });
    setCurrentPage(0);
  };
  const setActiveOnly = (activeOnly: boolean) => {
    onFiltersChange({ ...filters, activeOnly });
    setCurrentPage(0);
  };
  const setGlobalSearch = (global: string) => {
    onFiltersChange({ ...filters, global });
    setCurrentPage(0);
  };

  const renderSortIcon = (key: ContractTableSortKey) => {
    if (sortKey !== key) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const renderHeader = (key: ContractTableSortKey, label: string) => (
    <th className="users-management-table-header">
      <Button
        color="link"
        className="p-0 text-decoration-none fw-semibold users-management-table-header-btn"
        onClick={() => onSort(key)}
      >
        {label} {renderSortIcon(key)}
      </Button>
    </th>
  );

  return (
    <div className="contracts-table-wrapper">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <Input
          type="search"
          placeholder={t('Global search...')}
          value={filters.global}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className="contract-status-filter"
          style={{ maxWidth: '16rem', width: '100%' }}
          aria-label={t('Global search...')}
        />
        <UncontrolledDropdown className="contract-status-dropdown">
          <DropdownToggle
            color="light"
            caret
            className="form-select form-select-sm contract-status-filter d-inline-flex align-items-center"
            style={{ width: 'auto', minWidth: '10rem' }}
            aria-label={t('Contract status')}
          >
            {filters.status === STATUS_ALL ? t('All statuses') : filters.status}
          </DropdownToggle>
          <DropdownMenu container="body" strategy="fixed" className="contract-status-dropdown-menu">
            <DropdownItem
              active={filters.status === STATUS_ALL}
              onClick={() => setStatus(STATUS_ALL)}
            >
              {t('All statuses')}
            </DropdownItem>
            {CONTRACT_STATUSES.map((s) => (
              <DropdownItem
                key={s}
                active={filters.status === s}
                onClick={() => setStatus(s)}
              >
                {s}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </UncontrolledDropdown>
        <label className="contract-active-only-filter">
          <input
            type="checkbox"
            className="form-check-input"
            checked={filters.activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            aria-label={t('Active only')}
          />
          <span className="small">{t('Active only')}</span>
        </label>
        <div className="ms-auto d-flex align-items-center gap-2">
          <span className="small text-muted">{t('per page')}</span>
          <UncontrolledDropdown className="per-page-dropdown">
            <DropdownToggle color="light" caret className="contract-per-page-filter" style={{ width: 'auto' }}>
              {pageSize} {t('per page')}
            </DropdownToggle>
            <DropdownMenu className="per-page-dropdown-menu">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <DropdownItem
                  key={size}
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(0);
                  }}
                >
                  {size}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </UncontrolledDropdown>
        </div>
      </div>

      <div className="table-responsive">
        <Table hover bordered responsive className="users-management-table">
          <thead>
            <tr>
              {renderHeader('contractName', t('Contract Name'))}
              {renderHeader('customerId', t('Customer ID'))}
              {renderHeader('status', t('Status'))}
              {renderHeader('effectiveDate', t('Effective Date'))}
              {renderHeader('expiryDate', t('Expiry Date'))}
              {renderHeader('activeUserCount', t('Active Users'))}
              {renderHeader('accountCount', t('Accounts'))}
              {renderHeader('createdDate', t('Created Date'))}
              <th style={{ width: '80px' }} className="users-management-table-header">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-5">
                  <span className="d-inline-flex align-items-center gap-2">
                    <AppLoader size="md" aria-label={t('Loading')} />
                    {t('Loading contracts...')}
                  </span>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-5 text-muted">
                  {contracts.length === 0 ? t('No contracts found.') : t('No contracts match the current filters.')}
                </td>
              </tr>
            ) : (
              paginated.map((contract) => (
                <tr key={contract.id}>
                  <td>{contract.contractName ?? '—'}</td>
                  <td>{contract.customerId ?? '—'}</td>
                  <td>
                    <Badge className={getContractStatusBadgeClass(contract.status)}>
                      {contract.status}
                    </Badge>
                  </td>
                  <td>{formatContractDate(contract.effectiveDate)}</td>
                  <td>{formatContractDate(contract.expiryDate)}</td>
                  <td>{contract.activeUserCount ?? 0}</td>
                  <td>{contract.accountCount ?? 0}</td>
                  <td>{formatContractDate(contract.createdDate)}</td>
                  <td>
                    {(onEdit || onDelete) && (
                      <UncontrolledDropdown className="table-actions-dropdown">
                        <DropdownToggle color="link" className="p-0 text-body" caret={false}>
                          <MoreVertical size={18} />
                        </DropdownToggle>
                        <DropdownMenu end container="body" strategy="fixed" className="table-actions-dropdown-menu">
                          {onEdit && (
                            <DropdownItem onClick={() => onEdit(contract)}>
                              <Edit2 size={14} className="me-2" />
                              {t('Edit')}
                            </DropdownItem>
                          )}
                          {onDelete && (
                            <DropdownItem onClick={() => onDelete(contract)} className="text-danger">
                              <Trash2 size={14} className="me-2" />
                              {t('Delete')}
                            </DropdownItem>
                          )}
                        </DropdownMenu>
                      </UncontrolledDropdown>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {!loading && sorted.length > 0 && totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2">
          <small className="text-muted">
            {t('Showing {{from}}–{{to}} of {{total}}', {
              from: pageIndex * pageSize + 1,
              to: Math.min((pageIndex + 1) * pageSize, sorted.length),
              total: sorted.length,
            })}
          </small>
          <Pagination className="mb-0">
            <PaginationItem disabled={pageIndex === 0}>
              <PaginationLink first onClick={() => setCurrentPage(0)} />
            </PaginationItem>
            <PaginationItem disabled={pageIndex === 0}>
              <PaginationLink previous onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) page = i;
              else if (pageIndex < 3) page = i;
              else if (pageIndex >= totalPages - 2) page = totalPages - 5 + i;
              else page = pageIndex - 2 + i;
              return (
                <PaginationItem key={page} active={page === pageIndex}>
                  <PaginationLink onClick={() => setCurrentPage(page)}>{page + 1}</PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem disabled={pageIndex >= totalPages - 1}>
              <PaginationLink next onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} />
            </PaginationItem>
            <PaginationItem disabled={pageIndex >= totalPages - 1}>
              <PaginationLink last onClick={() => setCurrentPage(totalPages - 1)} />
            </PaginationItem>
          </Pagination>
        </div>
      )}
    </div>
  );
}
