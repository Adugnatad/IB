'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  UncontrolledDropdown,
} from 'reactstrap';
import { toast } from 'react-toastify';
import { TOAST_AUTO_CLOSE_MS } from '@/CommonComponents/ToastProvider';
import { AppLoader } from '@/Component/Loader';
import {
  ApiError,
  createContractApprovalRule,
  deleteContractApprovalRule,
  fetchContractApprovalRules,
  fetchSignatoryGroups,
  updateContractApprovalRule,
} from '@/services/api/contracts-api';
import type {
  ContractApprovalRule,
  ContractApprovalRuleAction,
  ContractApprovalRuleType,
  SignatoryGroup,
} from '@/types/contracts';
import { CONTRACT_APPROVAL_RULE_ACTIONS, CONTRACT_APPROVAL_RULE_TYPES } from '@/types/contracts';
import { shortDisplayId } from './utils';
import { Edit3, MoreVertical, PlusCircle, Trash2 } from 'react-feather';

function getErr(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body as { errorMessage?: string; message?: string } | undefined;
    return `${body?.errorMessage ?? body?.message ?? err.message}${err.status ? ` (${err.status})` : ''}`;
  }
  return err instanceof Error ? err.message : 'An unexpected error occurred.';
}

export interface ApprovalRulesTabProps {
  contractId: string;
  currentUserId: string;
}

type RuleFormDraft = {
  minAmountStr: string;
  maxAmountStr: string;
  signatoryGroupId: string;
};

const emptyFormDraft = (): RuleFormDraft => ({
  minAmountStr: '',
  maxAmountStr: '',
  signatoryGroupId: '',
});

function parseAmountField(raw: string): { ok: true; value: number } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: true, value: 0 };
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return { ok: false };
  return { ok: true, value: n };
}

