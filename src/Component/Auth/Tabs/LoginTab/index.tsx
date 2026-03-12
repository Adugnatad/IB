'use client';

import React, { Fragment, useState } from 'react';
import { Button, Form, FormGroup, Input, Label, Spinner } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'react-feather';
import { useLoginSubmit } from '@/hooks/useLoginSubmit';
import Link from 'next/link';

const LoginTab = () => {
  const { t } = useTranslation();
  const [togglePassword, setTogglePassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const { submit, loading } = useLoginSubmit();

  const formSubmitHandle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit(identifier, password);
  };

  return (
    <Fragment>
      <Form className='theme-form login-form-modern' onSubmit={formSubmitHandle}>
        <p className='login-welcome'>{t('Welcome to Internet Banking')}</p>

        <FormGroup>
          <Label className='col-form-label'>{t('User ID / Email / Phone')}</Label>
          <Input
            type='text'
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className='login-input'
            placeholder='Username, email, or phone'
            autoComplete='username'
            disabled={loading}
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
              autoComplete='current-password'
              disabled={loading}
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
          <Link className='login-forgot-link' href='/reset-password'>
            {t('Forgot User ID or Password')}
          </Link>
        </div>

        <div className='login-submit-wrap d-flex justify-content-end'>
          <Button color='primary' className='btn-signin d-inline-flex align-items-center justify-content-center gap-2' type='submit' disabled={loading}>
            {loading ? (
              <>
                <Spinner size='sm' />
                {t('Signing in')}
              </>
            ) : (
              t('SIGN IN')
            )}
          </Button>
        </div>
      </Form>
    </Fragment>
  );
};

export default LoginTab;
