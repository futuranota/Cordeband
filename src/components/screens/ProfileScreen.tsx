'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { useSession } from '@/contexts/SessionContext';
import { IconCheck } from '@/components/ui/icons';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { ProfilePlanStrip } from '@/components/billing/ProfilePlanStrip';
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
  const isPaid = isPaidPlan(actualPlan);
  const showPlanPicker = actualPlan === 'free' && !!user;

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
    <div className="wrap page profile-page" style={{ paddingTop: 48, paddingBottom: 80, maxWidth: 720 }}>
      <ProfilePlanStrip plan={previewPlan} showPending={showPending} />

      <h1 className="h2 profile-page-title">{t('profile.title')}</h1>

      {showPlanPicker && (
        <section id="plans" className="profile-section profile-plans-section">
          {showPending && intendedPlan && (
            <div className="profile-pending-inline">
              <div>
                <p className="profile-pending-label">{pendingLabel}</p>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.5 }}>
                  {t('profile.pendingSub')}
                </p>
              </div>
              <LoadingButton
                type="button"
                className="btn btn-primary btn-sm"
                loading={checkoutLoading}
                onClick={completePayment}
              >
                {t('profile.pendingCta')}
              </LoadingButton>
            </div>
          )}
          <UpgradePlanCards userId={user.id} selected={intendedPlan} />
        </section>
      )}

      {isPaid && (
        <>
          <div className="card profile-section" style={{ padding: 28 }}>
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
          </div>

          <section id="addons" className="profile-section profile-addon-section">
            <AddonSongCard used={used} total={limit} />
          </section>

          {user && (
            <CancelMembershipPanel userId={user.id} plan={actualPlan} />
          )}
        </>
      )}
    </div>
  );
}
