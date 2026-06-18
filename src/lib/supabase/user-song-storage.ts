import { createAdminClient } from '@/lib/supabase/admin';
import { extFromName } from '@/lib/supabase/featured-storage';

const BUCKET = 'stems';

export const MAX_UPLOAD_BYTES = 52_428_800;

export function userOriginalPath(songId: string, fileName: string): string {
  const ext = extFromName(fileName, 'mp3');
  return `originals/${songId}.${ext}`;
}

export function userStemPath(songId: string, instrument: string): string {
  return `songs/${songId}/stems/${instrument}.wav`;
}

export async function uploadUserOriginal(
  path: string,
  file: Blob,
  contentType: string,
): Promise<void> {
  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
}

export async function removeUserStorageFiles(paths: string[]) {
  if (!paths.length) return;
  const admin = createAdminClient();
  await admin.storage.from(BUCKET).remove(paths);
}
