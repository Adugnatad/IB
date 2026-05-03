'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, Col, Row, Badge, Button } from 'reactstrap';
import { Activity, CheckCircle, AlertTriangle, UserPlus, FileText } from 'react-feather';

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  status: 'success' | 'warning' | 'info';
  icon: React.ReactNode;
};

export function ContractsRecentActivityPanel() {
  const { t } = useTranslation();

  const items: ActivityItem[] = [
    {
      id: 'a1',
      title: t('Contract activated'),
      detail: t('Corporate service contract for customer CUST-10245 was activated.'),
      time: t('2 min ago'),
      status: 'success',
      icon: <CheckCircle size={14} />,
    },
    {
      id: 'a2',
      title: t('User added to contract'),
      detail: t('A new signatory user was linked to contract CTR-88421 with maker role.'),
      time: t('12 min ago'),
      status: 'info',
      icon: <UserPlus size={14} />,
    },
    {
      id: 'a3',
      title: t('Contract suspended'),
      detail: t('Contract CTR-72103 was suspended due to compliance review hold.'),
      time: t('28 min ago'),
      status: 'warning',
      icon: <AlertTriangle size={14} />,
    },
    {
      id: 'a4',
      title: t('Contract updated'),
      detail: t('Effective and expiry dates were adjusted for a merchant service contract.'),
      time: t('43 min ago'),
      status: 'info',
      icon: <FileText size={14} />,
    },
  ];

  return (
    <Card className="contracts-support-activity-card mt-3">
      <CardBody>
        <Row className="g-3 align-items-stretch">
          <Col lg={5}>
            <div className="contracts-support-image-wrap">
              <div className="contracts-bg-img w-100">
                <Image
                  src="/assets/images/609.png"
                  alt={t('Customer contact center support')}
                  fill
                  className="contracts-support-image"
                  sizes="(max-width: 992px) 100vw, 40vw"
                />
              </div>
            </div>
          </Col>
          <Col lg={7}>
            <div className="contracts-activity-panel">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="mb-0 d-flex align-items-center gap-2">
                  <Activity size={16} />
                  {t('Recent Activity')}
                </h6>
                <Button color="link" className="p-0 text-primary">
                  {t('View all')}
                </Button>
              </div>

              <div className="contracts-activity-list">
                {items.map((item) => (
                  <div className="contracts-activity-item" key={item.id}>
                    <span className={`contracts-activity-icon text-${item.status}`}>{item.icon}</span>
                    <div className="contracts-activity-content">
                      <div className="d-flex align-items-center justify-content-between gap-2">
                        <strong>{item.title}</strong>
                        <Badge color={item.status} pill>
                          {item.time}
                        </Badge>
                      </div>
                      <p className="mb-0 text-muted">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Col>
        </Row>
      </CardBody>
    </Card>
  );
}
