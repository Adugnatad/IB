'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, Row, Col, Button } from 'reactstrap';
import { AppLoader } from '@/Component/Loader';
import { useContractStatistics } from './useContractStatistics';

function StatCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'info' | 'dark';
}) {
  return (
    <Card className="h-100 mb-0 border-0 shadow-sm">
      <CardBody className="d-flex flex-column justify-content-between">
        <p className="text-muted mb-2">{title}</p>
        <h3 className={`mb-0 text-${tone ?? 'primary'}`}>{value.toLocaleString()}</h3>
      </CardBody>
    </Card>
  );
}

export function ContractStatisticsDashboard() {
  const { t } = useTranslation();
  const { stats, loading, error, refresh } = useContractStatistics();

  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2 py-3">
        <AppLoader size="sm" aria-label={t('Loading')} />
        <span>{t('Loading contract statistics...')}</span>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between">
          <span>{error}</span>
          <Button color="link" size="sm" onClick={refresh}>
            {t('Retry')}
          </Button>
        </div>
      )}
      <Row className="g-3">
        <Col xl={3} md={6}>
          <StatCard title={t('Total Contracts')} value={stats.totalContracts} tone="primary" />
        </Col>
        <Col xl={3} md={6}>
          <StatCard title={t('Active')} value={stats.activeContracts} tone="success" />
        </Col>
        <Col xl={3} md={6}>
          <StatCard title={t('Pending')} value={stats.pendingContracts} tone="warning" />
        </Col>
        <Col xl={3} md={6}>
          <StatCard title={t('Operational')} value={stats.operationalContracts} tone="info" />
        </Col>
        <Col xl={4} md={6}>
          <StatCard title={t('Suspended')} value={stats.suspendedContracts} tone="secondary" />
        </Col>
        <Col xl={4} md={6}>
          <StatCard title={t('Expired')} value={stats.expiredContracts} tone="dark" />
        </Col>
        <Col xl={4} md={12}>
          <StatCard title={t('Terminated')} value={stats.terminatedContracts} tone="danger" />
        </Col>
      </Row>
    </div>
  );
}
