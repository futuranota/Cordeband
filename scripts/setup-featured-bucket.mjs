/**
 * Create the Supabase Storage bucket for featured catalog uploads.
 *
 * Usage: node scripts/setup-featured-bucket.mjs
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local');
  const raw = readFileSync(path, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = 'featured';

const { data: buckets, error: listErr } = await admin.storage.listBuckets();
if (listErr) {
  console.error('listBuckets failed:', listErr.message);
  process.exit(1);
}

const exists = buckets.some((b) => b.name === BUCKET || b.id === BUCKET);

if (exists) {
  console.log(`Bucket "${BUCKET}" already exists.`);
} else {
  const { error } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 52_428_800,
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'audio/flac',
      'audio/x-flac',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
  });
  if (error) {
    console.error('createBucket failed:', error.message);
    process.exit(1);
  }
  console.log(`Created public bucket "${BUCKET}".`);
}

console.log('Done. Paths: audio/{songId}.{ext}  covers/{songId}.{ext}');
