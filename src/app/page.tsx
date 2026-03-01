'use client';

import React, { useEffect } from 'react';
import { Container, Row, Col, TabContent, TabPane } from 'reactstrap';
import LoginTab from '@/Component/Auth/Tabs/LoginTab';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Only redirect to dashboard when explicitly authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/dashboard');
    }
  }, [session, status, router]);

  // Show login by default; only hide when we're sure user is authenticated (redirecting)
  if (status === 'authenticated' && session) {
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
