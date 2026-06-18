'use client';

import { useT } from '@/i18n/context';
import { useSession } from '@/contexts/SessionContext';
import { getPlanLabel, type PlanId } from '@/lib/plans';
import { IconCrown, IconBand } from '@/components/ui/icons';

type ProfilePlanStripProps = {
  plan: PlanId;
  showPending?: boolean;
};

export function ProfilePlanStrip({ plan, showPending }: ProfilePlanStripProps) {
  const { t } = useT();
  const { user, profile } = useSession();

  const displayName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    user?.email?.split('@')[0] ||
    'Usuario';

  const email = user?.email ?? '';
  const ini = displayName[0]?.toUpperCase() ?? '?';

  return (
    <div className="profile-plan-strip">
      <div className="profile-plan-strip-user">
        <span className="avatar">{ini}</span>
        <div>
          <p className="profile-plan-strip-name">{displayName}</p>
          <p className="muted profile-plan-strip-email">{email}</p>
        </div>
      </div>
      <div className="profile-plan-strip-meta">
        <span className={`profile-plan-badge${plan === 'banda' ? ' band' : plan === 'pro' ? ' pro' : ' free'}`}>
          {plan === 'banda' ? <IconBand size={12} /> : plan === 'pro' ? <IconCrown size={12} /> : null}
          {getPlanLabel(plan, t)}
        </span>
        {showPending && (
          <span className="pill profile-plan-pending">{t('profile.preview')}</span>
        )}
      </div>
    </div>
  );
}
