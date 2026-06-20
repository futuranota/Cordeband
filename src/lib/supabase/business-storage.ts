import { createAdminClient } from '@/lib/supabase/admin';
import { extFromName } from '@/lib/supabase/featured-storage';

const BUCKET = 'featured';
const PREFIX = 'business-banners/';

export function getBusinessBannerPublicUrl(path: string): string {
  const admin = createAdminClient();
  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadBusinessBanner(
  businessId: string,
  file: Blob,
  fileName: string,
  contentType: string,
): Promise<{ path: string; url: string }> {
  const admin = createAdminClient();
  const ext = extFromName(fileName, 'jpg');
  const path = `${PREFIX}${businessId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  return { path, url: getBusinessBannerPublicUrl(path) };
}

export async function removeBusinessBanner(path: string | null | undefined) {
  if (!path) return;
  const admin = createAdminClient();
  await admin.storage.from(BUCKET).remove([path]);
}

export function bannerPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
