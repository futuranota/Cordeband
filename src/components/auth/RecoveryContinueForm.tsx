'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/i18n/context';
import { IconArrow } from '@/components/ui/icons';
import { createClient } from '@/lib/supabase/client';

export function RecoveryContinueForm() {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleContinue() {
    if (!code) {
      setError(t('auth.recoveryMissingCode'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        setError(t('auth.resetExpired'));
        return;
      }
      router.replace('/reset-password');
    } catch {
      setError(t('auth.authError'));
    } finally {
      setLoading(false);
    }
  }

  if (!code) {
    return (
      <main className="wrap app-main page">
        <div className="auth-wrap auth-wrap-single">
          <div className="auth-form auth-form-status">
            <span className="eyebrow">{t('auth.resetTitle')}</span>
            <h1 className="h2">{t('auth.recoveryMissingCode')}</h1>
            <Link href="/forgot-password" className="btn btn-primary btn-block btn-lg auth-status-cta">
              {t('auth.forgotPassword')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="wrap app-main page">
      <div className="auth-wrap auth-wrap-single">
        <div className="auth-form auth-form-status">
          <span className="eyebrow">{t('auth.resetTitle')}</span>
          <h1 className="h2">{t('auth.recoveryContinueTitle')}</h1>
          <p className="lead">{t('auth.recoveryContinueSub')}</p>

          {error && (
            <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{error}</p>
          )}

          <button
            type="button"
            className="btn btn-primary btn-block btn-lg auth-status-cta"
            disabled={loading}
            onClick={() => void handleContinue()}
          >
            {loading ? '…' : t('auth.recoveryContinueBtn')} <IconArrow size={17} />
          </button>

          <Link href="/login" className="btn btn-ghost btn-block auth-secondary-cta">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    </main>
  );
}
