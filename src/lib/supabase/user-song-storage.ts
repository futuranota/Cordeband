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

export function userPendingMidiPath(songId: string): string {
  return `songs/${songId}/pending-midi.mid`;
}

export async function uploadPendingMidi(path: string, buffer: ArrayBuffer): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).upload(path, Buffer.from(buffer), {
    contentType: 'audio/midi',
    upsert: true,
  });
  if (error) throw error;
}

export async function downloadPendingMidi(path: string): Promise<ArrayBuffer> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !data) throw error ?? new Error('Pending MIDI not found');
  return data.arrayBuffer();
}

export async function createUserOriginalUploadUrl(path: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw error ?? new Error('Signed upload URL failed');
  return data;
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

export async function uploadStemWav(path: string, wavBuffer: Buffer): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).upload(path, wavBuffer, {
    contentType: 'audio/wav',
    upsert: true,
  });
  if (error) throw error;
}

export async function removeUserStorageFiles(paths: string[]) {
  if (!paths.length) return;
  const admin = createAdminClient();
  await admin.storage.from(BUCKET).remove(paths);
}
