'use client';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { formatContractDate, shortDisplayId } from './utils';
import { CONTRACT_USER_PERMISSION_TYPES } from '@/types/contracts';

const DATE_KEYS = /^(addedAt|expiresAt|createdDate|lastModified)/i;

/** Keys whose string values are UUID-style ids and should show only the last segment. */
function isDisplayIdKey(key: string): boolean {
  return key === 'id' || /Id$/i.test(key);
}

function renderShortIdString(raw: string): React.ReactNode {
  const trimmed = raw.trim();
  if (!trimmed) return '—';
  const short = shortDisplayId(trimmed);
  if (short === trimmed) return trimmed;
  return (
    <span title={trimmed} className="contracts-user-detail-id-trunc">
      {short}
    </span>
  );
}

const SIGNATORY_EXTRA_FIELDS = [
  'contractUserId',
  'amountConstraint',
  'amountLimit',
  'dailyLimit',
  'scopeConstraint',
  'approvalLevel',
  'requiresAuthorization',
  'priorityOrder',
  'restrictions',
] as const;

function permissionBadgeClass(permissionType: string): string {
  const p = permissionType.toUpperCase();
  switch (p) {
    case 'INITIATE':
      return 'contracts-user-perm-badge contracts-user-perm-initiate';
    case 'APPROVE':
      return 'contracts-user-perm-badge contracts-user-perm-approve';
    case 'VIEW':
      return 'contracts-user-perm-badge contracts-user-perm-view';
    default:
      return 'contracts-user-perm-badge contracts-user-perm-other';
  }
}

function formatScalarForExtra(val: unknown, yesLabel: string, noLabel: string): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? yesLabel : noLabel;
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : '—';
  if (typeof val === 'string') return val.trim() || '—';
  return String(val);
}

