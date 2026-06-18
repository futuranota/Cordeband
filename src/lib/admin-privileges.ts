import { isAdminUser } from '@/lib/admin-auth';
import { includedSongQuota, type PlanId } from '@/lib/plans';

/** Plan efectivo en la app de música para la cuenta admin. */
export const ADMIN_EFFECTIVE_PLAN: PlanId = 'banda';

export function getEffectivePlan(
  userId: string | undefined | null,
  plan: PlanId,
): PlanId {
  if (isAdminUser(userId)) return ADMIN_EFFECTIVE_PLAN;
  return plan;
}

export function hasUnlimitedSongQuota(userId: string | undefined | null): boolean {
  return isAdminUser(userId);
}

export function effectiveSongQuota(
  userId: string | undefined | null,
  plan: PlanId,
): number {
  if (hasUnlimitedSongQuota(userId)) return Number.POSITIVE_INFINITY;
  return includedSongQuota(plan);
}
