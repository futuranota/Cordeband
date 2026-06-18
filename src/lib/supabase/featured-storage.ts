import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'featured';

export function getFeaturedPublicUrl(path: string): string {
  const admin = createAdminClient();
  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadFeaturedFile(
  path: string,
  file: Blob,
  contentType: string,
): Promise<string> {
  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  return getFeaturedPublicUrl(path);
}

export async function removeFeaturedFiles(paths: string[]) {
  if (!paths.length) return;
  const admin = createAdminClient();
  await admin.storage.from(BUCKET).remove(paths);
}

export function extFromName(name: string, fallback: string): string {
  const dot = name.lastIndexOf('.');
  if (dot === -1) return fallback;
  return name.slice(dot + 1).toLowerCase();
}
