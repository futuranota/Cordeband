'use client';

import { IconClock, IconPlay, IconSpark } from '@/components/ui/icons';
import { INSTRUMENTS } from '@/lib/data';
import { fmtTime } from '@/lib/data';
import type { BandTurnOverlayResolved } from '@/lib/band-turn-overlay';

type BandTurnOverlayProps = {
  state: BandTurnOverlayResolved;
};

function HighlightAvatar({ name, prominent }: { name: string; prominent?: boolean }) {
  const initial = name[0]?.toUpperCase() ?? '?';
  return (
    <span className={`band-turn-avatar${prominent ? ' prominent' : ''}`} aria-hidden>
      {initial}
    </span>
  );
}

export function BandTurnOverlay({ state }: BandTurnOverlayProps) {
  const { variant, title, subtitle, countdownSecs, yourTime, highlightName, otherMember } = state;
  const prominent = state.kind === 'your_live' || state.kind === 'other_live' || state.kind === 'your_ready';
  const showAvatar = highlightName && prominent;

  if (variant === 'live') {
    const OtherIcon = otherMember ? INSTRUMENTS[otherMember.instrument].Icon : null;
    return (
      <div
        className={`band-turn-overlay turn-banner live${prominent ? ' band-turn-overlay--prominent' : ''}`}
        role="status"
        aria-live="polite"
      >
        {showAvatar && <HighlightAvatar name={highlightName} prominent />}
        <div className="turn-dot">
          {state.kind === 'your_live' ? (
            <span className="eq"><i /><i /><i /><i /></span>
          ) : (
            <IconPlay size={16} />
          )}
        </div>
        <div className="turn-main">
          <div className="turn-title">{title}</div>
          {subtitle && <div className="turn-sub">{subtitle}</div>}
          {otherMember && OtherIcon && (
            <div className="band-turn-inst row gap-6">
              <OtherIcon size={14} sw={1.5} />
              <span>{otherMember.name}</span>
            </div>
          )}
        </div>
        {state.kind === 'your_live' && yourTime != null && (
          <div style={{ textAlign: 'right' }}>
            <div className="turn-count">{fmtTime(yourTime)}</div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'ready') {
    return (
      <div
        className={`band-turn-overlay turn-banner ready${prominent ? ' band-turn-overlay--prominent' : ''}`}
        role="status"
        aria-live="polite"
      >
        {showAvatar && <HighlightAvatar name={highlightName} prominent />}
        <div className="turn-dot"><IconSpark size={22} /></div>
        <div className="turn-main">
          <div className="turn-title">{title}</div>
          {subtitle && <div className="turn-sub">{subtitle}</div>}
        </div>
        {countdownSecs != null && (
          <div className="turn-count turn-count-lg">{countdownSecs}</div>
        )}
      </div>
    );
  }

  if (variant === 'ended') {
    return (
      <div className="band-turn-overlay turn-banner waiting ended" role="status" aria-live="polite">
        <div className="turn-main">
          <div className="turn-title">{title}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`band-turn-overlay turn-banner${variant === 'waiting' ? ' waiting' : ' neutral'}`}
      role="status"
      aria-live="polite"
    >
      <div className="turn-dot"><IconClock size={19} /></div>
      <div className="turn-main">
        <div className="turn-title">{title}</div>
        {subtitle && <div className="turn-sub">{subtitle}</div>}
      </div>
    </div>
  );
}
