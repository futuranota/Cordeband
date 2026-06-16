import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number; sw?: number };

function I({ size = 20, sw = 1.6, fill, children, viewBox, ...rest }: IconProps & { children?: React.ReactNode; viewBox?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox ?? '0 0 24 24'}
      fill={fill ?? 'none'}
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ── UI Icons ──────────────────────────────────────────────── */
export const IconPlay = (p: IconProps) => <I {...p}><path d="M7 5.5 18 12 7 18.5z" fill="currentColor" stroke="none" /></I>;
export const IconPause = (p: IconProps) => <I {...p}><rect x="7" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" stroke="none" /><rect x="13.6" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" stroke="none" /></I>;
export const IconArrow = (p: IconProps) => <I {...p}><path d="M5 12h14M13 6l6 6-6 6" /></I>;
export const IconArrowL = (p: IconProps) => <I {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></I>;
export const IconCheck = (p: IconProps) => <I {...p} sw={2}><path d="M4 12.5 9 17.5 20 6.5" /></I>;
export const IconPlus = (p: IconProps) => <I {...p} sw={1.8}><path d="M12 5v14M5 12h14" /></I>;
export const IconUpload = (p: IconProps) => <I {...p}><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></I>;
export const IconSpark = (p: IconProps) => <I {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" /></I>;
export const IconSpin = (p: IconProps) => <I {...p}><path d="M12 3a9 9 0 1 0 9 9" /></I>;
export const IconExternal = (p: IconProps) => <I {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></I>;
export const IconVolume = (p: IconProps) => <I {...p}><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /></I>;
export const IconMute = (p: IconProps) => <I {...p}><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16 9.5l4 5M20 9.5l-4 5" /></I>;
export const IconLoop = (p: IconProps) => <I {...p}><path d="M4 9a5 5 0 0 1 5-5h7l-2.5-2.5M20 15a5 5 0 0 1-5 5H8l2.5 2.5" /></I>;
export const IconGauge = (p: IconProps) => <I {...p}><path d="M12 13l4-4" /><path d="M4.5 17a9 9 0 1 1 15 0" /></I>;
export const IconClock = (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></I>;
export const IconCrown = (p: IconProps) => <I {...p}><path d="M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 9h-13L4 8z" /></I>;
export const IconGrid = (p: IconProps) => <I {...p}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></I>;
export const IconClose = (p: IconProps) => <I {...p} sw={1.8}><path d="M6 6l12 12M18 6 6 18" /></I>;
export const IconMenu = (p: IconProps) => <I {...p}><path d="M4 7h16M4 12h16M4 17h16" /></I>;
export const IconNote = (p: IconProps) => <I {...p}><circle cx="7" cy="17" r="3" /><path d="M10 17V5l9-2v11" /><circle cx="16" cy="14" r="3" /></I>;
export const IconWave = (p: IconProps) => <I {...p}><path d="M3 12h2.5l2-6 3 14 3-11 2 5 2.5-2H21" /></I>;
export const IconCart = (p: IconProps) => <I {...p}><path d="M4 5h2l2 11h9l2-7H7" /><circle cx="9.5" cy="19.5" r="1.3" fill="currentColor" stroke="none" /><circle cx="16.5" cy="19.5" r="1.3" fill="currentColor" stroke="none" /></I>;
export const IconReset = (p: IconProps) => <I {...p}><path d="M4 4v5h5" /><path d="M4 9a8 8 0 1 1-1 6" /></I>;
export const IconLock = (p: IconProps) => <I {...p}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></I>;
export const IconLogout = (p: IconProps) => <I {...p}><path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" /><path d="M10 12h9M16 8l4 4-4 4" /></I>;
export const IconEdit = (p: IconProps) => <I {...p}><path d="M4 20h4l10-10a2 2 0 0 0-3-3L5 17v3z" /><path d="M13.5 6.5l3 3" /></I>;
export const IconTrash = (p: IconProps) => <I {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6" /></I>;
export const IconBand = (p: IconProps) => <I {...p}><circle cx="7" cy="17" r="3" /><circle cx="17" cy="15" r="3" /><path d="M10 17V6l10-2v9" /></I>;

/* ── Instrument Icons ──────────────────────────────────────── */
export const InstGuitar = (p: IconProps) => <I {...p} sw={1.5}><circle cx="9" cy="16" r="5" /><circle cx="9" cy="16" r="1.6" /><path d="M12.5 12.5l5.5-5.5M16.5 5l1.2-1.2a1.4 1.4 0 0 1 2 2L20.5 7M17 4.5L19.5 7" /></I>;
export const InstPiano = (p: IconProps) => <I {...p} sw={1.5}><rect x="3.5" y="6" width="17" height="12" rx="1.5" /><path d="M3.5 13h17M7.5 6v7M11 6v7M14.5 6v7M18 6v7" /></I>;
export const InstBass = (p: IconProps) => <I {...p} sw={1.5}><circle cx="8.5" cy="16" r="4.5" /><path d="M12 13l6-6M16.5 5.5l1.4-1.4a1.3 1.3 0 0 1 1.9 1.9L20.4 7.4M9 13.5V19" /></I>;
export const InstDrums = (p: IconProps) => <I {...p} sw={1.5}><ellipse cx="12" cy="9" rx="8" ry="3" /><path d="M4 9v5c0 1.6 3.6 3 8 3s8-1.4 8-3V9" /><path d="M12 12v5M8 20l4-3 4 3" /></I>;
export const InstVocals = (p: IconProps) => <I {...p} sw={1.5}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" /></I>;
export const InstOther = (p: IconProps) => <I {...p} sw={1.5}><path d="M9 18V6l9-2v10" /><circle cx="6" cy="18" r="3" /><circle cx="15" cy="14" r="3" /></I>;