function SignatoryMetricsBlock({
  value,
  yesLabel,
  noLabel,
  t,
}: {
  value: unknown;
  yesLabel: string;
  noLabel: string;
  t: (key: string, options?: Record<string, string | number>) => string;
}) {
  if (!Array.isArray(value) || value.length === 0) {
    return (
      <p className="text-muted mb-0 small contracts-user-signatory-empty">
        {t('No signatory permissions on this user.')}
      </p>
    );
  }

  return (
    <ul className="list-unstyled mb-0 contracts-user-signatory-metrics">
      {value.map((raw, idx) => {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
        const m = raw as Record<string, unknown>;
        const permissionRaw = typeof m.permissionType === 'string' ? m.permissionType.trim() : '';
        const permissionType = permissionRaw ? permissionRaw.toUpperCase() : '—';
        const active = m.active === true;
        const metricId = typeof m.id === 'string' ? m.id.trim() : '';

        const extras = SIGNATORY_EXTRA_FIELDS.filter((field) => {
          const v = m[field];
          if (v === null || v === undefined) return false;
          if (typeof v === 'string' && !v.trim()) return false;
          return true;
        });

        const labelForField = (field: string): string => {
          const map: Record<string, string> = {
            contractUserId: t('Contract user ID'),
            amountConstraint: t('Amount constraint'),
            amountLimit: t('Amount limit'),
            dailyLimit: t('Daily limit'),
            scopeConstraint: t('Scope constraint'),
            approvalLevel: t('Approval level'),
            requiresAuthorization: t('Requires authorization'),
            priorityOrder: t('Priority order'),
            restrictions: t('Restrictions'),
          };
          return map[field] ?? field;
        };

        return (
          <li key={metricId || `metric-${idx}`} className="contracts-user-signatory-metric-card">
            <div className="d-flex flex-wrap align-items-center gap-2 contracts-user-signatory-metric-header">
              <span className={`badge ${permissionBadgeClass(permissionType)}`.trim()}>
                {CONTRACT_USER_PERMISSION_TYPES.some((x) => x === permissionType)
                  ? t(permissionType)
                  : permissionType}
              </span>
              <Badge color={active ? 'success' : 'secondary'} pill className="contracts-user-signatory-active-badge">
                {active ? yesLabel : noLabel}
              </Badge>
            </div>

            {extras.length > 0 ? (
              <div className="contracts-user-signatory-metric-extras">
                {extras.map((field) => (
                  <div key={field} className="contracts-user-signatory-metric-extra-row">
                    <span className="contracts-user-signatory-metric-extra-label">{labelForField(field)}</span>
                    <span className="contracts-user-signatory-metric-extra-value">
                      {field === 'contractUserId' && typeof m[field] === 'string'
                        ? renderShortIdString(m[field] as string)
                        : formatScalarForExtra(m[field], yesLabel, noLabel)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function formatDetailValue(key: string, val: unknown, yesLabel: string, noLabel: string): React.ReactNode {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? yesLabel : noLabel;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return '—';
    if (DATE_KEYS.test(key) || /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const pretty = formatContractDate(trimmed);
      return pretty !== '—' ? pretty : trimmed;
    }
    if (isDisplayIdKey(key)) {
      return renderShortIdString(trimmed);
    }
    return trimmed;
  }
  if (Array.isArray(val) || typeof val === 'object') {
    return (
      <pre className="contracts-user-detail-json mb-0 small text-break">
        {JSON.stringify(val, null, 2)}
      </pre>
    );
  }
  return String(val);
}

export interface ContractUserDetailsModalProps {
  isOpen: boolean;
  /** Raw row from contract.users — all keys rendered. */
  contractUser: Record<string, unknown> | null | undefined;
  onClose: () => void;
}

const PREFERRED_KEY_ORDER = [
  'id',
  'contractId',
  'userId',
  'username',
  'email',
  'phone',
  'firstName',
  'lastName',
  'roleName',
  'addedByUserId',
  'addedByUsername',
  'addedAt',
  'expiresAt',
  'gender',
  'dateOfBirth',
  'addressLine1',
  'signatoryMetrics',
  'createdDate',
  'active',
  'expired',
  'primaryAdmin',
];

export function ContractUserDetailsModal({ isOpen, contractUser, onClose }: ContractUserDetailsModalProps) {
  const { t } = useTranslation();

  const entries = useMemo(() => {
    if (!contractUser || typeof contractUser !== 'object' || Array.isArray(contractUser)) return [];
    const keys = Object.keys(contractUser);
    const preferred = PREFERRED_KEY_ORDER.filter((k) => keys.includes(k));
    const rest = keys.filter((k) => !preferred.includes(k)).sort();
    return [...preferred, ...rest].map((k) => [k, contractUser[k]] as const);
  }, [contractUser]);

  const titleName =
    typeof contractUser?.username === 'string' && contractUser.username.trim()
      ? contractUser.username.trim()
      : typeof contractUser?.email === 'string' && contractUser.email.trim()
        ? contractUser.email.trim()
        : '';

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg" scrollable>
      <ModalHeader toggle={onClose}>
        {t('User details')}
        {titleName ? ` — ${titleName}` : ''}
      </ModalHeader>
      <ModalBody>
        {entries.length === 0 ? (
          <p className="text-muted mb-0">{t('No data to display.')}</p>
        ) : (
          <dl className="row mb-0 contracts-user-detail-dl gy-2">
            {entries.map(([key, val]) => {
              const yesL = String(t('Yes'));
              const noL = String(t('No'));
              const dtLabel = key === 'signatoryMetrics' ? t('Signatory permissions') : key;
              return (
                <React.Fragment key={key}>
                  <dt className="col-md-4 col-12 small text-muted text-md-end">{dtLabel}</dt>
                  <dd className="col-md-8 col-12">
                    {key === 'signatoryMetrics' ? (
                      <SignatoryMetricsBlock value={val} yesLabel={yesL} noLabel={noL} t={t} />
                    ) : (
                      formatDetailValue(key, val, yesL, noL)
                    )}
                  </dd>
                </React.Fragment>
              );
            })}
          </dl>
        )}
      </ModalBody>
    </Modal>
  );
}
