'use client';

import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/i18n/context';
import {
  resolveBandTurnOverlay,
  type BandTurnOverlayInput,
  type BandTurnOverlayResolved,
} from '@/lib/band-turn-overlay';
import type { InstrumentKey } from '@/lib/data';

export function useBandTurnOverlay(
  input: BandTurnOverlayInput,
): BandTurnOverlayResolved {
  const { t } = useT();
  const [nowMs, setNowMs] = useState(() => Date.now());

  const shouldTick =
    input.room.status === 'playing' && input.room.playStartedAt != null;

  useEffect(() => {
    if (!shouldTick) return;
    const id = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, [shouldTick, input.room.playStartedAt]);

  return useMemo(() => {
    return resolveBandTurnOverlay({ ...input, nowMs }, {
      lobbyTitle: t('bandOverlay.lobbyTitle'),
      preRoll: t('bandOverlay.preRoll'),
      yourTurn: t('bandOverlay.yourTurn'),
      yourReady: t('bandOverlay.yourReady'),
      yourWaiting: t('bandOverlay.yourWaiting'),
      otherPlaying: t('bandOverlay.otherPlaying'),
      rest: t('bandOverlay.rest'),
      ended: t('bandOverlay.ended'),
      watching: t('bandOverlay.watching'),
      youSubLive: t('bandOverlay.youSubLive'),
      youSubReady: t('bandOverlay.youSubReady'),
      inst: (key: InstrumentKey) => t(`inst.${key}`),
    });
  }, [
    t,
    input.room.status,
    input.room.playStartedAt,
    input.room.leaderName,
    input.playback.playing,
    input.playback.curBeat,
    input.playback.totalBeats,
    input.playback.bpm,
    input.playback.tempo,
    input.playback.yourTime,
    input.viewer.name,
    input.viewer.instrument,
    input.members,
    input.presentInstruments,
    input.leadBeats,
    input.preRollSecs,
    nowMs,
    input.scheduleFractions,
  ]);
}