export function ApprovalRulesTab({ contractId, currentUserId }: ApprovalRulesTabProps) {
  const { t } = useTranslation();

  const [rules, setRules] = useState<ContractApprovalRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [approvalTypeFilter, setApprovalTypeFilter] = useState<string>('');
  const [signatoryGroups, setSignatoryGroups] = useState<SignatoryGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  const [groupFilterClient, setGroupFilterClient] = useState<string>('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ContractApprovalRule | null>(null);
  const [approvalTypeDraft, setApprovalTypeDraft] = useState<ContractApprovalRuleType>(
    CONTRACT_APPROVAL_RULE_TYPES[0]
  );
  const [approvalActionDraft, setApprovalActionDraft] = useState<ContractApprovalRuleAction>(
    CONTRACT_APPROVAL_RULE_ACTIONS[0]
  );
  const [bodyDraft, setBodyDraft] = useState<RuleFormDraft>(emptyFormDraft);
  const [saveLoading, setSaveLoading] = useState(false);

  const [deleteRule, setDeleteRule] = useState<ContractApprovalRule | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadGroups = useCallback(async () => {
    setGroupsLoading(true);
    try {
      const data = await fetchSignatoryGroups(contractId);
      setSignatoryGroups(data);
    } catch (err) {
      toast.error(getErr(err), { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setGroupsLoading(false);
    }
  }, [contractId]);

  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    try {
      const data = await fetchContractApprovalRules(
        contractId,
        approvalTypeFilter.trim() ? approvalTypeFilter.trim() : undefined
      );
      setRules(data);
    } catch (err) {
      toast.error(getErr(err), { autoClose: TOAST_AUTO_CLOSE_MS });
      setRules([]);
    } finally {
      setRulesLoading(false);
    }
  }, [contractId, approvalTypeFilter]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const selectableGroups = useMemo(
    () => signatoryGroups.filter((g) => g.active !== false && g.id),
    [signatoryGroups]
  );

  const filteredRules = useMemo(() => {
    if (!groupFilterClient.trim()) return rules;
    return rules.filter((r) => r.signatoryGroupId === groupFilterClient);
  }, [rules, groupFilterClient]);

  const openCreate = () => {
    const firstGroup = selectableGroups[0]?.id ?? '';
    setEditingRule(null);
    setApprovalTypeDraft(CONTRACT_APPROVAL_RULE_TYPES[0]);
    setApprovalActionDraft(CONTRACT_APPROVAL_RULE_ACTIONS[0]);
    setBodyDraft({ ...emptyFormDraft(), signatoryGroupId: firstGroup });
    setEditorOpen(true);
  };

  const openEdit = (rule: ContractApprovalRule) => {
    const ty = CONTRACT_APPROVAL_RULE_TYPES.includes(rule.approvalType as ContractApprovalRuleType)
      ? (rule.approvalType as ContractApprovalRuleType)
      : CONTRACT_APPROVAL_RULE_TYPES[0];
    const ac = CONTRACT_APPROVAL_RULE_ACTIONS.includes(rule.approvalAction as ContractApprovalRuleAction)
      ? (rule.approvalAction as ContractApprovalRuleAction)
      : CONTRACT_APPROVAL_RULE_ACTIONS[0];
    setEditingRule(rule);
    setApprovalTypeDraft(ty);
    setApprovalActionDraft(ac);
    setBodyDraft({
      minAmountStr: String(rule.minAmount ?? ''),
      maxAmountStr: String(rule.maxAmount ?? ''),
      signatoryGroupId: rule.signatoryGroupId,
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingRule(null);
  };

  const handleSaveRule = async () => {
    if (!currentUserId.trim()) {
      toast.error(t('You must be signed in to perform this action.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      return;
    }
    if (!bodyDraft.signatoryGroupId.trim()) {
      toast.error(t('Select a signatory group.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      return;
    }
    const minParsed = parseAmountField(bodyDraft.minAmountStr);
    const maxParsed = parseAmountField(bodyDraft.maxAmountStr);
    if (!minParsed.ok || !maxParsed.ok) {
      toast.error(t('Min and max amount must be valid numbers.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      return;
    }
    const minAmount = minParsed.value;
    const maxAmount = maxParsed.value;
    if (maxAmount < minAmount) {
      toast.error(t('Maximum amount cannot be less than minimum amount.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      return;
    }

    const payload = {
      minAmount,
      maxAmount,
      signatoryGroupId: bodyDraft.signatoryGroupId.trim(),
    };

    setSaveLoading(true);
    try {
      if (editingRule?.id) {
        await updateContractApprovalRule(
          contractId,
          editingRule.id,
          approvalTypeDraft,
          approvalActionDraft,
          payload,
          currentUserId
        );
        toast.success(t('Approval rule updated.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      } else {
        await createContractApprovalRule(
          contractId,
          approvalTypeDraft,
          approvalActionDraft,
          payload,
          currentUserId
        );
        toast.success(t('Approval rule created.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      }
      closeEditor();
      await loadRules();
    } catch (err) {
      toast.error(getErr(err), { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteRule?.id || !currentUserId.trim()) return;
    setDeleteLoading(true);
    try {
      await deleteContractApprovalRule(contractId, deleteRule.id, currentUserId);
      toast.success(t('Approval rule removed.'), { autoClose: TOAST_AUTO_CLOSE_MS });
      setDeleteRule(null);
      await loadRules();
    } catch (err) {
      toast.error(getErr(err), { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="contracts-approval-rules">
      <Card className="contracts-signatory-summary mb-3">
        <CardBody>
          <h5 className="mb-2">{t('Approval rules')}</h5>
          <p className="text-muted small mb-0">
            {t(
              'Link signatory groups to amount ranges and approval types for inter- and intra-bank transfer actions.'
            )}
          </p>
        </CardBody>
      </Card>

      <Card className="contracts-overview-card mb-3">
        <CardBody>
          <Row className="g-3 align-items-end mb-3">
            <Col md={4}>
              <FormGroup className="mb-0">
                <Label className="small">{t('Filter by approval type')}</Label>
                <Input
                  type="select"
                  value={approvalTypeFilter}
                  onChange={(e) => setApprovalTypeFilter(e.target.value)}
                  disabled={rulesLoading}
                >
                  <option value="">{t('All types')}</option>
                  {CONTRACT_APPROVAL_RULE_TYPES.map((opt) => (
                    <option key={opt} value={opt}>
                      {t(opt)}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup className="mb-0">
                <Label className="small">{t('Filter by signatory group')}</Label>
                <Input
                  type="select"
                  value={groupFilterClient}
                  onChange={(e) => setGroupFilterClient(e.target.value)}
                  disabled={groupsLoading}
                >
                  <option value="">{t('All groups')}</option>
                  {signatoryGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name || g.id}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md={4} className="text-md-end">
              <Button color="primary" type="button" onClick={openCreate} disabled={selectableGroups.length === 0}>
                <PlusCircle size={16} className="me-1" aria-hidden />
                {t('Add rule')}
              </Button>
            </Col>
          </Row>

          {selectableGroups.length === 0 && !groupsLoading && (
            <p className="text-muted small mb-3 mb-md-0">
              {t('Create at least one active signatory group before adding approval rules.')}
            </p>
          )}

          {rulesLoading ? (
            <div className="py-4 text-center">
              <AppLoader size="sm" aria-label={t('Loading')} />
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="contracts-overview-empty">{t('No approval rules match the current filters.')}</div>
          ) : (
            <div className="table-responsive contracts-overview-table-wrap">
              <table className="table table-sm align-middle mb-0 contracts-overview-table">
                <thead>
                  <tr>
                    <th>{t('Rule ID')}</th>
                    <th>{t('Type')}</th>
                    <th>{t('Action')}</th>
                    <th>{t('Min')}</th>
                    <th>{t('Max')}</th>
                    <th>{t('Signatory group')}</th>
                    <th>{t('Status')}</th>
                    <th className="text-end">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.map((rule) => (
                    <tr key={rule.id}>
                      <td>
                        <span title={rule.id} className="contracts-user-detail-id-trunc">
                          {shortDisplayId(rule.id)}
                        </span>
                      </td>
                      <td>{t(rule.approvalType) || rule.approvalType}</td>
                      <td>{t(rule.approvalAction) || rule.approvalAction}</td>
                      <td>{rule.minAmount}</td>
                      <td>{rule.maxAmount}</td>
                      <td>{rule.signatoryGroupName || shortDisplayId(rule.signatoryGroupId)}</td>
                      <td>
                        <Badge color={rule.active ? 'success' : 'secondary'} pill>
                          {rule.active ? t('Active') : t('Inactive')}
                        </Badge>
                      </td>
                      <td className="text-end align-middle">
                        <UncontrolledDropdown className="table-actions-dropdown d-inline-flex">
                          <DropdownToggle
                            color="link"
                            className="p-0 text-body"
                            caret={false}
                            aria-label={String(t('Open actions menu'))}
                          >
                            <MoreVertical size={16} aria-hidden />
                          </DropdownToggle>
                          <DropdownMenu end container="body" strategy="fixed" className="table-actions-dropdown-menu">
                            <DropdownItem onClick={() => openEdit(rule)}>
                              <Edit3 size={14} className="me-2" aria-hidden />
                              {t('Edit')}
                            </DropdownItem>
                            <DropdownItem className="text-danger" onClick={() => setDeleteRule(rule)}>
                              <Trash2 size={14} className="me-2" aria-hidden />
                              {t('Delete')}
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

      <Modal isOpen={editorOpen} toggle={saveLoading ? undefined : closeEditor} size="lg">
        <ModalHeader toggle={saveLoading ? undefined : closeEditor}>
          {editingRule ? t('Edit approval rule') : t('Add approval rule')}
        </ModalHeader>
        <ModalBody>
          <Row className="g-3">
            <Col md={6}>
              <FormGroup>
                <Label>{t('Approval type')}</Label>
                <Input
                  type="select"
                  value={approvalTypeDraft}
                  onChange={(e) => setApprovalTypeDraft(e.target.value as ContractApprovalRuleType)}
                  disabled={saveLoading}
                >
                  {CONTRACT_APPROVAL_RULE_TYPES.map((opt) => (
                    <option key={opt} value={opt}>
                      {t(opt)}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>{t('Approval action')}</Label>
                <Input
                  type="select"
                  value={approvalActionDraft}
                  onChange={(e) => setApprovalActionDraft(e.target.value as ContractApprovalRuleAction)}
                  disabled={saveLoading}
                >
                  {CONTRACT_APPROVAL_RULE_ACTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {t(opt)}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>{t('Min amount')}</Label>
                <Input
                  type="number"
                  step="any"
                  value={bodyDraft.minAmountStr}
                  onChange={(e) => setBodyDraft((b) => ({ ...b, minAmountStr: e.target.value }))}
                  disabled={saveLoading}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>{t('Max amount')}</Label>
                <Input
                  type="number"
                  step="any"
                  value={bodyDraft.maxAmountStr}
                  onChange={(e) => setBodyDraft((b) => ({ ...b, maxAmountStr: e.target.value }))}
                  disabled={saveLoading}
                />
              </FormGroup>
            </Col>
            <Col md={12}>
              <FormGroup>
                <Label>{t('Signatory group')}</Label>
                <Input
                  type="select"
                  value={bodyDraft.signatoryGroupId}
                  onChange={(e) => setBodyDraft((b) => ({ ...b, signatoryGroupId: e.target.value }))}
                  disabled={saveLoading || selectableGroups.length === 0}
                >
                  <option value="">{t('Select signatory group')}</option>
                  {selectableGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name || g.id}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="light" type="button" onClick={closeEditor} disabled={saveLoading}>
            {t('Cancel')}
          </Button>
          <Button color="primary" type="button" onClick={() => void handleSaveRule()} disabled={saveLoading}>
            {saveLoading ? t('Saving...') : t('Save')}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={!!deleteRule} toggle={() => !deleteLoading && setDeleteRule(null)}>
        <ModalHeader toggle={() => !deleteLoading && setDeleteRule(null)}>{t('Delete approval rule')}</ModalHeader>
        <ModalBody>
          <p className="mb-0">
            {t('This will deactivate the rule. Continue?')}{' '}
            {deleteRule ? (
              <strong className="text-break" title={deleteRule.id}>
                {shortDisplayId(deleteRule.id)}
              </strong>
            ) : null}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="light" type="button" onClick={() => setDeleteRule(null)} disabled={deleteLoading}>
            {t('Cancel')}
          </Button>
          <Button color="danger" type="button" onClick={() => void handleConfirmDelete()} disabled={deleteLoading}>
            {deleteLoading ? t('Deleting...') : t('Delete')}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
