import type { PlanId } from '@/lib/plans';

export type PlayerViewMode = 'solo' | 'banda';

export function canUseBandPlayer(plan: PlanId): boolean {
  return plan === 'banda';
}

export function canTogglePlayerMode(opts: { isDemo: boolean; plan: PlanId }): boolean {
  return opts.isDemo || opts.plan === 'banda';
}

export function defaultPlayerMode(opts: {
  isDemo: boolean;
  plan: PlanId;
  urlDemo: string | null | undefined;
}): PlayerViewMode {
  if (opts.isDemo) {
    return opts.urlDemo === 'banda' ? 'banda' : 'solo';
  }
  if (opts.plan === 'banda') return 'banda';
  return 'solo';
}

export function resolveBandView(opts: {
  isDemo: boolean;
  plan: PlanId;
  viewMode: PlayerViewMode;
}): boolean {
  if (!canTogglePlayerMode({ isDemo: opts.isDemo, plan: opts.plan })) return false;
  return opts.viewMode === 'banda';
}
