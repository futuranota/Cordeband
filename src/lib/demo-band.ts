import type { InstrumentKey } from '@/lib/data';

export type BandMember = {
  id: string;
  name: string;
  instrument: InstrumentKey;
  active: boolean;
  playing: boolean;
  isLeader?: boolean;
};

export const DEMO_BAND_MEMBERS: BandMember[] = [
  { id: 'm1', name: 'Mariana', instrument: 'vocals', active: true, playing: false },
  { id: 'm2', name: 'Diego', instrument: 'drums', active: true, playing: false },
  { id: 'm3', name: 'Sofía', instrument: 'bass', active: true, playing: false },
  { id: 'm4', name: 'Carlos', instrument: 'piano', active: true, playing: false },
  { id: 'leader', name: 'Tú', instrument: 'guitar', active: true, playing: false, isLeader: true },
];

export function membersWithPlaying(
  members: BandMember[],
  activeInstruments: InstrumentKey[],
): BandMember[] {
  return members.map((m) => ({
    ...m,
    playing: activeInstruments.includes(m.instrument),
  }));
}
