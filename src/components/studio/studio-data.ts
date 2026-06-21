import type { ComponentType } from 'react';
import type { StemOption, StudioCompositionResult } from '@/types/studio';
import { IconBass, IconDrums, IconGuitar, IconPiano, type IconProps } from './studio-icons';

export const STUDIO_GENRES = [
  { id: 'Pop', labelKey: 'studio.genrePop', subKey: 'studio.genrePopSub' },
  { id: 'R&B / Soul', labelKey: 'studio.genreRnB', subKey: 'studio.genreRnBSub' },
  { id: 'Hip-hop / Trap', labelKey: 'studio.genreHipHop', subKey: 'studio.genreHipHopSub' },
  { id: 'Lo-fi / Electrónica', labelKey: 'studio.genreLofi', subKey: 'studio.genreLofiSub' },
  { id: 'Rock / Indie', labelKey: 'studio.genreRock', subKey: 'studio.genreRockSub' },
  { id: 'Jazz / Bossa', labelKey: 'studio.genreJazz', subKey: 'studio.genreJazzSub' },
  { id: 'Reggaeton / Urbano', labelKey: 'studio.genreUrbano', subKey: 'studio.genreUrbanoSub' },
  { id: 'Clásico / Instrumental', labelKey: 'studio.genreClassical', subKey: 'studio.genreClassicalSub' },
] as const;

export const STUDIO_STEMS: (StemOption & { Icon: ComponentType<IconProps> })[] = [
  { stem: 'guitar', label: 'Guitarra', Icon: IconGuitar },
  { stem: 'piano', label: 'Piano', Icon: IconPiano },
  { stem: 'bass', label: 'Bajo', Icon: IconBass },
  { stem: 'drums', label: 'Batería', Icon: IconDrums },
];

export const STUDIO_PLACEHOLDER_KEYS: Record<string, string> = {
  guitar: 'studio.placeholderGuitar',
  piano: 'studio.placeholderPiano',
  bass: 'studio.placeholderBass',
  drums: 'studio.placeholderDrums',
  default: 'studio.placeholderDefault',
};

export const MOCK_STUDIO_RESULT: StudioCompositionResult = {
  titulo: 'Luces de verano',
  estructura: [
    { parte: 'Intro', descripcion: 'Guitarra acústica suave, ambiente cálido' },
    { parte: 'Verso 1', descripcion: 'Ritmo mid-tempo, bajo presente' },
    { parte: 'Coro', descripcion: 'Gancho melódico, energía ascendente' },
    { parte: 'Outro', descripcion: 'Fade con arpegios de guitarra' },
  ],
  letra: `[INTRO]\n(Luz que entra por la ventana...)\n\n[VERSO 1]\nCamino lento entre la multitud,\nbuscando un sitio donde respirar.\n\n[CORO]\nY si el mundo se apaga hoy,\ntu voz me vuelve a encender.`,
  suno_prompt: 'Indie pop, warm acoustic guitar, soft male vocal, mid-tempo, summer night vibe, emotional chorus',
};
