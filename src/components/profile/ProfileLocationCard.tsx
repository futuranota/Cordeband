'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { LoadingButton } from '@/components/ui/LoadingButton';

type ProfileLocationCardProps = {
  userId: string;
  initialCity: string | null;
  initialPostalCode: string | null;
};

export function ProfileLocationCard({
  userId,
  initialCity,
  initialPostalCode,
}: ProfileLocationCardProps) {
  const { t } = useT();
  const router = useRouter();
  const supabase = createClient();

  const needsLocation = !initialCity?.trim() || !initialPostalCode?.trim();
  const [city, setCity] = useState(initialCity ?? '');
  const [postalCode, setPostalCode] = useState(initialPostalCode ?? '');
  const [geoLoading, setGeoLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!needsLocation && !saved) return null;

  const locationValid = city.trim().length >= 2 && postalCode.trim().length >= 3;

  async function useMyLocation() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    setError(null);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const res = await fetch(
        `/api/geocode/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}`,
      );
      if (!res.ok) throw new Error('geocode failed');
      const data = await res.json();
      if (data.city) setCity(data.city);
      if (data.postalCode) setPostalCode(data.postalCode);
    } catch {
      setError(t('profile.locationGeoError'));
    } finally {
      setGeoLoading(false);
    }
  }

  async function saveLocation() {
    if (!locationValid) return;
    setSaving(true);
    setError(null);
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          city: city.trim(),
          postal_code: postalCode.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateErr) {
        setError(updateErr.message);
        return;
      }

      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="card profile-section" style={{ padding: 24, marginBottom: 24 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{t('profile.locationSaved')}</p>
      </div>
    );
  }

  return (
    <div className="card profile-section" style={{ padding: 24, marginBottom: 24 }}>
      <h2 className="h3" style={{ marginBottom: 6 }}>{t('profile.locationTitle')}</h2>
      <p className="muted" style={{ fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
        {t('profile.locationSub')}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label className="field-label">{t('auth.city')}</label>
          <input
            className="input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t('auth.cityPh')}
          />
        </div>
        <div>
          <label className="field-label">{t('auth.postalCode')}</label>
          <input
            className="input"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder={t('auth.postalCodePh')}
          />
        </div>
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <LoadingButton
          className="btn btn-primary btn-sm"
          loading={saving}
          disabled={!locationValid}
          onClick={() => void saveLocation()}
        >
          {t('profile.locationSave')}
        </LoadingButton>
        <LoadingButton
          type="button"
          className="btn btn-ghost btn-sm"
          loading={geoLoading}
          onClick={() => void useMyLocation()}
        >
          {t('auth.useLocation')}
        </LoadingButton>
      </div>
    </div>
  );
}
