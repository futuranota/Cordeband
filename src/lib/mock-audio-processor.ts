import { createAdminClient } from '@/lib/supabase/admin';
import { createSilentWavBuffer } from '@/lib/audio/wav-placeholder';
import { CATALOG_INSTRUMENTS } from '@/types/catalog';
import { SCORE } from '@/lib/data';
import { uploadStemWav, userStemPath } from '@/lib/supabase/user-song-storage';

const STEMS_TTL_MS = 48 * 60 * 60 * 1000;
const PLACEHOLDER_WAV_SECS = 30;

function buildNotesForInstrument(instrument: string) {
  const notes = SCORE.notes.slice(0, 32).map((n) => ({
    beat: n.beat,
    dur: n.dur,
    midi: n.midi,
    s: n.s,
    tab: instrument === 'guitar' || instrument === 'bass' ? n.tab : undefined,
  }));
  return notes;
}

const STEP_DELAYS_MS = [800, 1200, 1500, 1000];
const STEP_PROGRESS = [15, 45, 75, 95];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type MockProcessorOptions = {
  stemPath: (songId: string, instrument: string) => string;
  stemsExpiresAt: string | null;
};

async function runMockProcessor(
  songId: string,
  jobId: string,
  options: MockProcessorOptions,
) {
  const admin = createAdminClient();

  const markFailed = async (message: string) => {
    await admin.from('processing_jobs').update({
      status: 'failed',
      error_message: message,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);
    await admin.from('songs').update({ status: 'failed' }).eq('id', songId);
  };

  try {
    await admin.from('processing_jobs').update({
      status: 'processing',
      started_at: new Date().toISOString(),
      progress_pct: 5,
    }).eq('id', jobId);

    await admin.from('songs').update({ status: 'processing' }).eq('id', songId);

    for (let i = 0; i < STEP_DELAYS_MS.length; i++) {
      await sleep(STEP_DELAYS_MS[i]);
      await admin.from('processing_jobs').update({
        progress_pct: STEP_PROGRESS[i],
      }).eq('id', jobId);
    }

    const mockBpm = 96 + Math.floor(Math.random() * 40);
    const mockKeys = ['Do mayor', 'La menor', 'Mi mayor', 'Re menor', 'Sol mayor'];
    const keySig = mockKeys[Math.floor(Math.random() * mockKeys.length)];
    const placeholderWav = createSilentWavBuffer(PLACEHOLDER_WAV_SECS);

    for (const instrument of CATALOG_INSTRUMENTS) {
      const storagePath = options.stemPath(songId, instrument);
      await uploadStemWav(storagePath, placeholderWav);

      const { data: stem, error: stemErr } = await admin
        .from('stems')
        .insert({
          song_id: songId,
          instrument_type: instrument,
          storage_url: null,
          storage_path: storagePath,
        })
        .select('id')
        .single();

      if (stemErr) throw stemErr;

      const notes = buildNotesForInstrument(instrument);
      const { error: noteErr } = await admin.from('note_sequences').insert({
        song_id: songId,
        stem_id: stem.id,
        instrument_type: instrument,
        notes,
        tab_data: instrument === 'guitar' || instrument === 'bass'
          ? notes.map((n) => n.tab).filter(Boolean)
          : null,
        key_signature: keySig,
      });

      if (noteErr) throw noteErr;
    }

    await admin.from('songs').update({
      status: 'ready',
      bpm: mockBpm,
      key_signature: keySig,
      instruments: CATALOG_INSTRUMENTS,
      duration_seconds: 210,
      stems_expires_at: options.stemsExpiresAt,
    }).eq('id', songId);

    await admin.from('processing_jobs').update({
      status: 'completed',
      progress_pct: 100,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed';
    await markFailed(message);
    throw err;
  }
}

export async function runMockFeaturedProcessor(songId: string, jobId: string) {
  return runMockProcessor(songId, jobId, {
    stemPath: (id, instrument) => `featured/stems/${id}/${instrument}.wav`,
    stemsExpiresAt: null,
  });
}

export async function runMockUserProcessor(songId: string, jobId: string) {
  const expiresAt = new Date(Date.now() + STEMS_TTL_MS).toISOString();
  return runMockProcessor(songId, jobId, {
    stemPath: userStemPath,
    stemsExpiresAt: expiresAt,
  });
}
