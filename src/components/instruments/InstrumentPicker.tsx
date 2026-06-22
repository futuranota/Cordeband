'use client';

import { INSTRUMENTS, INST_ORDER, type InstrumentKey } from '@/lib/data';
import { instrumentQualityLabelKey } from '@/lib/score-quality';
import { useT } from '@/i18n/context';

type Props = {
  value: InstrumentKey[];
  onChange: (next: InstrumentKey[]) => void;
  disabled?: boolean;
  labelKey?: string;
  hintKey?: string;
  error?: string | null;
  showKlangPlaceholder?: boolean;
};

export function InstrumentPicker({
  value,
  onChange,
  disabled,
  labelKey = 'up.instrumentsLabel',
  hintKey = 'up.instrumentsHint',
  error,
  showKlangPlaceholder = true,
}: Props) {
  const { t } = useT();
  const selected = new Set(value);

  function toggle(key: InstrumentKey) {
    if (disabled) return;
    if (selected.has(key)) {
      if (value.length <= 1) return;
      onChange(value.filter((k) => k !== key));
      return;
    }
    onChange([...value, key]);
  }

  return (
    <div className="instrument-picker" style={{ gridColumn: '1 / -1' }}>
      <label className="field-label">{t(labelKey)} *</label>
      <p className="muted" style={{ fontSize: 13, margin: '4px 0 12px' }}>{t(hintKey)}</p>
      <div className="instrument-picker-grid" role="group" aria-label={t(labelKey)}>
        {INST_ORDER.map((k) => {
          const Icon = INSTRUMENTS[k].Icon;
          const on = selected.has(k);
          const qualityKey = instrumentQualityLabelKey(k);
          return (
            <div key={k} className={`instrument-picker-item${on ? ' on' : ''}`}>
              <button
                type="button"
                className={`detected-inst-chip instrument-picker-chip${on ? ' on' : ''}`}
                aria-pressed={on}
                disabled={disabled}
                onClick={() => toggle(k)}
              >
                <Icon size={18} sw={1.5} />
                <span className="instrument-picker-item-label">{t(`inst.${k}`)}</span>
              </button>
              <span className={`instrument-quality-tag quality-${k}`}>{t(qualityKey)}</span>
              {showKlangPlaceholder && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm instrument-klang-btn"
                  disabled
                  title={t('scoreQuality.klangHint')}
                >
                  {t('scoreQuality.klangCta')}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="instrument-ai-disclaimer muted">{t('up.aiDisclaimer')}</p>
      {error && (
        <p style={{ color: '#ef4444', fontSize: 13, margin: '10px 0 0' }}>{error}</p>
      )}
    </div>
  );
}
