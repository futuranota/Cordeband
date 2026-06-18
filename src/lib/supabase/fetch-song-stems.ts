import type { InstrumentKey } from '@/lib/data';

export type StemSignedUrl = {
  instrument: InstrumentKey;
  signedUrl: string;
  expiresAt: string;
};

export async function fetchSongStems(songId: string): Promise<StemSignedUrl[]> {
  const res = await fetch(`/api/songs/${songId}/stems`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Failed to load stems (${res.status})`);
  }
  const data = await res.json();
  return (data.stems ?? []) as StemSignedUrl[];
}
