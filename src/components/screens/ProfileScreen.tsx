'use client';

import { useT } from '@/i18n/context';
import { IconCrown } from '@/components/ui/icons';

export function ProfileScreen() {
  const { t } = useT();

  return (
    <div className="wrap page" style={{ paddingTop: 48, paddingBottom: 80, maxWidth: 640 }}>
      <p className="eyebrow" style={{ marginBottom: 8 }}>{t('profile.eyebrow')}</p>
      <h1 className="h2" style={{ marginBottom: 32 }}>{t('profile.title')}</h1>

      {/* Current plan */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <IconCrown size={20} style={{ color: 'var(--acc)' }} />
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>{t('profile.currentPlan')}</p>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 20, color: 'var(--acc)' }}>Gratis</p>
          </div>
        </div>

        {/* Usage meter */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{t('profile.songsMonth')}</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>0 / 1</span>
          </div>
          <div style={{ height: 6, background: 'var(--elev-3)', borderRadius: 3 }}>
            <div style={{ width: '0%', height: '100%', background: 'var(--acc)', borderRadius: 3 }} />
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>{t('profile.renews')}</p>
        </div>

        <a href="#" className="btn btn-primary btn-block">{t('profile.upgrade')}</a>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {[
          { label: t('profile.availSongs'), value: '1' },
          { label: t('profile.practiceMin'), value: '0' },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: 20 }}>
            <p className="muted" style={{ fontSize: 12, margin: '0 0 6px' }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, margin: 0, color: 'var(--acc)' }}>{value}</p>
          </div>
        ))}
      </div>

      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-3)' }}>
        {t('profile.cancelSub')}
      </button>
    </div>
  );
}
