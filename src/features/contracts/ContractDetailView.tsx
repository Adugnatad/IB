'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/Redux/ReduxStore';
import {
  Button,
  Card,
  CardBody,
  Col,
  Row,
  Badge,
  Form,
  FormGroup,
  Input,
  Label,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalHeader,
  ModalBody,
} from 'reactstrap';
import { toast } from 'react-toastify';
import { TOAST_AUTO_CLOSE_MS } from '@/CommonComponents/ToastProvider';
import { AppLoader } from '@/Component/Loader';
import {
  fetchContractById,
  updateContract,
  deleteContract,
  addContractUser,
  updateContractUser,
  fetchSignatoryGroups,
  createSignatoryGroup,
  updateSignatoryGroup,
  deactivateSignatoryGroup,
  fetchSignatoryGroupMembers,
  addSignatoryGroupMember,
  removeSignatoryGroupMember,
  reorderSignatoryGroupMembers,
  updateSignatoryGroupMemberApprovalOrder,
  suspendContract,
  terminateContract,
  activateContract,
  ApiError,
} from '@/services/api/contracts-api';
import { decodeJwtPayload } from '@/lib/auth/jwt';
import { tokenManager } from '@/lib/auth/token-manager';
import type {
  AddContractUserPayload,
  Contract,
  ContractUserPermissionType,
  CreateSignatoryGroupPayload,
  SignatoryGroupMember,
  SignatoryGroup,
  UpdateContractPayload,
} from '@/types/contracts';
import { formatContractDate, getContractStatusBadgeClass } from './utils';
import { EditContractForm } from './EditContractForm';
import { AddContractUserForm } from './AddContractUserForm';
import { EditContractUserModal, type RawContractUserRow } from './EditContractUserModal';
import { ContractUserDetailsModal } from './ContractUserDetailsModal';
import { ApprovalRulesTab } from './ApprovalRulesTab';
import {
  Info,
  Edit2,
  Eye,
  UserPlus,
  PauseCircle,
  PlayCircle,
  Slash,
  Trash2,
  Layers,
  PlusCircle,
  XCircle,
  Move,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Settings,
  Edit3,
  MinusCircle,
  Shield,
} from 'react-feather';

function resolveCurrentUserId(authUserId: unknown, jwtPayload: Record<string, unknown> | null): string {
  const candidates: unknown[] = [authUserId, jwtPayload?.userId, jwtPayload?.user_id, jwtPayload?.uid, jwtPayload?.sub];
  const match = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0);
  return typeof match === 'string' ? match.trim() : '';
}

function shortContractId(id: string | undefined): string {
  if (!id) return '';
  const trimmed = id.trim();
  return trimmed.length > 12 ? trimmed.slice(-12) : trimmed;
}

