'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, Button } from 'reactstrap';
import { Plus } from 'react-feather';
import { toast } from 'react-toastify';
import { TOAST_AUTO_CLOSE_MS } from '@/CommonComponents/ToastProvider';
import { fetchUsers, createUser, updateUser, deleteUser, fetchRoles, ApiError } from '@/services/api/admin-api';
import type { AdminUser, Role } from '@/types/admin';
import type { UserTableSortKey, SortDirection } from '@/types/admin';
import type { CreateUserFormValues, UpdateUserFormValues } from './validation';
import { UsersTable, defaultFilters } from './UsersTable';
import { UserFormCard } from './UserFormCard';
import { DeleteUserModal } from './DeleteUserModal';

const getErrorMessage = (err: unknown): string => {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
};

export function UsersTab() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [rolesFromFallback, setRolesFromFallback] = useState(false);
  const [sortKey, setSortKey] = useState<UserTableSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState(defaultFilters);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setUsersError(getErrorMessage(err));
      toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      const { roles: data, fromFallback } = await fetchRoles();
      setRoles(data);
      setRolesFromFallback(fromFallback);
      setRolesError(
        fromFallback
          ? t('Using default role list. Grant role:read on your account to load roles from the server.')
          : null
      );
    } catch (err) {
      const message = getErrorMessage(err);
      setRoles([]);
      setRolesFromFallback(false);
      setRolesError(message);
      toast.error(message, { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setRolesLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (showCreateForm || showEditForm) {
      void loadRoles();
    }
  }, [showCreateForm, showEditForm, loadRoles]);

  const handleSort = useCallback((key: UserTableSortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  const handleEdit = useCallback((user: AdminUser) => {
    setSelectedUser(user);
    setShowEditForm(true);
    setShowCreateForm(false);
  }, []);

  const handleDeleteClick = useCallback((user: AdminUser) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  }, []);

  const handleCreateSubmit = useCallback(
    async (values: CreateUserFormValues) => {
      setSubmitLoading(true);
      try {
        await createUser({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          roleId: values.roleId,
        });
        toast.success(t('User created successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
        setShowCreateForm(false);
        loadUsers();
      } catch (err) {
        toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
        throw err;
      } finally {
        setSubmitLoading(false);
      }
    },
    [loadUsers, t]
  );

  const handleUpdateSubmit = useCallback(
    async (userId: string, values: UpdateUserFormValues) => {
      setSubmitLoading(true);
      try {
        await updateUser(userId, values);
        toast.success(t('User updated successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
        setShowEditForm(false);
        setSelectedUser(null);
        loadUsers();
      } catch (err) {
        toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
        throw err;
      } finally {
        setSubmitLoading(false);
      }
    },
    [loadUsers, t]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedUser?.id) return;
    setDeleteLoading(true);
    try {
      await deleteUser(selectedUser.id);
      toast.success(t('User deleted successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      setDeleteModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedUser?.id, loadUsers, t]);

  const showForm = showCreateForm || showEditForm;

  return (
    <>
      {(showCreateForm || showEditForm) && (
        <UserFormCard
          mode={showCreateForm ? 'create' : 'edit'}
          user={showEditForm ? selectedUser : undefined}
          roles={roles}
          rolesLoading={rolesLoading}
          rolesError={rolesError}
          rolesFromFallback={rolesFromFallback}
          submitLoading={submitLoading}
          onCancel={() => {
            setShowCreateForm(false);
            setShowEditForm(false);
            setSelectedUser(null);
          }}
          onSubmitCreate={handleCreateSubmit}
          onSubmitUpdate={handleUpdateSubmit}
        />
      )}

      <Card>
        <CardBody>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <h5 className="mb-0">{t('Users List')}</h5>
            {!showForm && (
              <Button
                color="primary"
                onClick={() => {
                  setShowCreateForm(true);
                  setShowEditForm(false);
                  setSelectedUser(null);
                }}
              >
                <Plus size={16} className="me-1" />
                {t('Add user')}
              </Button>
            )}
          </div>
          {usersError && (
            <div className="alert alert-danger" role="alert">
              {usersError}
              <Button color="link" size="sm" className="p-0 ms-2" onClick={loadUsers}>
                {t('Retry')}
              </Button>
            </div>
          )}
          <UsersTable
            users={users}
            loading={usersLoading}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </CardBody>
      </Card>

      <DeleteUserModal
        isOpen={deleteModalOpen}
        toggle={() => { setDeleteModalOpen(false); setSelectedUser(null); }}
        user={selectedUser}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
