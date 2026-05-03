'use client';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, Col, Row, Button, UncontrolledTooltip } from 'reactstrap';
import { Repeat, Layers, CheckCircle, Clock, XCircle } from 'react-feather';
import { AppLoader } from '@/Component/Loader';
import { useContractStatistics } from './useContractStatistics';

type StatusBar = {
  key: string;
  label: string;
  value: number;
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
};

export function ContractsExecutiveDashboard() {
  const { t } = useTranslation();
  const { stats, loading, error, refresh } = useContractStatistics();

  const statusBars = useMemo<StatusBar[]>(
    () => [
      { key: 'active', label: t('Active'), value: stats.activeContracts, tone: 'success' },
      { key: 'pending', label: t('Pending'), value: stats.pendingContracts, tone: 'warning' },
      { key: 'suspended', label: t('Suspended'), value: stats.suspendedContracts, tone: 'secondary' },
      { key: 'expired', label: t('Expired'), value: stats.expiredContracts, tone: 'info' },
      { key: 'terminated', label: t('Terminated'), value: stats.terminatedContracts, tone: 'danger' },
      { key: 'operational', label: t('Operational'), value: stats.operationalContracts, tone: 'primary' },
    ],
    [stats, t]
  );

  const max = Math.max(1, ...statusBars.map((s) => s.value));

  const serviceCards = [
    {
      key: 'total',
      title: t('Total Contracts'),
      value: stats.totalContracts,
      icon: <Layers size={20} />,
      tone: 'primary',
      hint: t('All contracts in the system across every lifecycle stage.'),
    },
    {
      key: 'active',
      title: t('Active Contracts'),
      value: stats.activeContracts,
      icon: <CheckCircle size={20} />,
      tone: 'success',
      hint: t('Contracts currently enabled and usable for normal operations.'),
    },
    {
      key: 'pending',
      title: t('Pending Contracts'),
      value: stats.pendingContracts,
      icon: <Clock size={20} />,
      tone: 'warning',
      hint: t('Contracts created but still awaiting completion/approval/activation flow.'),
    },
    {
      key: 'terminated',
      title: t('Terminated Contracts'),
      value: stats.terminatedContracts,
      icon: <XCircle size={20} />,
      tone: 'danger',
      hint: t('Contracts permanently closed and no longer operational.'),
    },
  ];

  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2 py-4">
        <AppLoader size="sm" aria-label={t('Loading')} />
        <span>{t('Loading executive dashboard...')}</span>
      </div>
    );
  }

  return (
    <div className="contracts-exec-dashboard">
      {error && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between">
          <span>{error}</span>
          <Button color="link" size="sm" onClick={refresh}>
            {t('Retry')}
          </Button>
        </div>
      )}

      <h6 className="contracts-exec-title">{t('Contract Status')}</h6>
      <Row className="g-3 mb-3">
        {serviceCards.map((item) => (
          <Col lg={3} md={6} sm={6} key={item.key}>
            <Card className={`contracts-service-card contracts-service-card--${item.tone}`} id={`contract-status-card-${item.key}`}>
              <CardBody>
                <div className="service-icon">{item.icon}</div>
                <p className="mb-1">{item.title}</p>
                <h5 className="mb-0">{item.value.toLocaleString()}</h5>
              </CardBody>
            </Card>
            <UncontrolledTooltip
              target={`contract-status-card-${item.key}`}
              placement="top"
              className="contracts-sky-tooltip"
              container="body"
              offset={[0, 12]}
            >
              {item.hint}
            </UncontrolledTooltip>
          </Col>
        ))}
      </Row>

      <Row className="g-3">
        <Col xl={4}>
          <Card className="contracts-panel-card h-100">
            <CardBody>
              <h6 className="contracts-exec-title">{t('Contracts Summary')}</h6>
              <div className="contracts-kpi-list">
                <div>
                  <span>{t('Total')}</span>
                  <strong>{stats.totalContracts.toLocaleString()}</strong>
                </div>
                <div>
                  <span>{t('Active')}</span>
                  <strong>{stats.activeContracts.toLocaleString()}</strong>
                </div>
                <div>
                  <span>{t('Operational')}</span>
                  <strong>{stats.operationalContracts.toLocaleString()}</strong>
                </div>
              </div>
              <Button color="light" className="contracts-soft-btn mt-3">
                {t('Show All +{{count}}', { count: Math.max(0, stats.totalContracts - 3) })}
              </Button>
            </CardBody>
          </Card>
        </Col>
        <Col xl={8}>
          <Card className="contracts-panel-card h-100">
            <CardBody>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="contracts-exec-title mb-0">{t('Contract Status Comparison')}</h6>
                <Button color="link" className="p-0 text-primary" onClick={refresh}>
                  <Repeat size={14} className="me-1" />
                  {t('Refresh')}
                </Button>
              </div>
              <div className="contracts-compare-chart">
                {statusBars.map((bar, i) => {
                  const width = (bar.value / max) * 100;
                  return (
                    <div className="contracts-compare-row" key={bar.key} style={{ animationDelay: `${i * 70}ms` }}>
                      <div className="label">{bar.label}</div>
                      <div className="track">
                        <div
                          className={`fill bg-${bar.tone}`}
                          style={{ width: `${width}%` }}
                          aria-label={`${bar.label}: ${bar.value}`}
                        />
                      </div>
                      <div className="value">{bar.value.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
