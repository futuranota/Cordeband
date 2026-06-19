'use client';

import { INSTRUMENTS, INST_ORDER, type InstrumentKey } from '@/lib/data';
import { useT } from '@/i18n/context';

type Props = {
  value: InstrumentKey[];
  onChange: (next: InstrumentKey[]) => void;
  disabled?: boolean;
  labelKey?: string;
  hintKey?: string;
  error?: string | null;
};

export function InstrumentPicker({
  value,
  onChange,
  disabled,
  labelKey = 'up.instrumentsLabel',
  hintKey = 'up.instrumentsHint',
  error,
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
      <div className="detected-inst-chips" role="group" aria-label={t(labelKey)}>
        {INST_ORDER.map((k) => {
          const Icon = INSTRUMENTS[k].Icon;
          const on = selected.has(k);
          return (
            <button
              key={k}
              type="button"
              className={`detected-inst-chip instrument-picker-chip${on ? ' on' : ''}`}
              aria-pressed={on}
              disabled={disabled}
              onClick={() => toggle(k)}
            >
              <Icon size={16} sw={1.5} />
              {t(`inst.${k}`)}
            </button>
          );
        })}
      </div>
      {error && (
        <p style={{ color: '#ef4444', fontSize: 13, margin: '10px 0 0' }}>{error}</p>
      )}
    </div>
  );
}
