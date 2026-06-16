'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';
import { useT } from '@/i18n/context';
import { IconCheck, IconVolume, IconMute } from '@/components/ui/icons';

type Mode = 'signup' | 'login';

export function SignupForm({ mode }: { mode: Mode }) {
  const { t } = useT();
  const router = useRouter();
  const isSignup = mode === 'signup';

  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [pass, setPass]       = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const valid = isSignup
    ? name.trim().length > 1 && email.includes('@') && pass.length >= 6
    : email.includes('@') && pass.length >= 6;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    // Mock auth — replace with Supabase auth later
    setTimeout(() => {
      localStorage.setItem('cordeband_state_v1', JSON.stringify({
        user: { name: name || email.split('@')[0], email },
        plan: 'free',
        lang: 'es',
      }));
      router.push('/dashboard');
    }, 800);
  }

  const asideItems = [
    t('auth.a1'), t('auth.a2'), t('auth.a3'), t('auth.a4'),
  ];

  return (
    <div className="auth-layout">
      {/* Aside */}
      <div className="auth-aside">
        <Logo />
        <div>
          <h2 className="h2" style={{ marginBottom: 24 }}>{t('auth.asideTitle')}</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {asideItems.map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 999, flexShrink: 0, marginTop: 1,
                  background: 'var(--acc-soft)', border: '1px solid var(--acc-line)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <IconCheck size={12} style={{ color: 'var(--acc)' }} />
                </div>
                <span style={{ color: 'var(--text-2)', fontSize: 15 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>{t('foot.rights')}</p>
      </div>

      {/* Form */}
      <div className="auth-form-wrap">
        <div style={{ marginBottom: 32 }}>
          <p className="eyebrow">{t('auth.eyebrow')}</p>
          <h1 className="h2" style={{ marginTop: 10, marginBottom: 8 }}>{t('auth.title')}</h1>
          <p className="lead" style={{ fontSize: 15 }}>{t('auth.sub')}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isSignup && (
            <div>
              <label className="field-label">{t('auth.name')}</label>
              <input
                className="input"
                type="text"
                placeholder={t('auth.namePh')}
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="field-label">{t('auth.email')}</label>
            <input
              className="input"
              type="email"
              placeholder={t('auth.emailPh')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="field-label">{t('auth.pass')}</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                placeholder={t('auth.passPh')}
                value={pass}
                onChange={e => setPass(e.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                style={{ paddingRight: 48 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPass ? <IconMute size={18} /> : <IconVolume size={18} />}
              </button>
            </div>
          </div>

          <button
            className="btn btn-block btn-white"
            type="submit"
            disabled={!valid || loading}
            style={{ marginTop: 4 }}
          >
            {loading ? '…' : t('auth.create')}
          </button>
        </form>

        {/* OAuth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />
          <span className="muted" style={{ fontSize: 13 }}>{t('auth.or')}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-block" style={{ fontSize: 13 }}>
            {t('auth.google')}
          </button>
          <button className="btn btn-ghost btn-block" style={{ fontSize: 13 }}>
            {t('auth.apple')}
          </button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 20, textAlign: 'center' }}>
          {t('auth.terms')}
        </p>

        <p style={{ fontSize: 14, textAlign: 'center', marginTop: 16, color: 'var(--text-2)' }}>
          {isSignup ? t('auth.have') : 'No tienes cuenta?'}{' '}
          <Link
            href={isSignup ? '/login' : '/signup'}
            style={{ color: 'var(--acc)', fontWeight: 700, textDecoration: 'none' }}
          >
            {isSignup ? t('auth.loginLink') : t('auth.eyebrow')}
          </Link>
        </p>
      </div>
    </div>
  );
}