const getErrorMessage = (err: unknown): string => {
  if (err instanceof ApiError) {
    const body = err.body as { errorMessage?: string; message?: string; errorCode?: string } | undefined;
    const details = body?.errorMessage ?? (typeof body?.message === 'string' ? body.message : undefined) ?? undefined;
    const code = body?.errorCode ?? err.code;
    const status = err.status ? ` (${err.status})` : '';
    return `${details ?? err.message}${code ? ` [${code}]` : ''}${status}`;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
};

export interface ContractDetailViewProps {
  contractId: string;
}

type OperationTab =
  | 'overview'
  | 'edit'
  | 'addUser'
  | 'signatoryGroups'
  | 'approvalRules'
  | 'suspend'
  | 'activate'
  | 'terminate'
  | 'delete';

export function ContractDetailView({ contractId }: ContractDetailViewProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const authUser = useAppSelector((s) => s.auth?.user);
  const jwtPayload = decodeJwtPayload(tokenManager.getAccessToken() ?? '');
  const currentUserId = resolveCurrentUserId(authUser?.id, (jwtPayload as Record<string, unknown> | null) ?? null);
  const currentRoleId = typeof authUser?.roleId === 'string' ? authUser.roleId.trim() : '';

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<OperationTab>('overview');
  const [suspendReason, setSuspendReason] = useState('');
  const [terminateReason, setTerminateReason] = useState('');
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('');

  const [updateLoading, setUpdateLoading] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [editContractUserLoading, setEditContractUserLoading] = useState(false);
  const [editingContractUser, setEditingContractUser] = useState<RawContractUserRow | null>(null);
  const [detailContractUser, setDetailContractUser] = useState<Record<string, unknown> | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [terminateLoading, setTerminateLoading] = useState(false);
  const [activateLoading, setActivateLoading] = useState(false);
  const [signatoryGroups, setSignatoryGroups] = useState<SignatoryGroup[]>([]);
  const [signatoryGroupsLoading, setSignatoryGroupsLoading] = useState(false);
  const [createGroupLoading, setCreateGroupLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [draggingMemberId, setDraggingMemberId] = useState<string | null>(null);
  const [showCreateSignatoryGroupForm, setShowCreateSignatoryGroupForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [editGroupLoading, setEditGroupLoading] = useState(false);
  const [deactivateGroupId, setDeactivateGroupId] = useState<string | null>(null);
  const [deactivateGroupLoading, setDeactivateGroupLoading] = useState(false);
  const [deactivateGroupConfirmationName, setDeactivateGroupConfirmationName] = useState('');
  const [manageGroupId, setManageGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<SignatoryGroupMember[]>([]);
  const [groupMembersLoading, setGroupMembersLoading] = useState(false);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [removeMemberLoadingId, setRemoveMemberLoadingId] = useState<string | null>(null);
  const [reorderMembersLoading, setReorderMembersLoading] = useState(false);
  const [memberOrderDrafts, setMemberOrderDrafts] = useState<Record<string, string>>({});
  const [updateOrderLoadingId, setUpdateOrderLoadingId] = useState<string | null>(null);
  const [draggingManagedMemberId, setDraggingManagedMemberId] = useState<string | null>(null);

  const loadContract = useCallback(async () => {
    if (!contractId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchContractById(contractId);
      setContract(data);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg, { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  const users = useMemo(() => (Array.isArray(contract?.users) ? contract?.users : []), [contract?.users]);

  const isActive = contract?.status === 'ACTIVE';
  const isPending = contract?.status === 'PENDING';
  const isSuspended = contract?.status === 'SUSPENDED';
  const isTerminated = contract?.status === 'TERMINATED';

  useEffect(() => {
    // Keep the UI from staying on a tab that is no longer valid for the updated status.
    if (!contract) return;
    if (activeTab === 'addUser' && !isActive) setActiveTab('overview');
    if (activeTab === 'signatoryGroups' && !isActive) setActiveTab('overview');
    if (activeTab === 'approvalRules' && !isActive) setActiveTab('overview');
    if (activeTab === 'suspend' && !isActive) setActiveTab('overview');
    if (activeTab === 'terminate' && !isActive) setActiveTab('overview');
    if (activeTab === 'activate' && !isPending) setActiveTab('overview');
  }, [activeTab, contract, isActive, isPending]);

  const contractUsers = useMemo(() => {
    return users.map((u) => {
      const row = u as {
        id?: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        signatoryMetrics?: Array<{ permissionType?: string; active?: boolean }>;
      };
      const fullName = [row.firstName, row.lastName].filter(Boolean).join(' ').trim() || row.username || 'Unknown user';
      const metrics = Array.isArray(row.signatoryMetrics) ? row.signatoryMetrics : [];
      const hasApprovalPermission = metrics.some(
        (metric) =>
          metric.active !== false && String(metric.permissionType ?? '').toUpperCase() === 'APPROVE'
      );
      return {
        id: row.id ?? '',
        fullName,
        email: row.email ?? '',
        hasApprovalPermission,
      };
    }).filter((u) => u.id);
  }, [users]);

  const contractUsersWithApprovalRole = useMemo(
    () => contractUsers.filter((u) => u.hasApprovalPermission),
    [contractUsers]
  );

  const loadSignatoryGroups = useCallback(async () => {
    if (!contract?.id) return;
    setSignatoryGroupsLoading(true);
    try {
      const data = await fetchSignatoryGroups(contract.id);
      setSignatoryGroups(data);
    } catch (err) {
      toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setSignatoryGroupsLoading(false);
    }
  }, [contract?.id]);

  useEffect(() => {
    if (activeTab !== 'signatoryGroups' || !isActive) return;
    loadSignatoryGroups();
  }, [activeTab, isActive, loadSignatoryGroups]);

  const loadManageGroupMembers = useCallback(async (groupId: string) => {
    if (!contract?.id) return;
    setGroupMembersLoading(true);
    try {
      const data = await fetchSignatoryGroupMembers(contract.id, groupId);
      setGroupMembers(data);
      const drafts: Record<string, string> = {};
      data.forEach((member, index) => {
        drafts[member.id] = String(member.approvalOrder ?? index + 1);
      });
      setMemberOrderDrafts(drafts);
    } catch (err) {
      toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setGroupMembersLoading(false);
    }
  }, [contract?.id]);

  const manageGroup = useMemo(
    () => signatoryGroups.find((group) => group.id === manageGroupId) ?? null,
    [manageGroupId, signatoryGroups]
  );

  const availableUsersForManageGroup = useMemo(() => {
    const memberUserIds = new Set(groupMembers.map((m) => m.contractUserId));
    return contractUsers.filter(
      (user) => !memberUserIds.has(user.id) && user.hasApprovalPermission
    );
  }, [contractUsers, groupMembers]);

  const requireAuth = (): boolean => {
    if (currentUserId) return true;
    toast.error(t('You must be signed in to perform this action.'), { autoClose: TOAST_AUTO_CLOSE_MS });
    return false;
  };

  const handleEditSubmit = useCallback(
    async (id: string, payload: UpdateContractPayload) => {
      if (!requireAuth()) return;
      setUpdateLoading(true);
      try {
        const updated = await updateContract(id, payload, currentUserId);
        setContract(updated);
        setActiveTab('overview');
        toast.success(t('Contract updated successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      } catch (err) {
        toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
        throw err;
      } finally {
        setUpdateLoading(false);
      }
    },
    [currentUserId, t]
  );

  const handleAddUserSubmit = useCallback(
    async (
      id: string,
      roleId: string,
      permissionType: ContractUserPermissionType,
      payload: Parameters<typeof addContractUser>[3]
    ) => {
      if (!requireAuth()) return;
      if (!roleId.trim()) {
        toast.error(t('Role ID is required.'), { autoClose: TOAST_AUTO_CLOSE_MS });
        return;
      }
      setAddUserLoading(true);
      try {
        await addContractUser(id, roleId, permissionType, payload, currentUserId);
        setActiveTab('overview');
        toast.success(t('Contract user added successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
        await loadContract();
      } catch (err) {
        toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
        throw err;
      } finally {
        setAddUserLoading(false);
      }
    },
    [currentUserId, loadContract, t]
  );

  const handleCloseEditContractUser = useCallback(() => setEditingContractUser(null), []);
  const handleCloseContractUserDetails = useCallback(() => setDetailContractUser(null), []);

  const handleEditContractUserSubmit = useCallback(
    async (
      contractUserId: string,
      roleId: string,
      permissionType: ContractUserPermissionType,
      payload: AddContractUserPayload
    ) => {
      if (!requireAuth()) return;
      if (!contract?.id) return;
      if (!roleId.trim()) {
        toast.error(t('Role ID is required.'), { autoClose: TOAST_AUTO_CLOSE_MS });
        return;
      }
      setEditContractUserLoading(true);
      try {
        await updateContractUser(contract.id, contractUserId, roleId, permissionType, payload, currentUserId);
        setEditingContractUser(null);
        toast.success(t('Contract user updated successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
        await loadContract();
      } catch (err) {
        toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
        throw err;
      } finally {
        setEditContractUserLoading(false);
      }
    },
    [contract?.id, currentUserId, loadContract, t]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!contract?.id) return;
    if (!requireAuth()) return;
    if (deleteConfirmationName.trim() !== (contract.contractName ?? '').trim()) {
      toast.error(t('Please type the exact contract name to confirm deletion.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteContract(contract.id, currentUserId);
      toast.success(t('Contract deleted successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      router.push('/contracts');
    } catch (err) {
      toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
      throw err;
    } finally {
      setDeleteLoading(false);
    }
  }, [contract?.contractName, contract?.id, currentUserId, deleteConfirmationName, router, t]);

  const handleSuspend = useCallback(async () => {
    if (!contract?.id) return;
    if (!requireAuth()) return;
    if (!suspendReason.trim()) {
      toast.error(t('Reason is required.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      return;
    }
    setSuspendLoading(true);
    try {
      const updated = await suspendContract(contract.id, suspendReason.trim(), currentUserId);
      setContract(updated);
      setActiveTab('overview');
      toast.success(t('Contract suspended successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
    } catch (err) {
      toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
      throw err;
    } finally {
      setSuspendLoading(false);
    }
  }, [contract?.id, currentUserId, suspendReason, t]);

  const handleTerminate = useCallback(async () => {
    if (!contract?.id) return;
    if (!requireAuth()) return;
    if (!terminateReason.trim()) {
      toast.error(t('Reason is required.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      return;
    }
    setTerminateLoading(true);
    try {
      const updated = await terminateContract(contract.id, terminateReason.trim(), currentUserId);
      setContract(updated);
      setActiveTab('overview');
      toast.success(t('Contract terminated successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
    } catch (err) {
      toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
      throw err;
    } finally {
      setTerminateLoading(false);
    }
  }, [contract?.id, currentUserId, terminateReason, t]);

  const handleActivate = useCallback(async () => {
    if (!contract?.id) return;
    if (!requireAuth()) return;
    setActivateLoading(true);
    try {
      const updated = await activateContract(contract.id, currentUserId);
      setContract(updated);
      setActiveTab('overview');
      toast.success(t('Contract activated successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
    } catch (err) {
      toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
      throw err;
    } finally {
      setActivateLoading(false);
    }
  }, [contract?.id, currentUserId, t]);

  const addGroupMember = useCallback((memberId: string) => {
    setSelectedMemberIds((prev) => (prev.includes(memberId) ? prev : [...prev, memberId]));
  }, []);

  const removeGroupMember = useCallback((memberId: string) => {
    setSelectedMemberIds((prev) => prev.filter((id) => id !== memberId));
  }, []);

  const handleMemberDragStart = useCallback((memberId: string) => {
    setDraggingMemberId(memberId);
  }, []);

  const handleMemberDropOn = useCallback((targetMemberId: string) => {
    if (!draggingMemberId || draggingMemberId === targetMemberId) return;
    setSelectedMemberIds((prev) => {
      const fromIndex = prev.indexOf(draggingMemberId);
      const toIndex = prev.indexOf(targetMemberId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const next = [...prev];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, draggingMemberId);
      return next;
    });
    setDraggingMemberId(null);
  }, [draggingMemberId]);

  const selectedMembers = useMemo(() => {
    const map = new Map(contractUsers.map((member) => [member.id, member]));
    return selectedMemberIds
      .map((id) => map.get(id))
      .filter((member): member is { id: string; fullName: string; email: string; hasApprovalPermission: boolean } => Boolean(member));
  }, [contractUsers, selectedMemberIds]);

  const availableMembers = useMemo(
    () =>
      contractUsersWithApprovalRole.filter((member) => !selectedMemberIds.includes(member.id)),
    [contractUsersWithApprovalRole, selectedMemberIds]
  );

  const handleCreateSignatoryGroup = useCallback(async () => {
    if (!contract?.id) return;
    if (!requireAuth()) return;
    if (!groupName.trim()) {
      toast.error(t('Group name is required.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      return;
    }
    if (selectedMemberIds.length === 0) {
      toast.error(t('Select at least one member.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      return;
    }
    const payload: CreateSignatoryGroupPayload = {
      name: groupName.trim(),
      description: groupDescription.trim(),
      members: selectedMemberIds.map((contractUserId) => ({ contractUserId })),
    };
    setCreateGroupLoading(true);
    try {
      await createSignatoryGroup(contract.id, payload, currentUserId);
      toast.success(t('Signatory group created successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      setGroupName('');
      setGroupDescription('');
      setSelectedMemberIds([]);
      setShowCreateSignatoryGroupForm(false);
      await loadSignatoryGroups();
    } catch (err) {
      toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setCreateGroupLoading(false);
    }
  }, [
    contract?.id,
    currentUserId,
    groupDescription,
    groupName,
    loadSignatoryGroups,
    selectedMemberIds,
    t,
  ]);

  const handleStartManageGroup = useCallback(async (group: SignatoryGroup) => {
    setManageGroupId(group.id);
    await loadManageGroupMembers(group.id);
  }, [loadManageGroupMembers]);

  const handleCloseManageGroup = useCallback(() => {
    setManageGroupId(null);
    setGroupMembers([]);
    setMemberOrderDrafts({});
  }, []);

  const handleAddGroupMember = useCallback(async (contractUserId: string) => {
    if (!contract?.id || !manageGroupId) return;
    if (!requireAuth()) return;
    if (!contractUserId.trim()) {
      toast.error(t('Please select a contract user.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      return;
    }
    setAddMemberLoading(true);
    try {
      await addSignatoryGroupMember(
        contract.id,
        manageGroupId,
        {
          contractUserId: contractUserId.trim(),
          approvalOrder: groupMembers.length,
        },
        currentUserId
      );
      toast.success(t('Member added successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      await loadManageGroupMembers(manageGroupId);
      await loadSignatoryGroups();
    } catch (err) {
      toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setAddMemberLoading(false);
    }
  }, [
    contract?.id,
    currentUserId,
    groupMembers.length,
    loadManageGroupMembers,
    loadSignatoryGroups,
    manageGroupId,
    t,
  ]);

  const handleManagedMemberDragStart = useCallback((memberId: string) => {
    setDraggingManagedMemberId(memberId);
  }, []);

  const handleManagedMemberDropOn = useCallback((targetMemberId: string) => {
    if (!draggingManagedMemberId || draggingManagedMemberId === targetMemberId) return;
    setGroupMembers((prev) => {
      const fromIndex = prev.findIndex((m) => m.id === draggingManagedMemberId);
      const toIndex = prev.findIndex((m) => m.id === targetMemberId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setDraggingManagedMemberId(null);
  }, [draggingManagedMemberId]);

  const handleRemoveGroupMember = useCallback(async (memberId: string) => {
    if (!contract?.id || !manageGroupId) return;
    if (!requireAuth()) return;
    setRemoveMemberLoadingId(memberId);
    try {
      await removeSignatoryGroupMember(contract.id, manageGroupId, memberId, currentUserId);
      toast.success(t('Member removed successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      await loadManageGroupMembers(manageGroupId);
      await loadSignatoryGroups();
    } catch (err) {
      toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setRemoveMemberLoadingId(null);
    }
  }, [contract?.id, currentUserId, loadManageGroupMembers, loadSignatoryGroups, manageGroupId, t]);

  const moveManagedMember = useCallback((index: number, direction: 'up' | 'down') => {
    setGroupMembers((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  }, []);

  const handleReorderAllManagedMembers = useCallback(async () => {
    if (!contract?.id || !manageGroupId) return;
    if (!requireAuth()) return;
    setReorderMembersLoading(true);
    try {
      await reorderSignatoryGroupMembers(
        contract.id,
        manageGroupId,
        {
          memberOrders: groupMembers.map((member, index) => ({
            memberId: member.id,
            approvalOrder: index + 1,
          })),
        },
        currentUserId
      );
      toast.success(t('Member order updated successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      await loadManageGroupMembers(manageGroupId);
    } catch (err) {
      toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setReorderMembersLoading(false);
    }
  }, [contract?.id, currentUserId, groupMembers, loadManageGroupMembers, manageGroupId, t]);

  const handleUpdateSingleMemberOrder = useCallback(async (memberId: string) => {
    if (!contract?.id || !manageGroupId) return;
    if (!requireAuth()) return;
    const draft = memberOrderDrafts[memberId] ?? '';
    const parsed = Number.parseInt(draft, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error(t('Approval order must be a valid number.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      return;
    }
    setUpdateOrderLoadingId(memberId);
    try {
      await updateSignatoryGroupMemberApprovalOrder(
        contract.id,
        manageGroupId,
        memberId,
        parsed,
        currentUserId
      );
      toast.success(t('Approval order updated.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      await loadManageGroupMembers(manageGroupId);
    } catch (err) {
      toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setUpdateOrderLoadingId(null);
    }
  }, [
    contract?.id,
    currentUserId,
    loadManageGroupMembers,
    manageGroupId,
    memberOrderDrafts,
    t,
  ]);

  const handleStartEditGroup = useCallback((group: SignatoryGroup) => {
    setEditingGroupId(group.id);
    setEditGroupName(group.name ?? '');
    setEditGroupDescription(group.description ?? '');
  }, []);

  const handleCancelEditGroup = useCallback(() => {
    setEditingGroupId(null);
    setEditGroupName('');
    setEditGroupDescription('');
  }, []);

  const handleSaveEditGroup = useCallback(async () => {
    if (!contract?.id || !editingGroupId) return;
    if (!requireAuth()) return;
    if (!editGroupName.trim()) {
      toast.error(t('Group name is required.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      return;
    }
    setEditGroupLoading(true);
    try {
      await updateSignatoryGroup(
        contract.id,
        editingGroupId,
        {
          name: editGroupName.trim(),
          description: editGroupDescription.trim(),
        },
        currentUserId
      );
      toast.success(t('Signatory group updated successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      handleCancelEditGroup();
      await loadSignatoryGroups();
    } catch (err) {
      toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setEditGroupLoading(false);
    }
  }, [
    contract?.id,
    currentUserId,
    editGroupDescription,
    editGroupName,
    editingGroupId,
    handleCancelEditGroup,
    loadSignatoryGroups,
    t,
  ]);

  const handleRequestDeactivateGroup = useCallback((group: SignatoryGroup) => {
    setDeactivateGroupId(group.id);
    setDeactivateGroupConfirmationName('');
  }, []);

  const handleCancelDeactivateGroup = useCallback(() => {
    setDeactivateGroupId(null);
    setDeactivateGroupConfirmationName('');
  }, []);

  const handleConfirmDeactivateGroup = useCallback(async () => {
    if (!contract?.id || !deactivateGroupId) return;
    if (!requireAuth()) return;
    const targetGroup = signatoryGroups.find((group) => group.id === deactivateGroupId);
    const targetName = (targetGroup?.name ?? '').trim();
    if (deactivateGroupConfirmationName.trim() !== targetName) {
      toast.error(t('Please type the exact signatory group name to confirm deactivation.'), {
        autoClose: TOAST_AUTO_CLOSE_MS,
      });
      return;
    }
    setDeactivateGroupLoading(true);
    try {
      await deactivateSignatoryGroup(contract.id, deactivateGroupId, currentUserId);
      toast.success(t('Signatory group deactivated successfully.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      if (editingGroupId === deactivateGroupId) {
        handleCancelEditGroup();
      }
      setDeactivateGroupId(null);
      setDeactivateGroupConfirmationName('');
      await loadSignatoryGroups();
    } catch (err) {
      toast.error(getErrorMessage(err), { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setDeactivateGroupLoading(false);
    }
  }, [
    contract?.id,
    currentUserId,
    deactivateGroupId,
    editingGroupId,
    deactivateGroupConfirmationName,
    handleCancelEditGroup,
    loadSignatoryGroups,
    signatoryGroups,
    t,
  ]);

  if (loading) {
    return (
      <div className="py-5 text-center">
        <AppLoader size="md" aria-label={t('Loading')} />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="alert alert-danger d-flex align-items-center justify-content-between">
        <span>{error || t('Contract not found.')}</span>
        <Button color="link" size="sm" onClick={loadContract}>
          {t('Retry')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardBody>
          <div className="contracts-detail-header d-flex flex-wrap justify-content-between align-items-start gap-2 mb-4">
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <Badge className={getContractStatusBadgeClass(contract.status)}>{contract.status}</Badge>
                <small className="text-muted">{t('Contract ID')}: {shortContractId(contract.id)}</small>
              </div>
              <h3 className="contracts-detail-title mt-2 mb-0">{contract.contractName}</h3>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <Button color="light" onClick={() => router.push('/contracts')}>
                {t('Back')}
              </Button>
            </div>
          </div>

          <Row className="g-4 contracts-detail-layout">
            <Col md={3} className="contracts-detail-sidebar-col">
              <div className="contracts-detail-sidebar" role="navigation" aria-label={t('Contract actions')}>
                <button
                  type="button"
                  className={`contracts-detail-tab ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <Info size={18} />
                  <span>{t('Overview')}</span>
                </button>

                <button
                  type="button"
                  className={`contracts-detail-tab ${activeTab === 'edit' ? 'active' : ''}`}
                  onClick={() => setActiveTab('edit')}
                >
                  <Edit2 size={18} />
                  <span>{t('Edit contract')}</span>
                </button>

                {isActive && (
                  <button
                    type="button"
                    className={`contracts-detail-tab ${activeTab === 'addUser' ? 'active' : ''}`}
                    onClick={() => setActiveTab('addUser')}
                  >
                    <UserPlus size={18} />
                    <span>{t('Add user')}</span>
                  </button>
                )}

                {isActive && (
                  <button
                    type="button"
                    className={`contracts-detail-tab ${activeTab === 'signatoryGroups' ? 'active' : ''}`}
                    onClick={() => setActiveTab('signatoryGroups')}
                  >
                    <Layers size={18} />
                    <span>{t('Signatory groups')}</span>
                  </button>
                )}

                {isActive && (
                  <button
                    type="button"
                    className={`contracts-detail-tab ${activeTab === 'approvalRules' ? 'active' : ''}`}
                    onClick={() => setActiveTab('approvalRules')}
                  >
                    <Shield size={18} />
                    <span>{t('Approval rules')}</span>
                  </button>
                )}

                {isActive && !isSuspended && (
                  <button
                    type="button"
                    className={`contracts-detail-tab ${activeTab === 'suspend' ? 'active' : ''}`}
                    onClick={() => setActiveTab('suspend')}
                  >
                    <PauseCircle size={18} />
                    <span>{t('Suspend')}</span>
                  </button>
                )}

                {isPending && (
                  <button
                    type="button"
                    className={`contracts-detail-tab ${activeTab === 'activate' ? 'active' : ''}`}
                    onClick={() => setActiveTab('activate')}
                  >
                    <PlayCircle size={18} />
                    <span>{t('Activate')}</span>
                  </button>
                )}

                {isActive && !isTerminated && (
                  <button
                    type="button"
                    className={`contracts-detail-tab ${activeTab === 'terminate' ? 'active' : ''}`}
                    onClick={() => setActiveTab('terminate')}
                  >
                    <Slash size={18} />
                    <span>{t('Terminate')}</span>
                  </button>
                )}

                <button
                  type="button"
                  className={`contracts-detail-tab contracts-detail-tab--danger ${activeTab === 'delete' ? 'active' : ''}`}
                  onClick={() => setActiveTab('delete')}
                >
                  <Trash2 size={18} />
                  <span>{t('Delete')}</span>
                </button>
              </div>
            </Col>

            <Col md={9} className="contracts-detail-content">
              {activeTab === 'overview' && (
                <div className="contracts-overview">
                  <Row className="g-3 mb-3">
                    <Col xl={3} md={6}>
                      <div className="contracts-overview-metric">
                        <span>{t('Active Users')}</span>
                        <strong>{contract.activeUserCount ?? 0}</strong>
                      </div>
                    </Col>
                    <Col xl={3} md={6}>
                      <div className="contracts-overview-metric">
                        <span>{t('Accounts')}</span>
                        <strong>{contract.accountCount ?? 0}</strong>
                      </div>
                    </Col>
                    <Col xl={3} md={6}>
                      <div className="contracts-overview-metric">
                        <span>{t('Operational')}</span>
                        <strong>{contract.operational ? t('Yes') : t('No')}</strong>
                      </div>
                    </Col>
                    <Col xl={3} md={6}>
                      <div className="contracts-overview-metric">
                        <span>{t('Deleted')}</span>
                        <strong>{contract.deleted ? t('Yes') : t('No')}</strong>
                      </div>
                    </Col>
                  </Row>

                  <Card className="contracts-overview-card mb-3">
                    <CardBody>
                      <h6 className="contracts-overview-card-title">{t('Contract Information')}</h6>
                      <div className="contracts-overview-grid">
                        <div>
                          <label>{t('Customer ID')}</label>
                          <p>{contract.customerId || '—'}</p>
                        </div>
                        <div>
                          <label>{t('Effective Date')}</label>
                          <p>{formatContractDate(contract.effectiveDate)}</p>
                        </div>
                        <div>
                          <label>{t('Expiry Date')}</label>
                          <p>{formatContractDate(contract.expiryDate)}</p>
                        </div>
                        <div>
                          <label>{t('Created Date')}</label>
                          <p>{formatContractDate(contract.createdDate)}</p>
                        </div>
                        <div>
                          <label>{t('Last Modified')}</label>
                          <p>{formatContractDate(contract.lastModifiedDate)}</p>
                        </div>
                        <div>
                          <label>{t('Metadata')}</label>
                          <p>{contract.metadata || '—'}</p>
                        </div>
                      </div>
                      <div className="contracts-overview-description">
                        <label>{t('Description')}</label>
                        <p>{contract.description || '—'}</p>
                      </div>
                    </CardBody>
                  </Card>

                  <Card className="contracts-overview-card">
                    <CardBody>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6 className="contracts-overview-card-title mb-0">{t('Contract Users')}</h6>
                        <small className="text-muted">
                          {t('{{count}} linked users', { count: users.length })}
                        </small>
                      </div>

                      {users.length === 0 ? (
                        <div className="contracts-overview-empty">{t('No users linked to this contract.')}</div>
                      ) : (
                        <div className="table-responsive contracts-overview-table-wrap">
                          <table className="table table-sm align-middle mb-0 contracts-overview-table">
                            <thead>
                              <tr>
                                <th>{t('Username')}</th>
                                <th>{t('Email')}</th>
                                <th>{t('Role')}</th>
                                <th className="text-end" style={{ width: '1%' }}>
                                  {t('Actions')}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((u) => {
                                const row = u as RawContractUserRow;
                                return (
                                  <tr key={row.id || `${row.username}-${row.email}`}>
                                    <td>{row.username || '—'}</td>
                                    <td>{row.email || '—'}</td>
                                    <td>{row.roleName || '—'}</td>
                                    <td className="text-end align-middle">
                                      <UncontrolledDropdown className="table-actions-dropdown d-inline-flex">
                                        <DropdownToggle
                                          color="link"
                                          className="p-0 text-body contracts-contract-user-more"
                                          caret={false}
                                          aria-haspopup={true}
                                          aria-label={String(t('Open actions menu'))}
                                        >
                                          <MoreVertical size={16} aria-hidden />
                                        </DropdownToggle>
                                        <DropdownMenu
                                          end
                                          container="body"
                                          strategy="fixed"
                                          className="table-actions-dropdown-menu"
                                        >
                                          <DropdownItem
                                            disabled={!row.id}
                                            onClick={() => {
                                              setDetailContractUser({
                                                ...(row as unknown as Record<string, unknown>),
                                              });
                                            }}
                                          >
                                            <Eye size={14} className="me-2" aria-hidden />
                                            {t('Details')}
                                          </DropdownItem>
                                          <DropdownItem
                                            disabled={!isActive || !row.id || editContractUserLoading}
                                            onClick={() => setEditingContractUser(row as RawContractUserRow)}
                                          >
                                            <Edit3 size={14} className="me-2" aria-hidden />
                                            {t('Edit')}
                                          </DropdownItem>
                                        </DropdownMenu>
                                      </UncontrolledDropdown>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              )}

              {activeTab === 'edit' && (
                <EditContractForm
                  contract={contract}
                  submitLoading={updateLoading}
                  onCancel={() => setActiveTab('overview')}
                  onSubmit={handleEditSubmit}
                />
              )}

              {activeTab === 'addUser' && isActive && (
                <AddContractUserForm
                  contract={contract}
                  defaultRoleId={currentRoleId}
                  submitLoading={addUserLoading}
                  onCancel={() => setActiveTab('overview')}
                  onSubmit={handleAddUserSubmit}
                />
              )}

              {activeTab === 'signatoryGroups' && isActive && (
                <div className="contracts-signatory-groups">
                  <Card className="contracts-signatory-summary mb-3">
                    <CardBody>
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                        <div>
                          <h5 className="mb-1">{t('Signatory Group Management')}</h5>
                          <p className="mb-0 text-muted">
                            {t('Configure signatory groups, members, and approval rules for "{{name}}".', {
                              name: contract.contractName,
                            })}
                          </p>
                        </div>
                        <Badge color="light" pill>
                          {t('{{count}} active', {
                            count: signatoryGroups.filter((g) => g.active).length,
                          })}
                        </Badge>
                      </div>
                      <Row className="g-3">
                        <Col md={3} sm={6}>
                          <div className="contracts-signatory-stat">
                            <span>{t('Total Groups')}</span>
                            <strong>{signatoryGroups.length}</strong>
                          </div>
                        </Col>
                        <Col md={3} sm={6}>
                          <div className="contracts-signatory-stat">
                            <span>{t('Active')}</span>
                            <strong>{signatoryGroups.filter((group) => group.active).length}</strong>
                          </div>
                        </Col>
                        <Col md={3} sm={6}>
                          <div className="contracts-signatory-stat">
                            <span>{t('Members')}</span>
                            <strong>
                              {signatoryGroups.reduce((sum, group) => sum + (group.members?.length ?? 0), 0)}
                            </strong>
                          </div>
                        </Col>
                        <Col md={3} sm={6}>
                          <div className="contracts-signatory-stat">
                            <span>{t('Needs Rules')}</span>
                            <strong>
                              {signatoryGroups.filter((group) => (group.approvalRules?.length ?? 0) === 0).length}
                            </strong>
                          </div>
                        </Col>
                      </Row>
                    </CardBody>
                  </Card>

                  {!showCreateSignatoryGroupForm ? (
                    <div className="d-flex justify-content-end mb-3">
                      <Button
                        color="primary"
                        onClick={() => setShowCreateSignatoryGroupForm(true)}
                      >
                        {t('Create new signatory group')}
                      </Button>
                    </div>
                  ) : (
                    <Card className="contracts-overview-card mb-3">
                      <CardBody>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <h6 className="contracts-overview-card-title mb-0">{t('Create new signatory group')}</h6>
                          <Button
                            color="link"
                            size="sm"
                            className="p-0"
                            onClick={() => {
                              setShowCreateSignatoryGroupForm(false);
                              setGroupName('');
                              setGroupDescription('');
                              setSelectedMemberIds([]);
                            }}
                            disabled={createGroupLoading}
                          >
                            {t('Cancel')}
                          </Button>
                        </div>
                        <Row className="g-3">
                          <Col md={6}>
                            <FormGroup>
                              <Label for="signatory-group-name">{t('Group Name')}</Label>
                              <Input
                                id="signatory-group-name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder={t('Enter group name')}
                                disabled={createGroupLoading}
                              />
                            </FormGroup>
                          </Col>
                          <Col md={6}>
                            <FormGroup>
                              <Label for="signatory-group-description">{t('Description')}</Label>
                              <Input
                                id="signatory-group-description"
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                placeholder={t('Enter description')}
                                disabled={createGroupLoading}
                              />
                            </FormGroup>
                          </Col>
                          <Col md={12}>
                            <FormGroup>
                              <Label className="mb-2">{t('Members')}</Label>
                              {contractUsersWithApprovalRole.length === 0 ? (
                                <div className="contracts-signatory-members">
                                  <div className="text-muted small">
                                    {t(
                                      'No contract users with approval (APPROVE) permission. Only they can be added to a signatory group.'
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="contracts-signatory-order-builder">
                                  <div className="contracts-signatory-members">
                                    <div className="small text-muted mb-2">{t('Available users')}</div>
                                    {availableMembers.length === 0 ? (
                                      <div className="text-muted small">{t('All eligible users are selected.')}</div>
                                    ) : (
                                      availableMembers.map((member) => (
                                        <div key={member.id} className="contracts-signatory-member-option">
                                          <span>
                                            <strong>{member.fullName}</strong>
                                            <small>{member.email || t('No email')}</small>
                                          </span>
                                          <Button
                                            color="link"
                                            className="p-0 contracts-signatory-add-btn"
                                            type="button"
                                            onClick={() => addGroupMember(member.id)}
                                            title={t('Add member')}
                                          >
                                            <PlusCircle size={16} />
                                          </Button>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                  <div className="contracts-signatory-selected">
                                    <div className="small text-muted mb-2 d-flex align-items-center gap-1">
                                      <Move size={13} />
                                      {t('Selected members (drag to reorder)')}
                                    </div>
                                    {selectedMembers.length === 0 ? (
                                      <div className="contracts-overview-empty mb-0">
                                        {t('Select at least one member to build the signatory order.')}
                                      </div>
                                    ) : (
                                      <div
                                        className="contracts-signatory-selected-list"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => setDraggingMemberId(null)}
                                      >
                                        {selectedMembers.map((member, index) => (
                                          <div
                                            key={member.id}
                                            className={`contracts-signatory-selected-item ${
                                              draggingMemberId === member.id ? 'is-dragging' : ''
                                            }`}
                                            draggable
                                            onDragStart={() => handleMemberDragStart(member.id)}
                                            onDragOver={(e) => {
                                              e.preventDefault();
                                              handleMemberDropOn(member.id);
                                            }}
                                            onDragEnd={() => setDraggingMemberId(null)}
                                          >
                                            <span className="contracts-signatory-order-badge">{index + 1}</span>
                                            <span className="contracts-signatory-selected-content">
                                              <strong>{member.fullName}</strong>
                                              <small>{member.email || t('No email')}</small>
                                            </span>
                                            <Button
                                              color="link"
                                              className="p-0 contracts-signatory-remove-btn"
                                              type="button"
                                              onClick={() => removeGroupMember(member.id)}
                                              title={t('Remove member')}
                                            >
                                              <XCircle size={16} />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </FormGroup>
                          </Col>
                        </Row>
                        <div className="d-flex justify-content-end">
                          <Button color="primary" onClick={handleCreateSignatoryGroup} disabled={createGroupLoading}>
                            {createGroupLoading ? t('Creating...') : t('Create new signatory group')}
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  <Card className="contracts-overview-card">
                    <CardBody>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6 className="contracts-overview-card-title mb-0">{t('All signatory groups')}</h6>
                        <Button color="light" size="sm" onClick={loadSignatoryGroups} disabled={signatoryGroupsLoading}>
                          {t('Refresh')}
                        </Button>
                      </div>
                      {editingGroupId && (
                        <Card className="contracts-overview-card mb-3">
                          <CardBody>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <h6 className="contracts-overview-card-title mb-0">{t('Edit signatory group')}</h6>
                            </div>
                            <Row className="g-3">
                              <Col md={6}>
                                <FormGroup>
                                  <Label for="edit-signatory-group-name">{t('Group Name')}</Label>
                                  <Input
                                    id="edit-signatory-group-name"
                                    value={editGroupName}
                                    onChange={(e) => setEditGroupName(e.target.value)}
                                    placeholder={t('Enter group name')}
                                    disabled={editGroupLoading}
                                  />
                                </FormGroup>
                              </Col>
                              <Col md={6}>
                                <FormGroup>
                                  <Label for="edit-signatory-group-description">{t('Description')}</Label>
                                  <Input
                                    id="edit-signatory-group-description"
                                    value={editGroupDescription}
                                    onChange={(e) => setEditGroupDescription(e.target.value)}
                                    placeholder={t('Enter description')}
                                    disabled={editGroupLoading}
                                  />
                                </FormGroup>
                              </Col>
                            </Row>
                            <div className="d-flex justify-content-end gap-2">
                              <Button color="light" onClick={handleCancelEditGroup} disabled={editGroupLoading}>
                                {t('Cancel')}
                              </Button>
                              <Button color="primary" onClick={handleSaveEditGroup} disabled={editGroupLoading}>
                                {editGroupLoading ? t('Saving...') : t('Save changes')}
                              </Button>
                            </div>
                          </CardBody>
                        </Card>
                      )}
                      {deactivateGroupId && (
                        <Card className="contracts-overview-card mb-3">
                          <CardBody>
                            <h6 className="mb-2">{t('Deactivate signatory group')}</h6>
                            <p className="text-muted mb-3">
                              {t('This will set the signatory group as inactive. You can proceed if you are sure.')}
                            </p>
                            {(() => {
                              const targetGroup = signatoryGroups.find((group) => group.id === deactivateGroupId);
                              const targetName = targetGroup?.name || '—';
                              const isNameMatch = deactivateGroupConfirmationName.trim() === (targetGroup?.name ?? '').trim();
                              return (
                                <FormGroup>
                                  <Label for="deactivate-signatory-group-confirmation">
                                    {t('Type "{{name}}" to confirm', { name: targetName })}
                                  </Label>
                                  <Input
                                    id="deactivate-signatory-group-confirmation"
                                    type="text"
                                    value={deactivateGroupConfirmationName}
                                    onChange={(e) => setDeactivateGroupConfirmationName(e.target.value)}
                                    onCopy={(e) => e.preventDefault()}
                                    onCut={(e) => e.preventDefault()}
                                    onPaste={(e) => e.preventDefault()}
                                    placeholder={t('Enter signatory group name')}
                                    autoComplete="off"
                                  />
                                  {deactivateGroupConfirmationName.trim().length > 0 && !isNameMatch && (
                                    <small className="text-danger d-block mt-1">
                                      {t('Signatory group name does not match.')}
                                    </small>
                                  )}
                                </FormGroup>
                              );
                            })()}
                            <div className="d-flex justify-content-end gap-2">
                              <Button
                                color="light"
                                onClick={handleCancelDeactivateGroup}
                                disabled={deactivateGroupLoading}
                              >
                                {t('Cancel')}
                              </Button>
                              <Button
                                color="danger"
                                onClick={handleConfirmDeactivateGroup}
                                disabled={
                                  deactivateGroupLoading ||
                                  deactivateGroupConfirmationName.trim() !==
                                    (signatoryGroups.find((group) => group.id === deactivateGroupId)?.name ?? '').trim()
                                }
                              >
                                {deactivateGroupLoading ? t('Deactivating...') : t('Deactivate')}
                              </Button>
                            </div>
                          </CardBody>
                        </Card>
                      )}
                      {signatoryGroupsLoading ? (
                        <div className="py-3 text-center">
                          <AppLoader size="sm" aria-label={t('Loading')} />
                        </div>
                      ) : signatoryGroups.length === 0 ? (
                        <div className="contracts-overview-empty">{t('No signatory groups found.')}</div>
                      ) : (
                        <div className="table-responsive contracts-overview-table-wrap">
                          <table className="table table-sm align-middle mb-0 contracts-overview-table">
                            <thead>
                              <tr>
                                <th>{t('Name')}</th>
                                <th>{t('Description')}</th>
                                <th>{t('Rules')}</th>
                                <th>{t('Members')}</th>
                                <th>{t('Status')}</th>
                                <th>{t('Actions')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {signatoryGroups.map((group) => (
                                <tr key={group.id}>
                                  <td>{group.name || '—'}</td>
                                  <td>{group.description || '—'}</td>
                                  <td>{group.approvalRules?.length ?? 0}</td>
                                  <td>{group.members?.length ?? 0}</td>
                                  <td>
                                    <Badge color={group.active ? 'success' : 'secondary'} pill>
                                      {group.active ? t('Active') : t('Inactive')}
                                    </Badge>
                                  </td>
                                  <td>
                                    <UncontrolledDropdown className="table-actions-dropdown">
                                      <DropdownToggle color="link" className="p-0 text-body" caret={false}>
                                        <MoreVertical size={16} />
                                      </DropdownToggle>
                                      <DropdownMenu end container="body" strategy="fixed" className="table-actions-dropdown-menu">
                                        <DropdownItem onClick={() => handleStartEditGroup(group)}>
                                          <Edit3 size={14} className="me-2" />
                                          {t('Edit')}
                                        </DropdownItem>
                                        <DropdownItem
                                          className="text-danger"
                                          onClick={() => handleRequestDeactivateGroup(group)}
                                          disabled={!group.active}
                                        >
                                          <MinusCircle size={14} className="me-2" />
                                          {t('Deactivate')}
                                        </DropdownItem>
                                        <DropdownItem onClick={() => handleStartManageGroup(group)}>
                                          <Settings size={14} className="me-2" />
                                          {t('Manage group')}
                                        </DropdownItem>
                                      </DropdownMenu>
                                    </UncontrolledDropdown>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              )}

              <Modal isOpen={!!manageGroupId && !!manageGroup} toggle={handleCloseManageGroup} size="xl" scrollable>
                <ModalHeader toggle={handleCloseManageGroup}>
                  {t('Manage group')}: {manageGroup?.name}
                </ModalHeader>
                <ModalBody>
                  <Card className="contracts-overview-card mb-3">
                    <CardBody>
                      <h6 className="mb-3">{t('Manage members inside groups (add/remove/list)')}</h6>
                      {groupMembersLoading ? (
                        <div className="py-2">
                          <AppLoader size="sm" aria-label={t('Loading')} />
                        </div>
                      ) : (
                        <FormGroup>
                          <Label className="mb-2">{t('Members')}</Label>
                          <div className="contracts-signatory-order-builder">
                            <div className="contracts-signatory-members">
                              <div className="small text-muted mb-2">{t('Available users')}</div>
                              {availableUsersForManageGroup.length === 0 ? (
                                <div className="text-muted small">
                                  {t(
                                    'No users with APPROVE permission left to add, or they are already in this group.'
                                  )}
                                </div>
                              ) : (
                                availableUsersForManageGroup.map((user) => (
                                  <div key={user.id} className="contracts-signatory-member-option">
                                    <span>
                                      <strong>{user.fullName}</strong>
                                      <small>{user.email || t('No email')}</small>
                                    </span>
                                    <Button
                                      color="link"
                                      className="p-0 contracts-signatory-add-btn"
                                      type="button"
                                      onClick={() => handleAddGroupMember(user.id)}
                                      disabled={addMemberLoading}
                                      title={t('Add member')}
                                    >
                                      <PlusCircle size={16} />
                                    </Button>
                                  </div>
                                ))
                              )}
                            </div>

                            <div className="contracts-signatory-selected">
                              <div className="small text-muted mb-2 d-flex align-items-center gap-1">
                                <Move size={13} />
                                {t('Selected members (drag to reorder)')}
                              </div>
                              {groupMembers.length === 0 ? (
                                <div className="contracts-overview-empty mb-0">
                                  {t('No members found in this group.')}
                                </div>
                              ) : (
                                <div
                                  className="contracts-signatory-selected-list"
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={() => setDraggingManagedMemberId(null)}
                                >
                                  {groupMembers.map((member, index) => (
                                    <div
                                      key={member.id}
                                      className={`contracts-signatory-selected-item ${
                                        draggingManagedMemberId === member.id ? 'is-dragging' : ''
                                      }`}
                                      draggable
                                      onDragStart={() => handleManagedMemberDragStart(member.id)}
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        handleManagedMemberDropOn(member.id);
                                      }}
                                      onDragEnd={() => setDraggingManagedMemberId(null)}
                                    >
                                      <span className="contracts-signatory-order-badge">{index + 1}</span>
                                      <span className="contracts-signatory-selected-content">
                                        <strong>{member.userFullName || member.contractUserId}</strong>
                                        <small>{member.userEmail || t('No email')}</small>
                                      </span>
                                      <Button
                                        color="link"
                                        className="p-0 contracts-signatory-remove-btn"
                                        type="button"
                                        onClick={() => handleRemoveGroupMember(member.id)}
                                        disabled={removeMemberLoadingId === member.id}
                                        title={t('Remove member')}
                                      >
                                        <XCircle size={16} />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </FormGroup>
                      )}
                    </CardBody>
                  </Card>

                  <Card className="contracts-overview-card">
                    <CardBody>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="mb-0">{t('Control approval hierarchy (ordering and rules)')}</h6>
                        <Button
                          color="primary"
                          size="sm"
                          onClick={handleReorderAllManagedMembers}
                          disabled={reorderMembersLoading || groupMembers.length === 0}
                        >
                          {reorderMembersLoading ? t('Saving...') : t('Save reordered list')}
                        </Button>
                      </div>

                      {groupMembers.length === 0 ? (
                        <div className="contracts-overview-empty mb-0">
                          {t('Add members first to configure approval hierarchy.')}
                        </div>
                      ) : (
                        <div className="table-responsive contracts-overview-table-wrap">
                          <table className="table table-sm align-middle mb-0 contracts-overview-table">
                            <thead>
                              <tr>
                                <th style={{ width: '90px' }}>{t('Move')}</th>
                                <th>{t('Member')}</th>
                                <th style={{ width: '160px' }}>{t('Approval Order')}</th>
                                <th style={{ width: '140px' }}>{t('Update')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupMembers.map((member, index) => (
                                <tr key={`order-${member.id}`}>
                                  <td>
                                    <div className="d-flex align-items-center gap-1">
                                      <Button
                                        color="light"
                                        size="sm"
                                        onClick={() => moveManagedMember(index, 'up')}
                                        disabled={index === 0}
                                      >
                                        <ArrowUp size={14} />
                                      </Button>
                                      <Button
                                        color="light"
                                        size="sm"
                                        onClick={() => moveManagedMember(index, 'down')}
                                        disabled={index === groupMembers.length - 1}
                                      >
                                        <ArrowDown size={14} />
                                      </Button>
                                    </div>
                                  </td>
                                  <td>{member.userFullName || member.userEmail || member.contractUserId}</td>
                                  <td>
                                    <Input
                                      type="number"
                                      min={0}
                                      value={memberOrderDrafts[member.id] ?? ''}
                                      onChange={(e) =>
                                        setMemberOrderDrafts((prev) => ({
                                          ...prev,
                                          [member.id]: e.target.value,
                                        }))
                                      }
                                    />
                                  </td>
                                  <td>
                                    <Button
                                      color="light"
                                      size="sm"
                                      onClick={() => handleUpdateSingleMemberOrder(member.id)}
                                      disabled={updateOrderLoadingId === member.id}
                                    >
                                      {updateOrderLoadingId === member.id ? t('Updating...') : t('Update')}
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <p className="text-muted small mt-2 mb-0">
                        {t('Manage amount-based approval rules under Approval rules in the sidebar.')}
                      </p>
                    </CardBody>
                  </Card>
                </ModalBody>
              </Modal>

              {activeTab === 'approvalRules' && isActive && (
                <ApprovalRulesTab contractId={contract.id} currentUserId={currentUserId} />
              )}

              {activeTab === 'suspend' && isActive && !isSuspended && (
                <Card>
                  <CardBody>
                    <h6>{t('Suspend contract')}</h6>
                    <Form>
                      <FormGroup>
                        <Label for="suspend-reason">{t('Reason')}</Label>
                        <Input
                          id="suspend-reason"
                          type="textarea"
                          rows={4}
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                          placeholder={t('Enter suspension reason')}
                        />
                      </FormGroup>
                      <Button color="warning" onClick={handleSuspend} disabled={suspendLoading || !suspendReason.trim()}>
                        {suspendLoading ? t('Submitting...') : t('Suspend')}
                      </Button>
                    </Form>
                  </CardBody>
                </Card>
              )}

              {activeTab === 'activate' && isPending && (
                <Card>
                  <CardBody>
                    <h6>{t('Activate contract')}</h6>
                    <p className="text-muted">{t('Activate this contract while it is in a pending state.')}</p>
                    <Button color="success" onClick={handleActivate} disabled={activateLoading}>
                      {activateLoading ? t('Submitting...') : t('Activate')}
                    </Button>
                  </CardBody>
                </Card>
              )}

              {activeTab === 'terminate' && isActive && !isTerminated && (
                <Card>
                  <CardBody>
                    <h6>{t('Terminate contract')}</h6>
                    <Form>
                      <FormGroup>
                        <Label for="terminate-reason">{t('Reason')}</Label>
                        <Input
                          id="terminate-reason"
                          type="textarea"
                          rows={4}
                          value={terminateReason}
                          onChange={(e) => setTerminateReason(e.target.value)}
                          placeholder={t('Enter termination reason')}
                        />
                      </FormGroup>
                      <Button color="dark" onClick={handleTerminate} disabled={terminateLoading || !terminateReason.trim()}>
                        {terminateLoading ? t('Submitting...') : t('Terminate')}
                      </Button>
                    </Form>
                  </CardBody>
                </Card>
              )}

              {activeTab === 'delete' && (
                <Card>
                  <CardBody>
                    <h6>{t('Delete contract')}</h6>
                    <p className="text-muted">
                      {t('This operation permanently deletes the contract. This action cannot be undone.')}
                    </p>
                    <FormGroup>
                      <Label for="delete-contract-confirmation">
                        {t('Type "{{name}}" to confirm', { name: contract.contractName || '—' })}
                      </Label>
                      <Input
                        id="delete-contract-confirmation"
                        type="text"
                        value={deleteConfirmationName}
                        onChange={(e) => setDeleteConfirmationName(e.target.value)}
                        onPaste={(e) => e.preventDefault()}
                        placeholder={t('Enter contract name')}
                        autoComplete="off"
                      />
                      {deleteConfirmationName.trim().length > 0 &&
                        deleteConfirmationName.trim() !== (contract.contractName ?? '').trim() && (
                          <small className="text-danger d-block mt-1">
                            {t('Contract name does not match.')}
                          </small>
                        )}
                    </FormGroup>
                    <Button
                      color="danger"
                      onClick={handleDeleteConfirm}
                      disabled={
                        deleteLoading ||
                        deleteConfirmationName.trim() !== (contract.contractName ?? '').trim()
                      }
                    >
                      {deleteLoading ? t('Deleting...') : t('Delete')}
                    </Button>
                  </CardBody>
                </Card>
              )}
            </Col>
          </Row>
        </CardBody>
      </Card>

      <ContractUserDetailsModal
        isOpen={detailContractUser !== null}
        contractUser={detailContractUser}
        onClose={handleCloseContractUserDetails}
      />

      <EditContractUserModal
        isOpen={!!editingContractUser?.id}
        contract={contract}
        contractUser={editingContractUser}
        submitLoading={editContractUserLoading}
        onClose={handleCloseEditContractUser}
        onSubmit={handleEditContractUserSubmit}
      />
    </>
  );
}
