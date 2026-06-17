export type PlanId = 'free' | 'pro' | 'banda';

export type BillingPeriod = 'monthly' | 'annual';

/** Canciones de upload incluidas en el plan (no se renuevan cada mes). */
export const PLAN_SONG_LIMIT: Record<PlanId, number> = {
  free: 1,
  pro: 15,
  banda: 15,
};

export const PLAN_MONTHLY_USD: Record<Exclude<PlanId, 'free'>, number> = {
  pro: 12.99,
  banda: 24.99,
};

/** Descuento al pagar un año completo. */
export const ANNUAL_DISCOUNT_PERCENT = 20;

/** Precio mensual formateado (compat). */
export const PLAN_PRICE: Record<Exclude<PlanId, 'free'>, string> = {
  pro: '$12.99',
  banda: '$24.99',
};

/** Precio fijo por canción extra (add-on). */
export const ADDON_SONG_PRICE = '$5';

export type PlanPricing = {
  period: BillingPeriod;
  displayAmount: string;
  compareAmount: string | null;
  savingsAmount: string | null;
  monthlyEquivalent: string | null;
  annualTotalUsd: number;
};

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getPlanPricing(
  plan: Exclude<PlanId, 'free'>,
  period: BillingPeriod,
): PlanPricing {
  const monthly = PLAN_MONTHLY_USD[plan];
  const annualFull = roundUsd(monthly * 12);

  if (period === 'monthly') {
    return {
      period,
      displayAmount: formatUsd(monthly),
      compareAmount: null,
      savingsAmount: null,
      monthlyEquivalent: null,
      annualTotalUsd: annualFull,
    };
  }

  const annualDiscounted = roundUsd(annualFull * (1 - ANNUAL_DISCOUNT_PERCENT / 100));
  const savings = roundUsd(annualFull - annualDiscounted);
  const monthlyEq = roundUsd(annualDiscounted / 12);

  return {
    period,
    displayAmount: formatUsd(annualDiscounted),
    compareAmount: formatUsd(annualFull),
    savingsAmount: formatUsd(savings),
    monthlyEquivalent: formatUsd(monthlyEq),
    annualTotalUsd: annualDiscounted,
  };
}

export function parseBillingPeriod(raw: string | null | undefined): BillingPeriod {
  return raw === 'annual' ? 'annual' : 'monthly';
}

export const BILLING_PERIOD_LS = 'cordeband_billing_period';

export function readBillingPeriod(): BillingPeriod {
  if (typeof window === 'undefined') return 'monthly';
  return parseBillingPeriod(localStorage.getItem(BILLING_PERIOD_LS));
}

export function saveBillingPeriod(period: BillingPeriod): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BILLING_PERIOD_LS, period);
}

export function formatPlanPriceLabel(
  t: (k: string) => string,
  plan: Exclude<PlanId, 'free'>,
  period: BillingPeriod,
): string {
  const pricing = getPlanPricing(plan, period);
  const planName = plan === 'pro' ? t('auth.planBadgePro') : t('auth.planBadgeBanda');
  const per = period === 'annual' ? t('common.perYear') : t('common.perMonth');
  let label = `${planName} · ${pricing.displayAmount}${per}`;
  if (period === 'annual' && pricing.savingsAmount) {
    label += ` · ${t('price.youSave').replace('{amount}', pricing.savingsAmount)}`;
  }
  return label;
}

export function includedSongQuota(plan: PlanId): number {
  return PLAN_SONG_LIMIT[plan];
}

/** @deprecated Usar includedSongQuota — el límite ya no es mensual. */
export function monthlySongLimit(plan: PlanId): number {
  return includedSongQuota(plan);
}

/** Parse `?plan=` from signup/pricing links. */
export function parsePlanParam(raw: string | null | undefined): PlanId {
  if (raw === 'pro' || raw === 'banda') return raw;
  return 'free';
}

export function isPaidPlan(plan: PlanId): plan is Exclude<PlanId, 'free'> {
  return plan === 'pro' || plan === 'banda';
}
