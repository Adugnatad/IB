'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Button, Form, FormGroup, Input, Label } from 'reactstrap';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { resetPassword } from '@/services/api/auth-api';
import { ApiError } from '@/services/api/client';
import { RESET_PASSWORD_MESSAGES } from '@/lib/auth/error-messages';
import { toast } from 'react-toastify';
import { TOAST_AUTO_CLOSE_MS } from '@/CommonComponents/ToastProvider';

const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, message: 'Password must be at least 8 characters.' };
  }
  if (!PASSWORD_STRENGTH_REGEX.test(password)) {
    return {
      valid: false,
      message: 'Password must include uppercase, lowercase, number and special character (@$!%*?&).',
    };
  }
  return { valid: true };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !resetCode.trim() || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields.', { autoClose: TOAST_AUTO_CLOSE_MS });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.', { autoClose: TOAST_AUTO_CLOSE_MS });
      return;
    }
    const strength = validatePassword(newPassword);
    if (!strength.valid) {
      toast.error(strength.message ?? RESET_PASSWORD_MESSAGES.WEAK_PASSWORD, {
        autoClose: TOAST_AUTO_CLOSE_MS,
      });
      return;
    }
    setLoading(true);
    try {
      await resetPassword({
        identifier: identifier.trim(),
        resetCode: resetCode.trim(),
        newPassword,
      });
      setSuccess(true);
      toast.success(RESET_PASSWORD_MESSAGES.SUCCESS, { autoClose: TOAST_AUTO_CLOSE_MS });
      setTimeout(() => router.replace('/'), 2000);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 400
            ? RESET_PASSWORD_MESSAGES.INVALID_CODE
            : err.message || RESET_PASSWORD_MESSAGES.INVALID_CODE
          : 'Unable to reset password. Please try again.';
      toast.error(message, { autoClose: TOAST_AUTO_CLOSE_MS });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className='login-page'>
        <div className='page-wrapper compact-wrapper' id='pageWrapper'>
          <Container fluid className='p-0'>
            <Row>
              <Col xs='12'>
                <div className='login-card'>
                  <div className='login-main login-tab'>
                    <div className='alert alert-success' role='alert'>
                      {RESET_PASSWORD_MESSAGES.SUCCESS}
                    </div>
                    <p className='small'>Redirecting to sign in...</p>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </div>
      </main>
    );
  }

  return (
    <main className='login-page'>
      <div className='page-wrapper compact-wrapper' id='pageWrapper'>
        <Container fluid className='p-0'>
          <Row>
            <Col xs='12'>
              <div className='login-card'>
                <div className='login-main login-tab'>
                  <h5 className='mb-3'>Reset password</h5>
                  <p className='text-muted small'>
                    Enter your identifier, the reset code you received, and your new password.
                  </p>
                  <Form onSubmit={handleSubmit}>
                    <FormGroup>
                      <Label>User ID / Email / Phone</Label>
                      <Input
                        type='text'
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder='Username, email, or phone'
                        autoComplete='username'
                        disabled={loading}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Reset code</Label>
                      <Input
                        type='text'
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder='Enter reset code'
                        autoComplete='one-time-code'
                        disabled={loading}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>New password</Label>
                      <Input
                        type='password'
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder='New password'
                        autoComplete='new-password'
                        disabled={loading}
                      />
                      <small className='text-muted'>
                        Min 8 characters, with uppercase, lowercase, number and special character.
                      </small>
                    </FormGroup>
                    <FormGroup>
                      <Label>Confirm new password</Label>
                      <Input
                        type='password'
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder='Confirm new password'
                        autoComplete='new-password'
                        disabled={loading}
                      />
                    </FormGroup>
                    <div className='d-flex flex-wrap gap-2 mt-3'>
                      <Button color='primary' type='submit' disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset password'}
                      </Button>
                      <Button color='secondary' tag={Link} href='/'>
                        Back to sign in
                      </Button>
                    </div>
                  </Form>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </main>
  );
}
