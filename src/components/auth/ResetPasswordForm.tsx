'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useT } from '@/i18n/context';
import { IconArrow, IconVolume, IconMute } from '@/components/ui/icons';
import { createClient } from '@/lib/supabase/client';

export function ResetPasswordForm() {
  const { t } = useT();
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const supabase = createClient();
  const minLen = 6;
  const valid = pass.length >= minLen && pass === confirm;

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!cancelled) {
        setHasSession(!!user);
        setChecking(false);
      }
    }

    void verifySession();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;

    if (pass !== confirm) {
      setError(t('auth.passMismatch'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: pass });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      await supabase.auth.signOut();
      setDone(true);
    } catch {
      setError(t('auth.authError'));
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="wrap app-main page">
        <div className="auth-wrap auth-wrap-single">
          <div className="auth-form" style={{ textAlign: 'center' }}>
            <p className="muted">…</p>
          </div>
        </div>
      </main>
    );
  }

  if (!hasSession) {
    return (
      <main className="wrap app-main page">
        <div className="auth-wrap auth-wrap-single">
          <div className="auth-form" style={{ textAlign: 'center' }}>
            <span className="eyebrow">{t('auth.resetTitle')}</span>
            <h1 className="h2" style={{ marginTop: 14 }}>{t('auth.resetInvalid')}</h1>
            <Link href="/forgot-password" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 28 }}>
              {t('auth.forgotPassword')}
            </Link>
            <Link href="/login" className="btn btn-ghost btn-block" style={{ marginTop: 12 }}>
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="wrap app-main page">
        <div className="auth-wrap auth-wrap-single">
          <div className="auth-form" style={{ textAlign: 'center' }}>
            <span className="eyebrow">{t('auth.resetSuccess')}</span>
            <h1 className="h2" style={{ marginTop: 14 }}>{t('auth.resetSuccess')}</h1>
            <p className="lead" style={{ fontSize: 15, marginTop: 12 }}>{t('auth.resetSuccessSub')}</p>
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
          <span className="eyebrow">{t('auth.resetTitle')}</span>
          <h1 className="h2" style={{ marginTop: 14 }}>{t('auth.resetTitle')}</h1>
          <p className="lead" style={{ fontSize: 15, marginTop: 12, marginBottom: 26 }}>{t('auth.resetSub')}</p>

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
                aria-label="Mostrar contraseña"
              >
                {showPass ? <IconMute size={17} /> : <IconVolume size={17} />}
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
                aria-label="Mostrar contraseña"
              >
                {showConfirm ? <IconMute size={17} /> : <IconVolume size={17} />}
              </button>
            </div>
          </div>

          {pass.length >= 1 && confirm.length >= 1 && pass !== confirm && (
            <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{t('auth.passMismatch')}</p>
          )}

          {error && (
            <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{error}</p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={!valid || loading}
            style={{ marginTop: 8 }}
          >
            {loading ? '…' : t('auth.resetSubmit')} <IconArrow size={17} />
          </button>
        </form>
      </div>
    </main>
  );
}
