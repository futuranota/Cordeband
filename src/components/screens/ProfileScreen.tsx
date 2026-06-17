'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { useSession } from '@/contexts/SessionContext';
import { IconCrown, IconBand, IconCheck } from '@/components/ui/icons';
import { UpgradePlanCards } from '@/components/billing/UpgradePlanCards';
import { AddonSongCard } from '@/components/billing/AddonSongCard';
import { CancelMembershipPanel } from '@/components/billing/CancelMembershipPanel';
import {
  includedSongQuota,
  PLAN_PRICE,
  isPaidPlan,
  type PlanId,
} from '@/lib/plans';
import { normalizePlan } from '@/lib/supabase/profile';
import { LIBRARY } from '@/lib/data';

function planDisplayName(plan: PlanId, t: (k: string) => string): string {
  if (plan === 'pro') return 'Pro';
  if (plan === 'banda') return t('common.banda');
  return t('common.free');
}

export function ProfileScreen() {
  const { t, tList } = useT();
  const router = useRouter();
  const { user, profile } = useSession();
  const actualPlan = normalizePlan(profile?.plan);
  const intendedPlan = profile?.intended_plan ?? null;

  const previewPlan: PlanId =
    actualPlan !== 'free'
      ? actualPlan
      : intendedPlan === 'pro' || intendedPlan === 'banda'
        ? intendedPlan
        : 'free';

  const limit = includedSongQuota(previewPlan);
  const used = profile?.songs_used_this_month ?? LIBRARY.filter((s) => s.addedThisMonth).length;
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const showPending =
    actualPlan === 'free' && (intendedPlan === 'pro' || intendedPlan === 'banda');
  const isFree = actualPlan === 'free' && !showPending;
  const isPaid = isPaidPlan(actualPlan);
  const showPaidUi = isPaid || showPending;

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const pendingLabel =
    intendedPlan === 'banda'
      ? `${t('auth.planBadgeBanda')} · ${PLAN_PRICE.banda}${t('common.perMonth')}`
      : `${t('auth.planBadgePro')} · ${PLAN_PRICE.pro}${t('common.perMonth')}`;

  async function completePayment() {
    setCheckoutLoading(true);
    setTimeout(() => {
      setCheckoutLoading(false);
      router.refresh();
    }, 800);
  }

  return (
    <div className="wrap page" style={{ paddingTop: 48, paddingBottom: 80, maxWidth: 720 }}>
      {showPending && intendedPlan && (
        <div className="card profile-pending" style={{ padding: 22, marginBottom: 24 }}>
          <p className="eyebrow" style={{ marginBottom: 6 }}>{pendingLabel}</p>
          <p style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 20 }}>{t('profile.pendingTitle')}</p>
          <p className="muted" style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.5 }}>{t('profile.pendingSub')}</p>
          <button type="button" className="btn btn-primary" disabled={checkoutLoading} onClick={completePayment}>
            {checkoutLoading ? '…' : t('profile.pendingCta')}
          </button>
        </div>
      )}

      {isFree && user && (
        <section style={{ marginBottom: 32 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}>{t('upgrade.eyebrow')}</p>
          <h2 className="h2" style={{ marginBottom: 8 }}>{t('upgrade.title')}</h2>
          <p className="muted" style={{ margin: '0 0 24px', fontSize: 15, lineHeight: 1.55 }}>{t('upgrade.sub')}</p>
          <UpgradePlanCards userId={user.id} selected={intendedPlan} />
        </section>
      )}

      <p className="eyebrow" style={{ marginBottom: 8 }}>{t('profile.eyebrow')}</p>
      <h1 className="h2" style={{ marginBottom: 28 }}>{t('profile.title')}</h1>

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span className={`profile-plan-icon${previewPlan === 'banda' ? ' band' : ''}`}>
            {previewPlan === 'banda' ? <IconBand size={20} /> : <IconCrown size={20} />}
          </span>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>{t('profile.currentPlan')}</p>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 22, color: 'var(--acc)' }}>
              {planDisplayName(previewPlan, t)}
              {showPending && (
                <span className="pill" style={{ marginLeft: 10, fontSize: 11, verticalAlign: 'middle' }}>
                  {t('profile.preview')}
                </span>
              )}
            </p>
          </div>
        </div>

        {showPaidUi ? (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{t('profile.songsIncluded')}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{used} / {limit}</span>
              </div>
              <div style={{ height: 6, background: 'var(--elev-3)', borderRadius: 3 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--acc)', borderRadius: 3 }} />
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>{t('profile.includedNote')}</p>
            </div>

            <ul className="profile-feats">
              {(tList(`auth.${previewPlan === 'banda' ? 'bandaFeat' : 'proFeat'}`)).map((f) => (
                <li key={f}><IconCheck size={14} sw={2.2} />{f}</li>
              ))}
            </ul>
          </>
        ) : (
          <div style={{ marginBottom: 8 }}>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.55, margin: '0 0 12px' }}>{t('profile.freeNote')}</p>
            <ul className="profile-feats">
              {tList('price.freeFeat').map((f) => (
                <li key={f}><IconCheck size={14} sw={2.2} />{f}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showPaidUi && (
        <div style={{ marginBottom: 20 }}>
          <AddonSongCard used={used} total={limit} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
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

      {isPaid && user && (
        <CancelMembershipPanel userId={user.id} plan={actualPlan} />
      )}
    </div>
  );
}
