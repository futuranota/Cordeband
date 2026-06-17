'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { IconCheck, IconVolume, IconMute, IconArrow, IconNote } from '@/components/ui/icons';

type Mode = 'signup' | 'login';

export function SignupForm({ mode }: { mode: Mode }) {
  const { t } = useT();
  const router = useRouter();
  const isLogin = mode === 'login';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const valid = (isLogin || name.trim().length > 1) && /\S+@\S+\.\S+/.test(email) && pass.length >= 6;

  function completeAuth() {
    localStorage.setItem('cordeband_state_v1', JSON.stringify({
      user: { name: name || email.split('@')[0], email },
      plan: 'free',
      lang: 'es',
    }));
    router.push('/dashboard');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setTimeout(completeAuth, 800);
  }

  return (
    <main className="wrap app-main page">
      <div className="auth-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <span className="eyebrow">{isLogin ? t('nav.login') : t('auth.eyebrow')}</span>
          <h1 className="h2" style={{ marginTop: 14 }}>{isLogin ? t('nav.login') : t('auth.title')}</h1>
          <p className="lead" style={{ fontSize: 15, marginTop: 12, marginBottom: 26 }}>{t('auth.sub')}</p>

          {!isLogin && (
            <div className="auth-field">
              <label className="field-label">{t('auth.name')}</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('auth.namePh')}
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label className="field-label">{t('auth.email')}</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPh')}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="field-label">{t('auth.pass')}</label>
            <div className="pwfield">
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder={t('auth.passPh')}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
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

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={!valid || loading}
            style={{ marginTop: 8 }}
          >
            {loading ? '…' : isLogin ? t('nav.login') : t('auth.create')} <IconArrow size={17} />
          </button>

          <div className="auth-sep">{t('auth.or')}</div>
          <div className="auth-oauth">
            <button type="button" className="btn btn-ghost btn-block" onClick={completeAuth}>{t('auth.google')}</button>
            <button type="button" className="btn btn-ghost btn-block" onClick={completeAuth}>{t('auth.apple')}</button>
          </div>

          <div className="auth-foot">
            <span>{t('auth.have')} </span>
            <Link href={isLogin ? '/signup' : '/login'} className="auth-link">
              {isLogin ? t('nav.start') : t('auth.loginLink')}
            </Link>
          </div>
          <p className="muted" style={{ fontSize: 11.5, marginTop: 16, lineHeight: 1.5 }}>{t('auth.terms')}</p>
        </form>

        <aside className="auth-aside">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span className="logo-mark" style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgb(255, 255, 255)' }}>
              <IconNote size={24} sw={1.7} />
            </span>
            <h2 className="h2" style={{ marginTop: 20, fontSize: 26 }}>{t('auth.asideTitle')}</h2>
          </div>
          <ul className="auth-aside-list">
            {[t('auth.a1'), t('auth.a2'), t('auth.a3'), t('auth.a4')].map((x, i) => (
              <li key={i}><IconCheck size={18} sw={2.2} /> {x}</li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
