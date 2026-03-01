'use client';

import React, { Fragment, useState } from 'react';
import { Button, Form, FormGroup, Input, Label } from 'reactstrap';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { signIn } from 'next-auth/react';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'react-feather';
import { TOAST_AUTO_CLOSE_MS } from '@/CommonComponents/ToastProvider';

const LoginTab = () => {
  const { t } = useTranslation();
  const [togglePassword, setTogglePassword] = useState(false);
  const [userId, setUserId] = useState('admin1');
  const [password, setPassword] = useState('Test@123');
  const router = useRouter();

  const formSubmitHandle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await signIn('credentials', {
      email: userId,
      password,
      redirect: false,
      callbackUrl: '/dashboard',
    });

    if (result?.ok) {
      toast.success('Successfully logged in.', { autoClose: TOAST_AUTO_CLOSE_MS });
      router.push('/dashboard');
    } else {
      toast.error('Invalid User ID or password.', { autoClose: TOAST_AUTO_CLOSE_MS });
    }
  };

  return (
    <Fragment>
      <Form className='theme-form login-form-modern' onSubmit={(event) => formSubmitHandle(event)}>
        <p className='login-welcome'>{t('Welcome to Internet Banking')}</p>

        <FormGroup>
          <Label className='col-form-label'>{t('User ID')}</Label>
          <Input
            type='text'
            required
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className='login-input'
            placeholder='Enter your user ID'
          />
        </FormGroup>

        <FormGroup>
          <Label className='col-form-label'>{t('Password')}</Label>
          <div className='login-password-wrap'>
            <Input
              type={togglePassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className='login-input'
              placeholder='Enter your password'
            />
            <button
              type='button'
              className='login-password-toggle'
              onClick={() => setTogglePassword(!togglePassword)}
              aria-label={togglePassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              {togglePassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </FormGroup>

        <div className='login-options d-flex flex-wrap align-items-center justify-content-between gap-2'>
          <div className='checkbox'>
            <Input id='rememberMe' type='checkbox' />
            <Label className='text-muted mb-0' htmlFor='rememberMe'>
              {t('Remember Me')}
            </Label>
          </div>
          <a className='login-forgot-link' href='#'>
            {t('Forgot User ID or Password')}
          </a>
        </div>

        <div className='login-submit-wrap d-flex justify-content-end'>
          <Button color='primary' className='btn-signin' type='submit'>
            {t('SIGN IN')}
          </Button>
        </div>
      </Form>
    </Fragment>
  );
};

export default LoginTab;
