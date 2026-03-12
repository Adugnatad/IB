'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Card, CardBody, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import CardHeaderCommon from '@/CommonComponents/CardHeaderCommon';
import NoticeAlert from '@/CommonComponents/NoticeAlert';
import { UsersTab } from '@/features/users-management/UsersTab';

type ManagementTab = 'users' | 'roles' | 'permissions';

export default function UsersPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ManagementTab>('users');

  return (
    <Container fluid>
      <Row>
        <Col sm="12">
          <Card>
            <CardHeaderCommon title={t('Users Management')} titleClassName="text-primary" headerClassName="pb-0" />
            <CardBody>
              <NoticeAlert
                notice={t(
                  'Manage employee access: use the Users tab to view, add, edit, and remove users; assign roles and control permissions from the Roles and Permissions tabs.'
                )}
              />
              <Nav tabs className="nav-tabs-border">
                <NavItem>
                  <NavLink
                    className={activeTab === 'users' ? 'active' : ''}
                    onClick={() => setActiveTab('users')}
                    style={{ cursor: 'pointer' }}
                  >
                    {t('Users')}
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={activeTab === 'roles' ? 'active' : ''}
                    onClick={() => setActiveTab('roles')}
                    style={{ cursor: 'pointer' }}
                  >
                    {t('Roles')}
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={activeTab === 'permissions' ? 'active' : ''}
                    onClick={() => setActiveTab('permissions')}
                    style={{ cursor: 'pointer' }}
                  >
                    {t('Permissions')}
                  </NavLink>
                </NavItem>
              </Nav>
              <TabContent activeTab={activeTab} className="pt-3">
                <TabPane tabId="users">
                  <UsersTab />
                </TabPane>
                <TabPane tabId="roles">
                  <Card>
                    <CardBody>
                      <p className="text-muted mb-0">{t('Roles management — coming soon.')}</p>
                    </CardBody>
                  </Card>
                </TabPane>
                <TabPane tabId="permissions">
                  <Card>
                    <CardBody>
                      <p className="text-muted mb-0">{t('Permissions management — coming soon.')}</p>
                    </CardBody>
                  </Card>
                </TabPane>
              </TabContent>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
