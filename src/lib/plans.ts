export type PlanId = 'free' | 'pro' | 'banda';

/** Canciones procesables por mes (free = 1 de bienvenida al registrarse). */
export const PLAN_SONG_LIMIT: Record<PlanId, number> = {
  free: 1,
  pro: 15,
  banda: 15,
};

export const PLAN_PRICE: Record<Exclude<PlanId, 'free'>, string> = {
  pro: '$12.99',
  banda: '$24.99',
};

export function monthlySongLimit(plan: PlanId): number {
  return PLAN_SONG_LIMIT[plan];
}

/** Parse `?plan=` from signup/pricing links. */
export function parsePlanParam(raw: string | null | undefined): PlanId {
  if (raw === 'pro' || raw === 'banda') return raw;
  return 'free';
}

export function isPaidPlan(plan: PlanId): plan is Exclude<PlanId, 'free'> {
  return plan === 'pro' || plan === 'banda';
}
