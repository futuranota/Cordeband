'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useT } from '@/i18n/context';
import { IconArrow, IconArrowL } from '@/components/ui/icons';
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
      const origin = window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
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
          <div className="auth-form" style={{ textAlign: 'center' }}>
            <span className="eyebrow">{t('auth.resetEmailSent')}</span>
            <h1 className="h2" style={{ marginTop: 14 }}>{t('auth.resetEmailSent')}</h1>
            <p className="lead" style={{ fontSize: 15, marginTop: 12 }}>{t('auth.resetEmailSentSub')}</p>
            <p className="muted" style={{ marginTop: 16, fontSize: 14 }}>{email}</p>
            <Link href="/login" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 28 }}>
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
          <Link href="/login" className="btn btn-ghost btn-sm" style={{ marginBottom: 20, alignSelf: 'flex-start' }}>
            <IconArrowL size={15} /> {t('auth.backToLogin')}
          </Link>

          <span className="eyebrow">{t('auth.forgotPassword')}</span>
          <h1 className="h2" style={{ marginTop: 14 }}>{t('auth.forgotTitle')}</h1>
          <p className="lead" style={{ fontSize: 15, marginTop: 12, marginBottom: 26 }}>{t('auth.forgotSub')}</p>

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

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={!valid || loading}
            style={{ marginTop: 8 }}
          >
            {loading ? '…' : t('auth.sendResetLink')} <IconArrow size={17} />
          </button>
        </form>
      </div>
    </main>
  );
}
