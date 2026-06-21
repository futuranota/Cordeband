'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useT } from '@/i18n/context';
import { IconArrow, IconArrowL } from '@/components/ui/icons';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { createClient } from '@/lib/supabase/client';

export function ForgotPasswordForm() {
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const valid = /\S+@\S+\.\S+/.test(email);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setError('');

    try {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? window.location.origin);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
      });
     
      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch {
      setError(t('auth.authError'));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="wrap app-main page">
        <div className="auth-wrap auth-wrap-single">
          <div className="auth-form auth-form-status">
            <span className="eyebrow">{t('auth.resetEmailEyebrow')}</span>
            <h1 className="h2">{t('auth.resetEmailSent')}</h1>
            <p className="lead">{t('auth.resetEmailSentSub')}</p>
            <p className="muted auth-email-display">{email}</p>
            <p className="muted auth-spam-hint">{t('auth.resetEmailSpam')}</p>
            <Link href="/login" className="btn btn-primary btn-block btn-lg auth-status-cta">
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="wrap app-main page">
      <div className="auth-wrap auth-wrap-single">
        <form className="auth-form" onSubmit={handleSubmit}>
          <Link href="/login" className="btn btn-ghost btn-sm auth-back-btn">
            <IconArrowL size={15} /> {t('auth.backToLogin')}
          </Link>

          <span className="eyebrow">{t('auth.forgotPassword')}</span>
          <h1 className="h2">{t('auth.forgotTitle')}</h1>
          <p className="lead">{t('auth.forgotSub')}</p>

          <div className="auth-field">
            <label className="field-label">{t('auth.email')}</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPh')}
              autoComplete="email"
              autoFocus
            />
          </div>

          {error && (
            <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{error}</p>
          )}

          <LoadingButton
            type="submit"
            variant="default"
            size="lg"
            className="w-full"
            loading={loading}
            disabled={!valid}
            style={{ marginTop: 8 }}
          >
            {t('auth.sendResetLink')} <IconArrow size={17} />
          </LoadingButton>
        </form>
      </div>
    </main>
  );
}
