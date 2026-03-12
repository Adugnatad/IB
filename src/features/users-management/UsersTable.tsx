'use client';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  Input,
  Button,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Pagination,
  PaginationItem,
  PaginationLink,
} from 'reactstrap';
import { AppLoader } from '@/Component/Loader';
import { ChevronDown, ChevronUp, MoreVertical, Edit2, Trash2 } from 'react-feather';
import type { AdminUser } from '@/types/admin';
import type { UserTableSortKey, SortDirection } from '@/types/admin';
import { matchesGlobalSearch } from './utils';

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;

export interface UsersTableFilters {
  global: string;
}

export const defaultFilters: UsersTableFilters = {
  global: '',
};

export interface UsersTableProps {
  users: AdminUser[];
  loading: boolean;
  sortKey: UserTableSortKey | null;
  sortDir: SortDirection;
  onSort: (key: UserTableSortKey) => void;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  filters: UsersTableFilters;
  onFiltersChange: (f: UsersTableFilters) => void;
}

function sortUsers(
  list: AdminUser[],
  key: UserTableSortKey | null,
  dir: SortDirection
): AdminUser[] {
  if (!key) return list;
  return [...list].sort((a, b) => {
    const aVal = (a[key] ?? '') as string;
    const bVal = (b[key] ?? '') as string;
    const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
    return dir === 'asc' ? cmp : -cmp;
  });
}

function filterUsers(list: AdminUser[], filters: UsersTableFilters): AdminUser[] {
  return list.filter((user) => matchesGlobalSearch(user, filters.global));
}

export function UsersTable({
  users,
  loading,
  sortKey,
  sortDir,
  onSort,
  onEdit,
  onDelete,
  filters,
  onFiltersChange,
}: UsersTableProps) {
  const { t } = useTranslation();
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(0);

  const filtered = useMemo(() => filterUsers(users, filters), [users, filters]);
  const sorted = useMemo(() => sortUsers(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageIndex = Math.min(currentPage, totalPages - 1);
  const paginated = useMemo(() => {
    const start = pageIndex * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageIndex, pageSize]);

  const updateFilter = (value: string) => {
    onFiltersChange({ ...filters, global: value });
    setCurrentPage(0);
  };

  const renderSortIcon = (key: UserTableSortKey) => {
    if (sortKey !== key) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const renderHeader = (key: UserTableSortKey, label: string) => (
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
    <div className="users-table-wrapper">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <Input
          type="search"
          placeholder={t('Global search...')}
          value={filters.global}
          onChange={(e) => updateFilter(e.target.value)}
          className="w-100"
          style={{ maxWidth: '16rem' }}
        />
        <UncontrolledDropdown className="per-page-dropdown">
          <DropdownToggle color="light" caret>
            {pageSize} {t('per page')}
          </DropdownToggle>
          <DropdownMenu className="per-page-dropdown-menu">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <DropdownItem key={size} onClick={() => { setPageSize(size); setCurrentPage(0); }}>
                {size}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </UncontrolledDropdown>
      </div>

      <div className="table-responsive">
        <Table hover bordered responsive className="users-management-table">
          <thead>
            <tr>
              {renderHeader('firstName', t('First name'))}
              {renderHeader('lastName', t('Last name'))}
              {renderHeader('employeeId', t('Employee ID'))}
              {renderHeader('department', t('Department'))}
              {renderHeader('position', t('Position'))}
              <th style={{ width: '80px' }} className="users-management-table-header">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-5">
                  <span className="d-inline-flex align-items-center gap-2">
                    <AppLoader size="md" aria-label={t('Loading')} />
                    {t('Loading users...')}
                  </span>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-muted">
                  {users.length === 0 ? t('No users found.') : t('No users match the current filters.')}
                </td>
              </tr>
            ) : (
              paginated.map((user) => (
                <tr key={user.id}>
                  <td>{user.firstName ?? '—'}</td>
                  <td>{user.lastName ?? '—'}</td>
                  <td>{user.employeeId ?? '—'}</td>
                  <td>{user.department ?? '—'}</td>
                  <td>{user.position ?? '—'}</td>
                  <td>
                    <UncontrolledDropdown className="table-actions-dropdown">
                      <DropdownToggle color="link" className="p-0 text-body" caret={false}>
                        <MoreVertical size={18} />
                      </DropdownToggle>
                      <DropdownMenu end container="body" strategy="fixed" className="table-actions-dropdown-menu">
                        <DropdownItem onClick={() => onEdit(user)}>
                          <Edit2 size={14} className="me-2" />
                          {t('Edit')}
                        </DropdownItem>
                        <DropdownItem onClick={() => onDelete(user)} className="text-danger">
                          <Trash2 size={14} className="me-2" />
                          {t('Delete')}
                        </DropdownItem>
                      </DropdownMenu>
                    </UncontrolledDropdown>
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
