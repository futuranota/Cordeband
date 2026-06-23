export type OriginalSignedUrl = {
  signedUrl: string;
  expiresAt: string;
};

export async function fetchSongOriginal(songId: string): Promise<OriginalSignedUrl | null> {
  const res = await fetch(`/api/songs/${songId}/original`);
  if (!res.ok) return null;
  return (await res.json()) as OriginalSignedUrl;
}
