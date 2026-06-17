'use client';

import { useT } from '@/i18n/context';
import { useSession } from '@/contexts/SessionContext';
import { IconCrown } from '@/components/ui/icons';
import { monthlySongLimit, PLAN_PRICE, type PlanId } from '@/lib/plans';
import { normalizePlan } from '@/lib/supabase/profile';
import { LIBRARY } from '@/lib/data';

export function ProfileScreen() {
  const { t } = useT();
  const { profile } = useSession();
  const plan = normalizePlan(profile?.plan);
  const intendedPlan = profile?.intended_plan ?? null;
  const limit = monthlySongLimit(plan);
  const used = LIBRARY.filter((s) => s.addedThisMonth).length;
  const pct = Math.min(100, (used / limit) * 100);
  const showPending = plan === 'free' && (intendedPlan === 'pro' || intendedPlan === 'banda');

  const pendingLabel = intendedPlan === 'banda'
    ? `${t('auth.planBadgeBanda')} · ${PLAN_PRICE.banda}${t('common.perMonth')}`
    : `${t('auth.planBadgePro')} · ${PLAN_PRICE.pro}${t('common.perMonth')}`;

  return (
    <div className="wrap page" style={{ paddingTop: 48, paddingBottom: 80, maxWidth: 640 }}>
      {showPending && intendedPlan && (
        <div className="card" style={{ padding: 20, marginBottom: 24, borderColor: 'var(--acc-line)', background: 'var(--elev)' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--acc)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {pendingLabel}
          </p>
          <p style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 18 }}>{t('profile.pendingTitle')}</p>
          <p className="muted" style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.5 }}>{t('profile.pendingSub')}</p>
          <button type="button" className="btn btn-primary">
            {t('profile.pendingCta')}
          </button>
        </div>
      )}

      <p className="eyebrow" style={{ marginBottom: 8 }}>{t('profile.eyebrow')}</p>
      <h1 className="h2" style={{ marginBottom: 32 }}>{t('profile.title')}</h1>

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <IconCrown size={20} style={{ color: 'var(--acc)' }} />
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>{t('profile.currentPlan')}</p>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 20, color: 'var(--acc)' }}>
              {plan === 'pro' ? 'Pro' : plan === 'banda' ? t('common.banda') : t('common.free')}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{t('profile.songsMonth')}</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{used} / {limit}</span>
          </div>
          <div style={{ height: 6, background: 'var(--elev-3)', borderRadius: 3 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--acc)', borderRadius: 3 }} />
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>{t('profile.renews')}</p>
        </div>

        <a href="#" className="btn btn-primary btn-block">
          {plan === 'banda' ? t('profile.upgradeBanda') : t('profile.upgrade')}
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {[
          { label: t('profile.availSongs'), value: String(Math.max(0, limit - used)) },
          { label: t('profile.practiceMin'), value: '0' },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: 20 }}>
            <p className="muted" style={{ fontSize: 12, margin: '0 0 6px' }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, margin: 0, color: 'var(--acc)' }}>{value}</p>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--text-3)' }}>
        {t('profile.cancelSub')}
      </button>
    </div>
  );
}
