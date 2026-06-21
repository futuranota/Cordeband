'use client';

import { useCallback, useEffect, useState } from 'react';
import { useT } from '@/i18n/context';
import { ClassicLoader } from '@/components/ui/ClassicLoader';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { IconEdit, IconExternal, IconPlus, IconTrash } from '@/components/ui/icons';
import type { LocalBusiness } from '@/types/database';

type BusinessFormState = {
  name: string;
  description: string;
  address: string;
  city: string;
  postal_code: string;
  maps_url: string;
  sort_order: string;
  active: boolean;
};

const EMPTY_FORM: BusinessFormState = {
  name: '',
  description: '',
  address: '',
  city: '',
  postal_code: '',
  maps_url: '',
  sort_order: '0',
  active: true,
};

export function BusinessAdminPanel() {
  const { t } = useT();
  const [businesses, setBusinesses] = useState<LocalBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editBusiness, setEditBusiness] = useState<LocalBusiness | null>(null);
  const [form, setForm] = useState<BusinessFormState>(EMPTY_FORM);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [removeBanner, setRemoveBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/businesses');
      if (!res.ok) return;
      const data = await res.json();
      setBusinesses(data.businesses ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBusinesses();
  }, [loadBusinesses]);

  function openCreate() {
    setEditBusiness(null);
    setForm(EMPTY_FORM);
    setBannerFile(null);
    setBannerPreview(null);
    setRemoveBanner(false);
    setError(null);
    setShowForm(true);
  }

  function openEdit(business: LocalBusiness) {
    setEditBusiness(business);
    setForm({
      name: business.name,
      description: business.description ?? '',
      address: business.address,
      city: business.city,
      postal_code: business.postal_code ?? '',
      maps_url: business.maps_url ?? '',
      sort_order: String(business.sort_order),
      active: business.active,
    });
    setBannerFile(null);
    setBannerPreview(business.banner_url);
    setRemoveBanner(false);
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditBusiness(null);
    setBannerFile(null);
    setBannerPreview(null);
    setRemoveBanner(false);
    setError(null);
  }

  function onBannerChange(file: File | null) {
    setBannerFile(file);
    setRemoveBanner(false);
    if (file) {
      setBannerPreview(URL.createObjectURL(file));
    } else if (editBusiness?.banner_url) {
      setBannerPreview(editBusiness.banner_url);
    } else {
      setBannerPreview(null);
    }
  }

  async function saveBusiness() {
    setSaving(true);
    setError(null);
    try {
      const body = new FormData();
      body.set('name', form.name.trim());
      body.set('description', form.description.trim());
      body.set('address', form.address.trim());
      body.set('city', form.city.trim());
      body.set('postal_code', form.postal_code.trim());
      body.set('maps_url', form.maps_url.trim());
      body.set('sort_order', form.sort_order);
      body.set('active', form.active ? 'true' : 'false');
      if (bannerFile) body.set('banner', bannerFile);
      if (removeBanner) body.set('remove_banner', 'true');

      const url = editBusiness
        ? `/api/admin/businesses/${editBusiness.id}`
        : '/api/admin/businesses';
      const method = editBusiness ? 'PATCH' : 'POST';

      const res = await fetch(url, { method, body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t('admin.biz.saveError'));
        return;
      }

      const saved = data.business as LocalBusiness;
      setBusinesses((prev) => {
        const next = prev.filter((b) => b.id !== saved.id);
        return [saved, ...next].sort((a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at));
      });
      closeForm();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(business: LocalBusiness) {
    setBusyId(business.id);
    try {
      const res = await fetch(`/api/admin/businesses/${business.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !business.active }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setBusinesses((prev) => prev.map((b) => (b.id === business.id ? data.business : b)));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteBusiness(id: string) {
    if (!window.confirm(t('admin.biz.deleteConfirm'))) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      setBusinesses((prev) => prev.filter((b) => b.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 className="h3">{t('admin.biz.title')}</h2>
          <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>{t('admin.biz.sub')}</p>
        </div>
        <button className="btn btn-primary btn-sm" style={{ gap: 6 }} onClick={openCreate}>
          <IconPlus size={14} />{t('admin.biz.add')}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="field-label">{t('admin.biz.name')}</label>
              <input
                className="input"
                placeholder={t('admin.biz.namePh')}
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="field-label">{t('admin.biz.city')}</label>
              <input
                className="input"
                placeholder={t('admin.biz.cityPh')}
                value={form.city}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">{t('admin.biz.address')}</label>
              <input
                className="input"
                placeholder={t('admin.biz.addressPh')}
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div>
              <label className="field-label">{t('admin.biz.postal')}</label>
              <input
                className="input"
                placeholder={t('admin.biz.postalPh')}
                value={form.postal_code}
                onChange={(e) => setForm((prev) => ({ ...prev, postal_code: e.target.value }))}
              />
            </div>
            <div>
              <label className="field-label">{t('admin.biz.mapsUrl')}</label>
              <input
                className="input"
                placeholder={t('admin.biz.mapsUrlPh')}
                value={form.maps_url}
                onChange={(e) => setForm((prev) => ({ ...prev, maps_url: e.target.value }))}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">{t('admin.biz.description')}</label>
              <textarea
                className="input"
                rows={3}
                placeholder={t('admin.biz.descriptionPh')}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div>
              <label className="field-label">{t('admin.biz.banner')}</label>
              <input
                className="input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => onBannerChange(e.target.files?.[0] ?? null)}
              />
              {bannerPreview && (
                <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bannerPreview} alt="" style={{ width: 120, height: 72, objectFit: 'cover', borderRadius: 8 }} />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setBannerFile(null);
                      setBannerPreview(null);
                      setRemoveBanner(true);
                    }}
                  >
                    {t('admin.biz.removeBanner')}
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="field-label">{t('admin.biz.sortOrder')}</label>
              <input
                className="input"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
              />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
            />
            {t('admin.biz.active')}
          </label>
          {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <LoadingButton variant="default" size="sm" loading={saving} onClick={() => void saveBusiness()}>
              {editBusiness ? t('admin.saveEdit') : t('admin.save')}
            </LoadingButton>
            <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm}>{t('admin.cancel')}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loader-center"><ClassicLoader /></div>
      ) : businesses.length === 0 ? (
        <p className="muted">{t('admin.biz.empty')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {businesses.map((biz) => (
            <div key={biz.id} className="card" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
              {biz.banner_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={biz.banner_url} alt="" style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 8 }} />
              ) : (
                <div style={{ width: 72, height: 48, borderRadius: 8, background: 'var(--elev-3)' }} />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{biz.name}</p>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>
                  {biz.city}{biz.postal_code ? ` · ${biz.postal_code}` : ''} · {biz.address}
                </p>
              </div>
              {biz.maps_url && (
                <a href={biz.maps_url} target="_blank" rel="noopener noreferrer" className="iconbtn" aria-label={t('admin.biz.openMaps')}>
                  <IconExternal size={15} />
                </a>
              )}
              <span className={`pill ${biz.active ? 'pill-ink' : ''}`} style={{ fontSize: 11 }}>
                {biz.active ? t('admin.live') : t('admin.preview')}
              </span>
              <button className="iconbtn" onClick={() => openEdit(biz)}>
                <IconEdit size={15} />
              </button>
              <LoadingButton
                variant="outline"
                size="icon"
                loading={busyId === biz.id}
                onClick={() => void toggleActive(biz)}
              >
                <span style={{ fontSize: 11, fontWeight: 700 }}>{biz.active ? 'OFF' : 'ON'}</span>
              </LoadingButton>
              <LoadingButton
                variant="outline"
                size="icon"
                loading={busyId === biz.id}
                onClick={() => void deleteBusiness(biz.id)}
              >
                <IconTrash size={15} />
              </LoadingButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
