import { isAdminUser } from '@/lib/admin-auth';
import { dispatchSongProcessing } from '@/lib/audio-processor';
import { includedSongQuota } from '@/lib/plans';
import { normalizeInstrumentKeys } from '@/lib/parse-instruments';
import { createAdminClient } from '@/lib/supabase/admin';
import { getProfile, normalizePlan } from '@/lib/supabase/profile';
import { createClient } from '@/lib/supabase/server';
import {
  createUserOriginalUploadUrl,
  MAX_UPLOAD_BYTES,
  userOriginalPath,
} from '@/lib/supabase/user-song-storage';
import {
  mapUserSongRowToSong,
  USER_SONG_SELECT,
  type UserSongRow,
} from '@/lib/supabase/user-songs';
import type { InstrumentKey } from '@/lib/data';
import type { SupabaseClient } from '@supabase/supabase-js';

const AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac'];

export type UserSongUploadInput = {
  fileName: string;
  fileSize: number;
  contentType: string;
  title?: string;
  artist?: string;
  instruments: InstrumentKey[];
};

function pickGlyph(title: string): string {
  const glyphs = ['♪', '♫', '♬', '♩'];
  return glyphs[title.charCodeAt(0) % glyphs.length];
}

function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  return base || 'Sin título';
}

export function validateUserSongUploadInput(input: UserSongUploadInput): string | null {
  if (!input.fileName.trim()) return 'Audio file is required';
  if (input.fileSize <= 0) return 'Audio file is required';
  if (input.fileSize > MAX_UPLOAD_BYTES) return 'File exceeds 50 MB limit';
  if (
    input.contentType
    && !AUDIO_TYPES.includes(input.contentType)
    && !input.fileName.match(/\.(mp3|wav|flac)$/i)
  ) {
    return 'Unsupported audio format';
  }
  if (!input.instruments.length) return 'At least one instrument is required';
  return null;
}

async function assertSongQuota(
  supabase: SupabaseClient,
  userId: string,
  isAdmin: boolean,
  plan: ReturnType<typeof normalizePlan>,
): Promise<string | null> {
  if (isAdmin) return null;

  const limit = includedSongQuota(plan);
  const { count, error: countErr } = await supabase
    .from('songs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('source_type', 'upload')
    .neq('status', 'failed');

  if (countErr) return countErr.message;
  if ((count ?? 0) >= limit) return 'Song limit reached for your plan';
  return null;
}

export async function createUserSongUploadSession(input: UserSongUploadInput) {
  const validationError = validateUserSongUploadInput(input);
  if (validationError) {
    return { error: validationError, status: 400 as const };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized', status: 401 as const };
  }

  const profile = await getProfile(supabase, user.id);
  const plan = normalizePlan(profile?.plan);
  const isAdmin = isAdminUser(user.id);
  const quotaError = await assertSongQuota(supabase, user.id, isAdmin, plan);
  if (quotaError) {
    return { error: quotaError, status: 403 as const };
  }

  const title = input.title?.trim() || titleFromFileName(input.fileName);
  const artist = input.artist?.trim() ?? '';
  const admin = createAdminClient();

  const { data: song, error: insertErr } = await admin
    .from('songs')
    .insert({
      user_id: user.id,
      title,
      artist,
      glyph: pickGlyph(title),
      source_type: 'upload',
      status: 'pending',
      is_featured: false,
      is_public: false,
      stems_expires_at: null,
      added_this_month: false,
      instruments: input.instruments,
    })
    .select(USER_SONG_SELECT)
    .single();

  if (insertErr || !song) {
    return { error: insertErr?.message ?? 'Insert failed', status: 500 as const };
  }

  const songId = song.id as string;
  const storagePath = userOriginalPath(songId, input.fileName);

  const { error: pathErr } = await admin
    .from('songs')
    .update({ storage_path: storagePath })
    .eq('id', songId);

  if (pathErr) {
    await admin.from('songs').delete().eq('id', songId);
    return { error: pathErr.message, status: 500 as const };
  }

  try {
    const upload = await createUserOriginalUploadUrl(storagePath);
    const { data: refreshed } = await admin
      .from('songs')
      .select(USER_SONG_SELECT)
      .eq('id', songId)
      .single();

    return {
      song: mapUserSongRowToSong((refreshed ?? song) as UserSongRow),
      upload: {
        ...upload,
        contentType: input.contentType || 'audio/mpeg',
      },
    };
  } catch (err) {
    await admin.from('songs').delete().eq('id', songId);
    const message = err instanceof Error ? err.message : 'Upload URL failed';
    return { error: message, status: 500 as const };
  }
}

export async function finalizeUserSongUpload(songId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized', status: 401 as const };
  }

  const { data: song, error: songErr } = await supabase
    .from('songs')
    .select('id, user_id, status, storage_path')
    .eq('id', songId)
    .single();

  if (songErr || !song) {
    return { error: 'Not found', status: 404 as const };
  }
  if (song.user_id !== user.id) {
    return { error: 'Forbidden', status: 403 as const };
  }
  if (song.status !== 'pending') {
    return { error: 'Upload already finalized', status: 409 as const };
  }

  const admin = createAdminClient();
  const storagePath = song.storage_path;
  if (!storagePath) {
    return { error: 'Missing storage path', status: 400 as const };
  }

  const { error: statErr } = await admin.storage.from('stems').download(storagePath);
  if (statErr) {
    return { error: 'Audio file not found in storage', status: 400 as const };
  }

  await admin.from('songs').update({ status: 'processing' }).eq('id', songId);

  const { data: job, error: jobErr } = await admin
    .from('processing_jobs')
    .insert({ song_id: songId, status: 'queued', progress_pct: 0 })
    .select('id, song_id, status, progress_pct, error_message')
    .single();

  if (jobErr || !job) {
    return { error: jobErr?.message ?? 'Job create failed', status: 500 as const };
  }

  try {
    await dispatchSongProcessing(songId, storagePath, job.id);
  } catch (dispatchErr) {
    const message = dispatchErr instanceof Error ? dispatchErr.message : 'Processor dispatch failed';
    await admin.from('processing_jobs').update({
      status: 'failed',
      error_message: message,
      completed_at: new Date().toISOString(),
    }).eq('id', job.id);
    await admin.from('songs').update({ status: 'failed' }).eq('id', songId);
    return { error: message, status: 502 as const };
  }

  const { data: refreshed } = await admin
    .from('songs')
    .select(USER_SONG_SELECT)
    .eq('id', songId)
    .single();

  return {
    song: mapUserSongRowToSong(refreshed as UserSongRow),
    job,
  };
}

export function parseUserSongUploadJson(body: unknown): UserSongUploadInput | null {
  if (!body || typeof body !== 'object') return null;
  const raw = body as Record<string, unknown>;
  const fileName = typeof raw.fileName === 'string' ? raw.fileName : '';
  const fileSize = typeof raw.fileSize === 'number' ? raw.fileSize : Number(raw.fileSize);
  const contentType = typeof raw.contentType === 'string' ? raw.contentType : 'audio/mpeg';
  const title = typeof raw.title === 'string' ? raw.title : undefined;
  const artist = typeof raw.artist === 'string' ? raw.artist : undefined;
  const instruments = normalizeInstrumentKeys(raw.instruments);
  if (!Number.isFinite(fileSize)) return null;
  return { fileName, fileSize, contentType, title, artist, instruments };
}
