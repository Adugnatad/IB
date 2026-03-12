'use client';

import React, { useEffect } from 'react';
import { Container, Row, Col, TabContent, TabPane } from 'reactstrap';
import LoginTab from '@/Component/Auth/Tabs/LoginTab';
import { useAppSelector } from '@/Redux/ReduxStore';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { isAuthenticated, isRehydrating } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!isRehydrating && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isRehydrating, router]);

  if (!isRehydrating && isAuthenticated) {
    return (
      <main className='login-page'>
        <div className='page-wrapper compact-wrapper' id='pageWrapper'>
          <div className='d-flex justify-content-center align-items-center min-vh-100'>
            <div className='spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Loading...</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='login-page'>
      <div className='page-wrapper compact-wrapper' id='pageWrapper'>
        <Container fluid={true} className='p-0'>
          <Row>
            <Col xs='12'>
              <div className='login-card'>
                <div className='login-main login-tab'>
                  <TabContent className='content-login'>
                    <TabPane>
                      <LoginTab />
                    </TabPane>
                  </TabContent>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </main>
  );
}
