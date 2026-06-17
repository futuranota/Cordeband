import { describe, expect, it } from 'vitest';
import {
  formatOverlayString,
  memberForInstrument,
  resolveBandTurnOverlay,
  type BandOverlayStrings,
} from './band-turn-overlay';
import { DEMO_BAND_MEMBERS } from './demo-band';

const strings: BandOverlayStrings = {
  lobbyTitle: 'Wait {leader}',
  preRoll: 'Go in {n}',
  yourTurn: 'Your turn, {name}',
  yourReady: 'Ready {name} {secs}',
  yourWaiting: 'Part in {time}',
  otherPlaying: '{name} — {inst}',
  rest: 'Rest',
  ended: 'Ended',
  watching: 'Watching',
  youSubLive: 'Play',
  youSubReady: 'Soon',
  inst: (k) => k,
};

const members = DEMO_BAND_MEMBERS.map((m) => ({
  id: m.id,
  name: m.name,
  instrument: m.instrument,
  isLeader: m.isLeader,
}));

const basePlayback = {
  playing: true,
  curBeat: 0,
  totalBeats: 100,
  bpm: 88,
  tempo: 1,
};

describe('formatOverlayString', () => {
  it('replaces placeholders', () => {
    expect(formatOverlayString('Hi {name}', { name: 'Ana' })).toBe('Hi Ana');
  });
});

describe('memberForInstrument', () => {
  it('finds member by instrument', () => {
    expect(memberForInstrument(members, 'drums')?.name).toBe('Diego');
  });
});

describe('resolveBandTurnOverlay', () => {
  it('returns lobby when room is waiting', () => {
    const r = resolveBandTurnOverlay(
      {
        room: { status: 'waiting', playStartedAt: null, leaderName: 'Tú' },
        members,
        viewer: { name: 'Tú', instrument: 'guitar' },
        playback: { ...basePlayback, playing: false },
        presentInstruments: ['guitar', 'drums'],
      },
      strings,
    );
    expect(r.kind).toBe('lobby');
    expect(r.title).toContain('Tú');
  });

  it('returns ended when room ended', () => {
    const r = resolveBandTurnOverlay(
      {
        room: { status: 'ended', playStartedAt: null, leaderName: 'Tú' },
        members,
        viewer: { name: 'Tú', instrument: 'guitar' },
        playback: basePlayback,
        presentInstruments: ['guitar', 'drums'],
      },
      strings,
    );
    expect(r.kind).toBe('ended');
  });

  it('returns pre_roll before play_started_at elapses', () => {
    const start = new Date('2030-01-01T00:00:00.000Z').toISOString();
    const r = resolveBandTurnOverlay(
      {
        room: { status: 'playing', playStartedAt: start, leaderName: 'Tú' },
        members,
        viewer: { name: 'Tú', instrument: 'guitar' },
        playback: basePlayback,
        presentInstruments: ['guitar', 'drums'],
        nowMs: Date.parse(start) + 500,
        preRollSecs: 3,
      },
      strings,
    );
    expect(r.kind).toBe('pre_roll');
    expect(r.countdownSecs).toBeGreaterThan(0);
  });

  it('returns your_live when viewer instrument is active', () => {
    const r = resolveBandTurnOverlay(
      {
        room: { status: 'playing', playStartedAt: null, leaderName: 'Tú' },
        members,
        viewer: { name: 'Tú', instrument: 'guitar' },
        playback: { ...basePlayback, curBeat: 10 },
        presentInstruments: ['guitar', 'drums', 'bass', 'vocals', 'piano'],
      },
      strings,
    );
    expect(r.kind).toBe('your_live');
    expect(r.variant).toBe('live');
  });

  it('returns other_live when another instrument is active', () => {
    const r = resolveBandTurnOverlay(
      {
        room: { status: 'playing', playStartedAt: null, leaderName: 'Tú' },
        members,
        viewer: { name: 'Tú', instrument: 'guitar' },
        playback: { ...basePlayback, curBeat: 58 },
        presentInstruments: ['guitar', 'drums', 'bass', 'vocals', 'piano'],
      },
      strings,
    );
    expect(r.kind).toBe('other_live');
    expect(r.otherMember?.name).toBe('Diego');
  });

  it('returns unassigned without instrument', () => {
    const r = resolveBandTurnOverlay(
      {
        room: { status: 'playing', playStartedAt: null, leaderName: 'Tú' },
        members,
        viewer: { name: 'Fan', instrument: null },
        playback: basePlayback,
        presentInstruments: ['guitar', 'drums'],
      },
      strings,
    );
    expect(r.kind).toBe('unassigned');
  });
});
