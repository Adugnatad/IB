'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import CardHeaderCommon from '@/CommonComponents/CardHeaderCommon';
import NoticeAlert from '@/CommonComponents/NoticeAlert';
import { ContractsTab } from '@/features/contracts';

export default function ContractsPage() {
  const { t } = useTranslation();

  return (
    <Container fluid>
      <Row>
        <Col sm="12">
          <Card>
            <CardHeaderCommon
              title={t('Contracts Management')}
              titleClassName="text-primary"
              headerClassName="pb-3"
            />
            <CardBody>
              <NoticeAlert
                notice={t(
                  'View and filter contracts by status. Use "Active only" to show active contracts. Create new contracts by linking a customer account (13-digit account number).'
                )}
              />
              <ContractsTab />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
