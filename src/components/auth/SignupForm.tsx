'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/i18n/context';
import { IconCheck, IconEye, IconEyeOff, IconArrow, IconArrowL, IconNote } from '@/components/ui/icons';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { createClient } from '@/lib/supabase/client';
import { getProfile, getPostAuthRedirect, shouldRedirectToProfilePending } from '@/lib/supabase/profile';
import {
  parsePlanParam,
  isPaidPlan,
  PLAN_PRICE,
  type PlanId,
} from '@/lib/plans';

type Mode = 'signup' | 'login';
type SignupStep = 1 | 2;

function planBadgeLabel(t: (k: string) => string, plan: PlanId): string {
  if (plan === 'pro') return `${t('auth.planBadgePro')} · ${PLAN_PRICE.pro}${t('common.perMonth')}`;
  if (plan === 'banda') return `${t('auth.planBadgeBanda')} · ${PLAN_PRICE.banda}${t('common.perMonth')}`;
  return t('auth.planBadgeFree');
}

function planAsideTitle(t: (k: string) => string, tList: (k: string) => string[], plan: PlanId) {
  if (plan === 'pro') return { title: t('auth.asideTitlePro'), bullets: tList('auth.proFeat') };
  if (plan === 'banda') return { title: t('auth.asideTitleBanda'), bullets: tList('auth.bandaFeat') };
  return {
    title: t('auth.asideTitle'),
    bullets: [t('auth.a1'), t('auth.a2'), t('auth.a3'), t('auth.a4')],
  };
}

function submitLabel(t: (k: string) => string, isLogin: boolean, plan: PlanId): string {
  if (isLogin) return t('nav.login');
  if (plan === 'pro') return t('auth.createPro');
  if (plan === 'banda') return t('auth.createBanda');
  return t('auth.create');
}

function stepLabel(t: (k: string) => string, step: number, total: number): string {
  return t('auth.stepIndicator').replace('{step}', String(step)).replace('{total}', String(total));
}

