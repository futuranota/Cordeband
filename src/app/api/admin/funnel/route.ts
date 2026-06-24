import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth-server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { FunnelRow } from '@/types/database';
import type { PlanId } from '@/lib/plans';

const VALID_PLANS: PlanId[] = ['free', 'pro', 'banda'];
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function parsePlan(value: string | null): PlanId | null {
  if (!value || value === 'all') return null;
  return VALID_PLANS.includes(value as PlanId) ? (value as PlanId) : null;
}

export async function GET(request: Request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city')?.trim() || null;
  const plan = parsePlan(searchParams.get('plan'));
  const intendedPlan = parsePlan(searchParams.get('intended_plan'));
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(searchParams.get('limit') ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT),
  );
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  let query = admin
    .from('profiles')
    .select(
      'id, email, full_name, plan, intended_plan, city, postal_code, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });

  if (city) query = query.ilike('city', `%${city}%`);
  if (plan) query = query.eq('plan', plan);
  if (intendedPlan) query = query.eq('intended_plan', intendedPlan);

  const { data, error: dbErr, count } = await query.range(offset, offset + limit - 1);

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({
    rows: (data ?? []) as FunnelRow[],
    total: count ?? 0,
    page,
    limit,
    filters: { city, plan, intended_plan: intendedPlan },
  });
}
