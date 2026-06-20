'use client';

import { useCallback, useEffect, useState } from 'react';
import { useT } from '@/i18n/context';
import { Logo } from '@/components/layout/Logo';
import { FeaturedSongForm } from '@/components/admin/FeaturedSongForm';
import { FunnelTable } from '@/components/admin/FunnelTable';
import { BusinessAdminPanel } from '@/components/admin/BusinessAdminPanel';
import { createClient } from '@/lib/supabase/client';
import {
  loadAdminAffiliates, saveAdminAffiliates,
  type AffiliateProduct, type Song,
} from '@/lib/data';
import { IconEdit, IconTrash, IconPlus, IconEye, IconEyeOff, IconExternal } from '@/components/ui/icons';
import { ClassicLoader } from '@/components/ui/ClassicLoader';
import { LoadingButton } from '@/components/ui/LoadingButton';

type Tab = 'aff' | 'feat' | 'funnel' | 'biz';

function statusLabel(status: string | undefined, t: (k: string) => string): string {
  switch (status) {
    case 'ready': return t('admin.statusReady');
    case 'processing': return t('admin.statusProcessing');
    case 'failed': return t('admin.statusFailed');
    default: return t('admin.statusPending');
  }
}

export function AdminScreen() {
  const { t } = useT();
  const supabase = createClient();

  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [featBusyId, setFeatBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('aff');

  /* Affiliates state */
  const [affs, setAffs] = useState<AffiliateProduct[]>(() =>
    typeof window !== 'undefined' ? loadAdminAffiliates() : [],
  );
  const [showAffForm, setShowAffForm] = useState(false);
  const [editAff, setEditAff] = useState<AffiliateProduct | null>(null);
  const [affForm, setAffForm] = useState({ title: '', price: '', url: '', platform: '', instrument: 'all', image: '' });

  /* Featured state */
  const [feats, setFeats] = useState<Song[]>([]);
  const [featsLoading, setFeatsLoading] = useState(false);
  const [showFeatForm, setShowFeatForm] = useState(false);

  const verifyAdminSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAuthed(false);
        return;
      }
      const res = await fetch('/api/admin/featured-songs');
      if (res.ok) {
        setAuthed(true);
        return;
      }
      // Session exists but is not the admin account — clear it so the login form works.
      await supabase.auth.signOut();
      setAuthed(false);
      setErr(t('admin.notAdmin'));
    } catch {
      setAuthed(false);
      setErr(t('admin.notAdmin'));
    } finally {
      setAuthChecked(true);
    }
  }, [supabase.auth, t]);

  const loadFeaturedSongs = useCallback(async () => {
    setFeatsLoading(true);
    try {
      const res = await fetch('/api/admin/featured-songs');
      if (!res.ok) return;
      const data = await res.json();
      setFeats(data.songs ?? []);
    } finally {
      setFeatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void verifyAdminSession();
  }, [verifyAdminSession]);

  useEffect(() => {
    if (authed && tab === 'feat') void loadFeaturedSongs();
  }, [authed, tab, loadFeaturedSongs]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });
      if (error) {
        setErr(t('admin.wrong'));
        return;
      }
      const res = await fetch('/api/admin/featured-songs');
      if (!res.ok) {
        await supabase.auth.signOut();
        setAuthed(false);
        setErr(t('admin.notAdmin'));
        return;
      }
      setAuthed(true);
    } finally {
      setLoginLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setAuthed(false);
  }

  function saveAff() {
    const id = editAff?.id ?? `a${Date.now()}`;
    const item: AffiliateProduct = { ...affForm, id, active: true };
    const next = editAff
      ? affs.map((a) => (a.id === editAff.id ? item : a))
      : [...affs, item];
    setAffs(next);
    saveAdminAffiliates(next);
    setShowAffForm(false);
    setEditAff(null);
    setAffForm({ title: '', price: '', url: '', platform: '', instrument: 'all', image: '' });
  }

  function toggleAff(id: string) {
    const next = affs.map((a) => (a.id === id ? { ...a, active: !a.active } : a));
    setAffs(next);
    saveAdminAffiliates(next);
  }

  function deleteAff(id: string) {
    const next = affs.filter((a) => a.id !== id);
    setAffs(next);
    saveAdminAffiliates(next);
  }

  async function toggleFeatPublish(song: Song) {
    setFeatBusyId(song.id);
    try {
      const res = await fetch(`/api/admin/featured-songs/${song.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !song.published }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setFeats((prev) => prev.map((f) => (f.id === song.id ? data.song : f)));
    } finally {
      setFeatBusyId(null);
    }
  }

  async function deleteFeat(id: string) {
    if (!window.confirm(t('admin.featDeleteConfirm'))) return;
    setFeatBusyId(id);
    try {
      const res = await fetch(`/api/admin/featured-songs/${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      setFeats((prev) => prev.filter((f) => f.id !== id));
    } finally {
      setFeatBusyId(null);
    }
  }

  if (!authChecked) {
    return (
      <div className="loader-center" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <ClassicLoader />
      </div>
    );
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
              <input className="input" type="email" placeholder={t('admin.emailPh')} value={email} onChange={(e) => { setEmail(e.target.value); setErr(null); }} />
            </div>
            <div>
              <label className="field-label">{t('admin.pass')}</label>
              <div className="pwfield">
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder={t('admin.passPh')}
                  value={pass}
                  onChange={(e) => { setPass(e.target.value); setErr(null); }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pwtoggle"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? t('admin.hidePass') : t('admin.showPass')}
                >
                  {showPass ? <IconEyeOff size={17} /> : <IconEye size={17} />}
                </button>
              </div>
            </div>
            {err && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{err}</p>}
            <LoadingButton className="btn btn-primary btn-block" type="submit" loading={loginLoading}>
              {t('admin.login')}
            </LoadingButton>
          </form>
        </div>
      </div>
    );
  }

  /* ── Admin panel ─────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav className="nav">
        <div className="nav-inner">
          <Logo />
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('admin.brand')}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <a
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ gap: 6 }}
            >
              {t('admin.openMusic')} <IconExternal size={14} />
            </a>
            <a
              href="/upload"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
            >
              {t('admin.openUpload')}
            </a>
            <button className="btn btn-ghost btn-sm" onClick={logout}>{t('admin.logout')}</button>
          </div>
        </div>
      </nav>

      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 16 }}>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>{t('admin.openMusicSub')}</p>
      </div>

      <div className="wrap" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {(['aff', 'feat', 'funnel', 'biz'] as Tab[]).map((t2) => (
            <button
              key={t2}
              onClick={() => setTab(t2)}
              className={`btn btn-sm ${tab === t2 ? 'btn-primary' : 'btn-ghost'}`}
            >
              {t2 === 'aff'
                ? t('admin.tabAff')
                : t2 === 'feat'
                  ? t('admin.tabFeat')
                  : t2 === 'funnel'
                    ? t('admin.tabFunnel')
                    : t('admin.tabBiz')}
            </button>
          ))}
        </div>

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

            {showAffForm && (
              <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { key: 'title', label: t('admin.fTitle'), ph: t('admin.fTitlePh') },
                    { key: 'price', label: t('admin.fPrice'), ph: t('admin.fPricePh') },
                    { key: 'url', label: t('admin.fUrl'), ph: t('admin.fUrlPh') },
                    { key: 'platform', label: t('admin.fPlatform'), ph: t('admin.fPlatformPh') },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="field-label">{f.label}</label>
                      <input
                        className="input"
                        placeholder={f.ph}
                        value={(affForm as Record<string, string>)[f.key]}
                        onChange={(e) => setAffForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="field-label">{t('admin.fInstrument')}</label>
                    <select
                      className="input"
                      value={affForm.instrument}
                      onChange={(e) => setAffForm((prev) => ({ ...prev, instrument: e.target.value }))}
                    >
                      <option value="all">{t('admin.all')}</option>
                      {['guitar', 'piano', 'bass', 'drums', 'vocals', 'other'].map((k) => (
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
                {affs.map((a) => (
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

        {tab === 'funnel' && <FunnelTable />}

        {tab === 'biz' && <BusinessAdminPanel />}

        {tab === 'feat' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 className="h3">{t('admin.featTitle')}</h2>
                <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>{t('admin.featSub')}</p>
              </div>
              <button className="btn btn-primary btn-sm" style={{ gap: 6 }} onClick={() => setShowFeatForm(true)}>
                <IconPlus size={14} />{t('admin.featAdd')}
              </button>
            </div>

            {showFeatForm && (
              <FeaturedSongForm
                onSaved={(song) => {
                  setShowFeatForm(false);
                  setFeats((prev) => [song, ...prev.filter((f) => f.id !== song.id)]);
                }}
                onCancel={() => setShowFeatForm(false)}
              />
            )}

            {featsLoading ? (
              <div className="loader-center"><ClassicLoader /></div>
            ) : feats.length === 0 ? (
              <p className="muted">{t('admin.featEmpty')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feats.map((f) => (
                  <div key={f.id} className="card" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
                    {f.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.coverUrl} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <span style={{ fontSize: 22, width: 48, textAlign: 'center' }}>{f.glyph}</span>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
                        {f.title}
                        {f.isAiGenerated && (
                          <span className="pill" style={{ marginLeft: 8, fontSize: 10 }}>{t('admin.aiGenerated')}</span>
                        )}
                      </p>
                      <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>
                        {f.artist || '—'} · {statusLabel(f.status, t)}
                        {f.status === 'ready' && f.bpm ? ` · ${f.bpm} BPM` : ''}
                      </p>
                    </div>
                    <span className={`pill ${f.published ? 'pill-ink' : ''}`} style={{ fontSize: 11 }}>
                      {f.published ? t('admin.published') : t('admin.hidden')}
                    </span>
                    <LoadingButton
                      className="btn btn-ghost btn-sm"
                      loading={featBusyId === f.id}
                      disabled={f.status !== 'ready'}
                      onClick={() => void toggleFeatPublish(f)}
                    >
                      {f.published ? t('admin.hide') : t('admin.publish')}
                    </LoadingButton>
                    <LoadingButton
                      className="iconbtn"
                      loading={featBusyId === f.id}
                      loaderSize="sm"
                      onClick={() => void deleteFeat(f.id)}
                      aria-label={t('admin.featDeleteConfirm')}
                    >
                      <IconTrash size={15} />
                    </LoadingButton>
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
