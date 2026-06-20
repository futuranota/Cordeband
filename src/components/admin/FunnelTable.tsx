'use client';

import { useCallback, useEffect, useState } from 'react';
import { useT } from '@/i18n/context';
import { ClassicLoader } from '@/components/ui/ClassicLoader';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { getPlanLabel, type PlanId } from '@/lib/plans';
import type { FunnelRow } from '@/types/database';

type FunnelResponse = {
  rows: FunnelRow[];
  total: number;
  page: number;
  limit: number;
  filters: {
    city: string | null;
    plan: PlanId | null;
    intended_plan: PlanId | null;
  };
};

const PLAN_OPTIONS: Array<{ value: string; labelKey: string }> = [
  { value: 'all', labelKey: 'admin.funnel.allPlans' },
  { value: 'free', labelKey: 'common.free' },
  { value: 'pro', labelKey: 'common.pro' },
  { value: 'banda', labelKey: 'common.banda' },
];

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function FunnelTable() {
  const { t } = useT();
  const [city, setCity] = useState('');
  const [plan, setPlan] = useState('all');
  const [intendedPlan, setIntendedPlan] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (pageOverride?: number) => {
    setLoading(true);
    setError(null);
    const currentPage = pageOverride ?? page;
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '50' });
      if (city.trim()) params.set('city', city.trim());
      if (plan !== 'all') params.set('plan', plan);
      if (intendedPlan !== 'all') params.set('intended_plan', intendedPlan);

      const res = await fetch(`/api/admin/funnel?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? t('admin.funnel.loadError'));
        return;
      }
      setData(await res.json());
    } catch {
      setError(t('admin.funnel.loadError'));
    } finally {
      setLoading(false);
    }
  }, [city, intendedPlan, page, plan, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    void load(1);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const cityFilterActive = !!data?.filters.city;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 className="h3">{t('admin.funnel.title')}</h2>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>{t('admin.funnel.sub')}</p>
      </div>

      <form
        className="card"
        style={{ padding: 20, marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, alignItems: 'end' }}
        onSubmit={applyFilters}
      >
        <div>
          <label className="field-label">{t('admin.funnel.filterCity')}</label>
          <input
            className="input"
            placeholder={t('admin.funnel.filterCityPh')}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">{t('admin.funnel.filterPlan')}</label>
          <select className="input" value={plan} onChange={(e) => setPlan(e.target.value)}>
            {PLAN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value === 'all' ? t(opt.labelKey) : t(opt.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">{t('admin.funnel.filterIntended')}</label>
          <select className="input" value={intendedPlan} onChange={(e) => setIntendedPlan(e.target.value)}>
            {PLAN_OPTIONS.map((opt) => (
              <option key={`intended-${opt.value}`} value={opt.value}>
                {opt.value === 'all' ? t(opt.labelKey) : t(opt.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <LoadingButton className="btn btn-primary btn-sm" type="submit" loading={loading}>
          {t('admin.funnel.apply')}
        </LoadingButton>
      </form>

      {cityFilterActive && data && (
        <p className="pill pill-ink" style={{ display: 'inline-block', marginBottom: 16, fontSize: 12 }}>
          {t('admin.funnel.cityCount').replace('{count}', String(data.total)).replace('{city}', data.filters.city ?? '')}
        </p>
      )}

      {!cityFilterActive && data && (
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          {t('admin.funnel.totalCount').replace('{count}', String(data.total))}
        </p>
      )}

      {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}

      {loading && !data ? (
        <div className="loader-center"><ClassicLoader /></div>
      ) : !data?.rows.length ? (
        <p className="muted">{t('admin.funnel.empty')}</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--elev-3)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>{t('admin.funnel.colDate')}</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>{t('admin.funnel.colUser')}</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>{t('admin.funnel.colPlan')}</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>{t('admin.funnel.colIntended')}</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>{t('admin.funnel.colCity')}</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>{t('admin.funnel.colPostal')}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--elev-2)' }}>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{formatDate(row.created_at)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600 }}>{row.full_name || '—'}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{row.email}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>{getPlanLabel(row.plan, t)}</td>
                  <td style={{ padding: '12px 14px' }}>{getPlanLabel(row.intended_plan ?? 'free', t)}</td>
                  <td style={{ padding: '12px 14px' }}>{row.city || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>{row.postal_code || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t('admin.funnel.prev')}
          </button>
          <span className="muted" style={{ fontSize: 13 }}>
            {t('admin.funnel.pageOf').replace('{page}', String(page)).replace('{total}', String(totalPages))}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('admin.funnel.next')}
          </button>
        </div>
      )}
    </div>
  );
}