export function SignupForm({ mode }: { mode: Mode }) {
  const { t, tList } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLogin = mode === 'login';
  const selectedPlan = isLogin ? 'free' : parsePlanParam(searchParams.get('plan'));

  const [signupStep, setSignupStep] = useState<SignupStep>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const minPassLen = 6;
  const passValid = pass.length >= minPassLen;
  const confirmValid = isLogin || (confirmPass.length >= minPassLen && pass === confirmPass);
  const valid = (isLogin || name.trim().length > 1) && /\S+@\S+\.\S+/.test(email) && passValid && confirmValid;
  const locationValid = city.trim().length >= 2 && postalCode.trim().length >= 3;
  const aside = planAsideTitle(t, tList, selectedPlan);
  const supabase = createClient();
  const onLocationStep = !isLogin && signupStep === 2;

  async function redirectAfterSession() {
    localStorage.removeItem('cordeband_state_v1');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/dashboard');
      return;
    }
    const profile = await getProfile(supabase, user.id);
    router.push(getPostAuthRedirect(profile));
    router.refresh();
  }

  async function handleOAuth(provider: 'google') {
    setError('');
    setOauthLoading(true);
    const origin = window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(false);
    }
  }

  async function performSignUp() {
    setLoading(true);
    setError('');

    try {
      const origin = window.location.origin;
      const metadata: Record<string, string | null> = {
        full_name: name.trim(),
        intended_plan: isPaidPlan(selectedPlan) ? selectedPlan : null,
        city: city.trim(),
        postal_code: postalCode.trim(),
        address_line: null,
      };

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: metadata,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      localStorage.removeItem('cordeband_state_v1');

      if (data.session) {
        await redirectAfterSession();
        return;
      }

      setEmailSent(true);
    } catch {
      setError(t('auth.authError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleUseLocation() {
    if (!navigator.geolocation) {
      setError(t('auth.locationError'));
      return;
    }

    setGeoLoading(true);
    setError('');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 15000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;
      const res = await fetch(
        `/api/geocode/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
      );

      if (!res.ok) {
        setError(t('auth.locationError'));
        return;
      }

      const data = (await res.json()) as {
        city?: string | null;
        postalCode?: string | null;
      };

      if (data.city) setCity(data.city);
      if (data.postalCode) setPostalCode(data.postalCode);

      if (!data.city && !data.postalCode) {
        setError(t('auth.locationError'));
      }
    } catch (err) {
      const geoErr = err as GeolocationPositionError;
      if (geoErr?.code === 1) {
        setError(t('auth.locationDenied'));
      } else {
        setError(t('auth.locationError'));
      }
    } finally {
      setGeoLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || loading) return;

    if (isLogin) {
      setLoading(true);
      setError('');
      try {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (loginError) {
          setError(loginError.message);
          return;
        }
        await redirectAfterSession();
      } catch {
        setError(t('auth.authError'));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (signupStep === 1) {
      if (!isLogin && pass !== confirmPass) {
        setError(t('auth.passMismatch'));
        return;
      }
      setSignupStep(2);
      setError('');
      return;
    }

    if (!locationValid) {
      setError(t('auth.locationRequired'));
      return;
    }

    await performSignUp();
  }

  if (emailSent) {
    return (
      <main className="wrap app-main page">
        <div className="auth-wrap auth-wrap-single">
          <div className="auth-form auth-form-status">
            <span className="eyebrow">{t('auth.checkEmailEyebrow')}</span>
            <h1 className="h2">{t('auth.checkEmail')}</h1>
            <p className="lead">{t('auth.checkEmailSub')}</p>
            <p className="muted auth-email-display">{email}</p>
            <p className="muted auth-spam-hint">{t('auth.checkEmailSpam')}</p>
            <Link href="/login" className="btn btn-primary btn-block btn-lg auth-status-cta">
              {t('nav.login')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="wrap app-main page">
      <div className={`auth-wrap${isLogin ? ' auth-wrap-single' : ''}`}>
        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <p className="auth-step-indicator">{stepLabel(t, signupStep, 2)}</p>
          )}

          {onLocationStep ? (
            <>
              <button
                type="button"
                className="btn btn-ghost btn-sm auth-back-btn"
                onClick={() => { setSignupStep(1); setError(''); }}
              >
                <IconArrowL size={15} /> {t('auth.locationBack')}
              </button>

              <span className="eyebrow">{t('auth.locationEyebrow')}</span>
              <h1 className="h2">{t('auth.locationTitle')}</h1>
              <p className="lead">{t('auth.locationSub')}</p>
              <p className="muted auth-location-privacy">{t('auth.locationPrivacy')}</p>

              <LoadingButton
                type="button"
                variant="outline"
                className="w-full"
                loading={geoLoading}
                disabled={loading}
                onClick={() => void handleUseLocation()}
                style={{ marginBottom: 16 }}
              >
                {t('auth.useLocation')}
              </LoadingButton>

              <div className="auth-field">
                <label className="field-label required">{t('auth.city')}</label>
                <input
                  className="input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('auth.cityPh')}
                  autoComplete="address-level2"
                  required
                  aria-required="true"
                />
              </div>

              <div className="auth-field">
                <label className="field-label required">{t('auth.postalCode')}</label>
                <input
                  className="input"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder={t('auth.postalCodePh')}
                  autoComplete="postal-code"
                  required
                  aria-required="true"
                />
              </div>
            </>
          ) : (
            <>
              <span className="eyebrow">{isLogin ? t('nav.login') : t('auth.eyebrow')}</span>
              <h1 className="h2">{isLogin ? t('nav.login') : t('auth.title')}</h1>
              <p className="lead">{t('auth.sub')}</p>

              {!isLogin && isPaidPlan(selectedPlan) && (
                <div className="auth-plan-badge auth-plan-badge-inline">
                  {planBadgeLabel(t, selectedPlan)}
                </div>
              )}

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
                    aria-label={showPass ? t('auth.hidePass') : t('auth.showPass')}
                  >
                    {showPass ? <IconEyeOff size={17} /> : <IconEye size={17} />}
                  </button>
                </div>
                {isLogin && (
                  <Link href="/forgot-password" className="auth-link auth-forgot-link">
                    {t('auth.forgotPassword')}
                  </Link>
                )}
              </div>

              {!isLogin && (
                <div className="auth-field">
                  <label className="field-label">{t('auth.confirmPass')}</label>
                  <div className="pwfield">
                    <input
                      className="input"
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder={t('auth.confirmPassPh')}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="pwtoggle"
                      onClick={() => setShowConfirmPass((s) => !s)}
                      aria-label={showConfirmPass ? t('auth.hidePass') : t('auth.showPass')}
                    >
                      {showConfirmPass ? <IconEyeOff size={17} /> : <IconEye size={17} />}
                    </button>
                  </div>
                </div>
              )}

              {!isLogin && pass.length >= 1 && confirmPass.length >= 1 && pass !== confirmPass && (
                <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{t('auth.passMismatch')}</p>
              )}
            </>
          )}

          {error && (
            <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{error}</p>
          )}

          {onLocationStep ? (
            <div className="auth-location-actions">
              <LoadingButton
                type="submit"
                variant="default"
                size="lg"
                className="w-full"
                loading={loading}
                disabled={!locationValid}
              >
                {submitLabel(t, false, selectedPlan)} <IconArrow size={17} />
              </LoadingButton>
            </div>
          ) : (
            <>
              <LoadingButton
                type="submit"
                variant="default"
                size="lg"
                className="w-full"
                loading={loading}
                disabled={!valid}
                style={{ marginTop: 8 }}
              >
                {isLogin ? submitLabel(t, true, selectedPlan) : t('auth.continueSignup')}{' '}
                <IconArrow size={17} />
              </LoadingButton>

              {!isLogin && (
                <>
                  <div className="auth-sep">{t('auth.or')}</div>
                  <div className="auth-oauth">
                    <LoadingButton
                      type="button"
                      variant="outline"
                      className="w-full"
                      loading={oauthLoading}
                      disabled={loading || oauthLoading}
                      onClick={() => handleOAuth('google')}
                    >
                      {t('auth.google')}
                    </LoadingButton>
                  </div>
                </>
              )}

              <div className="auth-foot">
                <span>{t('auth.have')} </span>
                <Link href={isLogin ? '/signup' : '/login'} className="auth-link">
                  {isLogin ? t('nav.start') : t('auth.loginLink')}
                </Link>
              </div>
              <p className="muted auth-terms">{t('auth.terms')}</p>
            </>
          )}
        </form>

        {!isLogin && (
          <aside className={`auth-aside${isPaidPlan(selectedPlan) ? ' auth-aside-paid' : ''}`}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              {isPaidPlan(selectedPlan) && (
                <span className="auth-plan-badge">{planBadgeLabel(t, selectedPlan)}</span>
              )}
              <span className="logo-mark" style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgb(255, 255, 255)', display: 'inline-grid' }}>
                <IconNote size={24} sw={1.7} />
              </span>
              <h2 className="h2" style={{ marginTop: 20, fontSize: 26 }}>{aside.title}</h2>
            </div>
            <ul className="auth-aside-list">
              {aside.bullets.map((x, i) => (
                <li key={i}><IconCheck size={18} sw={2.2} /> {x}</li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </main>
  );
}
