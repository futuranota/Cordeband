'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { IconArrow, IconEye, IconEyeOff } from '@/components/ui/icons';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { createClient } from '@/lib/supabase/client';

export function ResetPasswordForm() {
  const { t } = useT();
  const router = useRouter();
  const supabase = createClient();

  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const minLen = 6;
  const valid = pass.length >= minLen && pass === confirm;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/forgot-password');
        return;
      }
      setReady(true);
    });
  }, [router, supabase.auth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;

    if (pass !== confirm) {
      setError(t('auth.passMismatch'));
      return;
    }

    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({ password: pass });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setDone(true);
    setLoading(false);
  }

  if (!ready) {
    return (
      <main className="wrap app-main page">
        <div className="auth-wrap auth-wrap-single">
          <div className="auth-form auth-form-status">
            <p className="muted">{t('auth.resetSessionPending')}</p>
          </div>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="wrap app-main page">
        <div className="auth-wrap auth-wrap-single">
          <div className="auth-form auth-form-status">
            <span className="eyebrow">{t('auth.resetSuccess')}</span>
            <h1 className="h2">{t('auth.resetSuccess')}</h1>
            <p className="lead">{t('auth.resetSuccessSub')}</p>
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
          <span className="eyebrow">{t('auth.resetTitle')}</span>
          <h1 className="h2">{t('auth.resetTitle')}</h1>
          <p className="lead">{t('auth.resetSub')}</p>

          <div className="auth-field">
            <label className="field-label">{t('auth.newPass')}</label>
            <div className="pwfield">
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder={t('auth.passPh')}
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                className="pwtoggle"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? t('auth.hidePass') : t('auth.showPass')}
              >
                {showPass ? <IconEyeOff size={17} /> : <IconEye size={17} />}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label className="field-label">{t('auth.confirmPass')}</label>
            <div className="pwfield">
              <input
                className="input"
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t('auth.confirmPassPh')}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="pwtoggle"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? t('auth.hidePass') : t('auth.showPass')}
              >
                {showConfirm ? <IconEyeOff size={17} /> : <IconEye size={17} />}
              </button>
            </div>
          </div>

          {pass.length >= 1 && confirm.length >= 1 && pass !== confirm && (
            <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{t('auth.passMismatch')}</p>
          )}

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
            {t('auth.resetSubmit')} <IconArrow size={17} />
          </LoadingButton>
        </form>
      </div>
    </main>
  );
}
