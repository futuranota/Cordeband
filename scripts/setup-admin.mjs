/**
 * One-time admin setup: create/update Supabase Auth user and print UUID for ADMIN_USER_ID.
 *
 * Usage:
 *   ADMIN_SETUP_EMAIL=you@example.com ADMIN_SETUP_PASSWORD='secret' node scripts/setup-admin.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
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

const email = process.env.ADMIN_SETUP_EMAIL?.trim();
const password = process.env.ADMIN_SETUP_PASSWORD;

if (!email || !password) {
  console.error('Set ADMIN_SETUP_EMAIL and ADMIN_SETUP_PASSWORD');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId = null;

const { data: listed, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (listErr) {
  console.error('listUsers failed:', listErr.message);
  process.exit(1);
}

const existing = listed.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

if (existing) {
  const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  if (error) {
    console.error('updateUser failed:', error.message);
    process.exit(1);
  }
  userId = data.user.id;
  console.log('Updated existing user:', email);
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error('createUser failed:', error.message);
    process.exit(1);
  }
  userId = data.user.id;
  console.log('Created new user:', email);
}

console.log('ADMIN_USER_ID=', userId);

const envPath = resolve(process.cwd(), '.env.local');
let env = readFileSync(envPath, 'utf8');
if (/^ADMIN_USER_ID=.*$/m.test(env)) {
  env = env.replace(/^ADMIN_USER_ID=.*$/m, `ADMIN_USER_ID=${userId}`);
} else {
  env += `\nADMIN_USER_ID=${userId}\n`;
}
writeFileSync(envPath, env, 'utf8');
console.log('Updated .env.local with ADMIN_USER_ID');
