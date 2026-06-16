'use client';

import { useState } from 'react';
import { useT } from '@/i18n/context';
import { Logo } from '@/components/layout/Logo';
import {
  loadAdminAffiliates, saveAdminAffiliates, loadFeatured, saveFeatured,
  type AffiliateProduct, type Song,
} from '@/lib/data';
import { IconEdit, IconTrash, IconPlus } from '@/components/ui/icons';

const ADMIN_EMAIL = 'xapplex65@gmail.com';
const ADMIN_LS = 'cordeband_admin_v1';

type Tab = 'aff' | 'feat';

export function AdminScreen() {
  const { t } = useT();
  const [authed, setAuthed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(ADMIN_LS) === '1';
  });
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [err, setErr]     = useState(false);
  const [tab, setTab]     = useState<Tab>('aff');

  /* Affiliates state */
  const [affs, setAffs] = useState<AffiliateProduct[]>(() =>
    typeof window !== 'undefined' ? loadAdminAffiliates() : []
  );
  const [showAffForm, setShowAffForm] = useState(false);
  const [editAff, setEditAff] = useState<AffiliateProduct | null>(null);
  const [affForm, setAffForm] = useState({ title: '', price: '', url: '', platform: '', instrument: 'all', image: '' });

  /* Featured state */
  const [feats, setFeats] = useState<Song[]>(() =>
    typeof window !== 'undefined' ? loadFeatured() : []
  );

  function login(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim().toLowerCase() === ADMIN_EMAIL && pass.length >= 4) {
      localStorage.setItem(ADMIN_LS, '1');
      setAuthed(true);
    } else {
      setErr(true);
    }
  }

  function logout() {
    localStorage.removeItem(ADMIN_LS);
    setAuthed(false);
  }

  function saveAff() {
    const id = editAff?.id ?? `a${Date.now()}`;
    const item: AffiliateProduct = { ...affForm, id, active: true };
    const next = editAff
      ? affs.map(a => a.id === editAff.id ? item : a)
      : [...affs, item];
    setAffs(next);
    saveAdminAffiliates(next);
    setShowAffForm(false);
    setEditAff(null);
    setAffForm({ title: '', price: '', url: '', platform: '', instrument: 'all', image: '' });
  }

  function toggleAff(id: string) {
    const next = affs.map(a => a.id === id ? { ...a, active: !a.active } : a);
    setAffs(next); saveAdminAffiliates(next);
  }

  function deleteAff(id: string) {
    const next = affs.filter(a => a.id !== id);
    setAffs(next); saveAdminAffiliates(next);
  }

  function toggleFeat(id: string) {
    const next = feats.map(f => f.id === id ? { ...f, published: !f.published } : f);
    setFeats(next); saveFeatured(next);
  }

  /* ── Login gate ──────────────────────────────────────────── */
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
        <div className="card" style={{ padding: 40, width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <Logo />
            <p style={{ fontWeight: 700, fontSize: 18, margin: '16px 0 4px' }}>{t('admin.loginTitle')}</p>
            <p className="muted" style={{ fontSize: 14 }}>{t('admin.loginSub')}</p>
          </div>
          <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="field-label">{t('admin.email')}</label>
              <input className="input" type="email" placeholder={t('admin.emailPh')} value={email} onChange={e => { setEmail(e.target.value); setErr(false); }} />
            </div>
            <div>
              <label className="field-label">{t('admin.pass')}</label>
              <input className="input" type="password" placeholder={t('admin.passPh')} value={pass} onChange={e => { setPass(e.target.value); setErr(false); }} />
            </div>
            {err && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{t('admin.wrong')}</p>}
            <button className="btn btn-primary btn-block" type="submit">{t('admin.login')}</button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Admin panel ─────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Admin nav */}
      <nav className="nav">
        <div className="nav-inner">
          <Logo />
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('admin.brand')}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout}>{t('admin.logout')}</button>
        </div>
      </nav>

      <div className="wrap" style={{ paddingTop: 40, paddingBottom: 80 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {(['aff', 'feat'] as Tab[]).map(t2 => (
            <button
              key={t2}
              onClick={() => setTab(t2)}
              className={`btn btn-sm ${tab === t2 ? 'btn-primary' : 'btn-ghost'}`}
            >
              {t2 === 'aff' ? t('admin.tabAff') : t('admin.tabFeat')}
            </button>
          ))}
        </div>

        {/* ── Affiliates tab ─────────────────────────────────── */}
        {tab === 'aff' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 className="h3">{t('admin.title')}</h2>
                <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>{t('admin.sub')}</p>
              </div>
              <button className="btn btn-primary btn-sm" style={{ gap: 6 }} onClick={() => setShowAffForm(true)}>
                <IconPlus size={14} />{t('admin.add')}
              </button>
            </div>

            {/* Form */}
            {showAffForm && (
              <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { key: 'title', label: t('admin.fTitle'), ph: t('admin.fTitlePh') },
                    { key: 'price', label: t('admin.fPrice'), ph: t('admin.fPricePh') },
                    { key: 'url', label: t('admin.fUrl'), ph: t('admin.fUrlPh') },
                    { key: 'platform', label: t('admin.fPlatform'), ph: t('admin.fPlatformPh') },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="field-label">{f.label}</label>
                      <input
                        className="input"
                        placeholder={f.ph}
                        value={(affForm as Record<string, string>)[f.key]}
                        onChange={e => setAffForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="field-label">{t('admin.fInstrument')}</label>
                    <select
                      className="input"
                      value={affForm.instrument}
                      onChange={e => setAffForm(prev => ({ ...prev, instrument: e.target.value }))}
                    >
                      <option value="all">{t('admin.all')}</option>
                      {['guitar', 'piano', 'bass', 'drums', 'vocals', 'other'].map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button className="btn btn-primary btn-sm" onClick={saveAff}>{t('admin.save')}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setShowAffForm(false); setEditAff(null); }}>{t('admin.cancel')}</button>
                </div>
              </div>
            )}

            {affs.length === 0 ? (
              <p className="muted">{t('admin.empty')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {affs.map(a => (
                  <div key={a.id} className="card" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{a.title}</p>
                      <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>{a.price} · {a.platform} · {a.instrument}</p>
                    </div>
                    <span className={`pill ${a.active ? 'pill-ink' : ''}`} style={{ fontSize: 11 }}>
                      {a.active ? t('admin.live') : t('admin.preview')}
                    </span>
                    <button className="iconbtn" onClick={() => { setEditAff(a); setAffForm({ title: a.title, price: a.price, url: a.url, platform: a.platform, instrument: a.instrument, image: a.image ?? '' }); setShowAffForm(true); }}>
                      <IconEdit size={15} />
                    </button>
                    <button className="iconbtn" onClick={() => toggleAff(a.id)}>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{a.active ? 'OFF' : 'ON'}</span>
                    </button>
                    <button className="iconbtn" onClick={() => deleteAff(a.id)}>
                      <IconTrash size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Featured tab ───────────────────────────────────── */}
        {tab === 'feat' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 className="h3">{t('admin.featTitle')}</h2>
              <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>{t('admin.featSub')}</p>
            </div>
            {feats.length === 0 ? (
              <p className="muted">{t('admin.featEmpty')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feats.map(f => (
                  <div key={f.id} className="card" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
                    <span style={{ fontSize: 22 }}>{f.glyph}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{f.title}</p>
                      <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>{f.artist} · {f.bpm} BPM · {f.keySig}</p>
                    </div>
                    <span className={`pill ${f.published ? 'pill-ink' : ''}`} style={{ fontSize: 11 }}>
                      {f.published ? t('admin.published') : t('admin.hidden')}
                    </span>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleFeat(f.id)}>
                      {f.published ? t('admin.hide') : t('admin.publish')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
