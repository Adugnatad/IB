'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import CardHeaderCommon from '@/CommonComponents/CardHeaderCommon';
import NoticeAlert from '@/CommonComponents/NoticeAlert';
import { ContractDetailView } from '@/features/contracts/ContractDetailView';

export default function ContractDetailPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const contractId = (searchParams.get('contractId') ?? '').trim();

  return (
    <Container fluid>
      <Row>
        <Col sm="12">
          <Card>
            <CardHeaderCommon
              title={t('Contract Details')}
              titleClassName="text-primary"
              headerClassName="pb-3"
            />
            <CardBody>
              <NoticeAlert
                notice={t(
                  'Review contract details and perform lifecycle actions: update, add user, suspend, activate, terminate, or delete.'
                )}
              />
              {!contractId ? (
                <div className="alert alert-warning mb-0">{t('Missing contractId. Open details from Contracts list.')}</div>
              ) : (
                <ContractDetailView contractId={contractId} />
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
