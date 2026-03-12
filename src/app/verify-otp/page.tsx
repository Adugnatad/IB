'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Container, Row, Col, Button, Form, FormGroup, Input, Label } from 'reactstrap';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/Redux/ReduxStore';
import { setSession, clearOtp, setAuthError, clearAuthError } from '@/Redux/Slices/authSlice';
import { tokenManager } from '@/lib/auth/token-manager';
import { startSessionScheduler } from '@/lib/auth/session-scheduler';
import { verifyOtp } from '@/services/api/auth-api';
import { ApiError } from '@/services/api/client';
import { persistAuthUser } from '@/components/Auth/AuthGate';
import { OTP_ERROR_MESSAGES } from '@/lib/auth/error-messages';

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export default function VerifyOtpPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { pendingIdentifier, tempToken, otpCountdownDeadline } = useAppSelector((state) => state.auth);
  const lastError = useAppSelector((state) => state.auth.lastError);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);

  const deadline = otpCountdownDeadline ?? 0;

  useEffect(() => {
    if (!deadline) return;
    const update = () => {
      const ms = Math.max(0, deadline - Date.now());
      setRemainingMs(ms);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1000)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (!pendingIdentifier) {
      router.replace('/');
    }
  }, [pendingIdentifier, router]);

  const getOtpErrorMessage = useCallback((err: unknown): string => {
    if (err instanceof ApiError) {
      if (err.status === 429) return OTP_ERROR_MESSAGES.RATE_LIMIT;
      if (err.status === 400) {
        const body = err.body as { code?: string } | undefined;
        if (body?.code === 'EXPIRED_OTP') return OTP_ERROR_MESSAGES.EXPIRED_OTP;
        return OTP_ERROR_MESSAGES.WRONG_OTP;
      }
    }
    return OTP_ERROR_MESSAGES.NETWORK;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingIdentifier || loading) return;
    const digits = otp.replace(/\D/g, '');
    if (digits.length !== 6) {
      dispatch(setAuthError({ message: 'Please enter a 6-digit code.', code: 'VALIDATION' }));
      return;
    }
    if (remainingMs <= 0) {
      dispatch(setAuthError({ message: OTP_ERROR_MESSAGES.EXPIRED_OTP, code: 'EXPIRED_OTP' }));
      return;
    }
    dispatch(clearAuthError());
    setLoading(true);
    try {
      const data = await verifyOtp({
        identifier: pendingIdentifier,
        otp: digits,
        tempToken: tempToken ?? undefined,
      });
      tokenManager.setTokenPair({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken ?? data.accessToken,
      });
      const user = data.user ?? { id: 'unknown' };
      persistAuthUser({ id: user.id, username: user.username, email: user.email });
      dispatch(setSession({ user, isAuthenticated: true }));
      dispatch(clearOtp());
      startSessionScheduler();
      router.replace('/dashboard');
    } catch (err) {
      dispatch(setAuthError({ message: getOtpErrorMessage(err), code: 'OTP_ERROR' }));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setResendCooldown(RESEND_COOLDOWN_MS);
    dispatch(clearAuthError());
    router.replace('/');
  };

  if (!pendingIdentifier) {
    return null;
  }

  const expired = remainingMs <= 0;
  const formattedTime = `${Math.floor(remainingMs / 60000)}:${String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0')}`;

  return (
    <main className='login-page'>
      <div className='page-wrapper compact-wrapper' id='pageWrapper'>
        <Container fluid className='p-0'>
          <Row>
            <Col xs='12'>
              <div className='login-card'>
                <div className='login-main login-tab'>
                  <h5 className='mb-3'>Verify your identity</h5>
                  <p className='text-muted small'>
                    Enter the 6-digit code sent to your registered contact. Code expires in 5 minutes.
                  </p>
                  {lastError && (
                    <div className='alert alert-danger' role='alert'>
                      {lastError}
                    </div>
                  )}
                  <Form onSubmit={handleSubmit}>
                    <FormGroup>
                      <Label>Verification code</Label>
                      <Input
                        type='text'
                        inputMode='numeric'
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder='000000'
                        className='text-center'
                        autoComplete='one-time-code'
                        disabled={loading || expired}
                      />
                    </FormGroup>
                    {!expired && (
                      <p className='small text-muted'>
                        Time remaining: <strong>{formattedTime}</strong>
                      </p>
                    )}
                    {expired && (
                      <p className='small text-danger'>This code has expired. Request a new one below.</p>
                    )}
                    <div className='d-flex flex-wrap gap-2 justify-content-between mt-3'>
                      <Button color='primary' type='submit' disabled={loading || expired}>
                        {loading ? 'Verifying...' : 'Verify'}
                      </Button>
                      <Button color='link' type='button' onClick={handleResend} disabled={resendCooldown > 0}>
                        {resendCooldown > 0 ? `Resend in ${Math.ceil(resendCooldown / 1000)}s` : 'Resend code'}
                      </Button>
                    </div>
                  </Form>
                  <p className='mt-3 small'>
                    <Link href='/'>Back to sign in</Link>
                  </p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </main>
  );
}
