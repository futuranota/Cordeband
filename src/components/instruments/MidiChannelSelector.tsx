'use client';

import { useT } from '@/i18n/context';
import type { ChannelSelectionResult } from '@/lib/midi/parse-midi-to-notes';

type Props = {
  detection: ChannelSelectionResult;
  selectedChannel: number | null;
  onChannelSelect: (channelIndex: number) => void;
  disabled?: boolean;
};

export function MidiChannelSelector({
  detection,
  selectedChannel,
  onChannelSelect,
  disabled,
}: Props) {
  const { t } = useT();

  if (!detection.isAmbiguous || detection.allTracks.length === 0) {
    return null;
  }

  const tracksWithNotes = detection.allTracks.filter((t) => t.noteCount > 0);

  if (tracksWithNotes.length <= 1) {
    return null;
  }

  return (
    <div className="card" style={{ marginBottom: 24, padding: 20, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
      <label className="field-label">
        {t('up.channelSelectorLabel')}
      </label>
      <p className="muted" style={{ fontSize: 13, margin: '4px 0 12px' }}>
        {t('up.channelSelectorHint')}
      </p>

      <div className="channel-selector-grid" style={{ display: 'grid', gap: 8 }}>
        {tracksWithNotes.map((track) => (
          <button
            key={track.index}
            type="button"
            className={`channel-button${selectedChannel === track.index ? ' selected' : ''}`}
            disabled={disabled}
            onClick={() => onChannelSelect(track.index)}
            style={{
              padding: '12px 16px',
              border: selectedChannel === track.index ? '2px solid var(--acc)' : '1px solid var(--line)',
              borderRadius: '6px',
              background: selectedChannel === track.index ? 'var(--elev-1)' : 'transparent',
              cursor: disabled ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {t('up.channel')} {track.index + 1}
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  {track.noteCount} {t('up.notes')} • {t('up.range')}: {track.range}
                </div>
              </div>
              {selectedChannel === track.index && (
                <div style={{ color: 'var(--acc)', fontWeight: 600 }}>✓</div>
              )}
            </div>
          </button>
        ))}
      </div>

      <p className="muted" style={{ fontSize: 13, margin: '12px 0 0' }}>
        {t('up.channelSelectorInfo')}
      </p>
    </div>
  );
}
