import { createAdminClient } from '@/lib/supabase/admin';
import { createSilentWavBuffer } from '@/lib/audio/wav-placeholder';
import { CATALOG_INSTRUMENTS } from '@/types/catalog';
import { SCORE, type InstrumentKey } from '@/lib/data';
import { INSTRUMENT_QUALITY } from '@/lib/score-quality';
import { downloadPendingMidi, uploadStemWav, userStemPath } from '@/lib/supabase/user-song-storage';
import { convertAndStoreMidiNotes } from '@/lib/songs/user-midi-upload';

const STEMS_TTL_MS = 48 * 60 * 60 * 1000;
const CATALOG_SET = new Set<string>(CATALOG_INSTRUMENTS);

function buildNotesForInstrument(instrument: string, bpm = 84) {
  if (instrument === 'drums') {
    return [];
  }

  return SCORE.notes.map((n) => ({
    beat: n.beat,
    dur: n.dur,
    midi: n.midi,
    s: n.s,
    startTime: (n.beat * 60) / bpm,
    endTime: ((n.beat + n.dur) * 60) / bpm,
    confidence: 1,
    source: 'ai_basic_pitch',
    quality: INSTRUMENT_QUALITY[instrument as InstrumentKey] ?? 'draft',
    tab: instrument === 'guitar' || instrument === 'bass' ? n.tab : undefined,
  }));
}

const STEP_DELAYS_MS = [800, 1200, 1500, 1000];
const STEP_PROGRESS = [15, 45, 75, 95];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveInstrumentsToProcess(raw: unknown): InstrumentKey[] {
  if (!Array.isArray(raw)) return [...CATALOG_INSTRUMENTS];
  const unique: InstrumentKey[] = [];
  for (const item of raw) {
    if (typeof item !== 'string' || !CATALOG_SET.has(item)) continue;
    const key = item as InstrumentKey;
    if (!unique.includes(key)) unique.push(key);
  }
  return unique.length ? unique : [...CATALOG_INSTRUMENTS];
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

    const { data: songRow, error: songErr } = await admin
      .from('songs')
      .select('instruments, pending_midi_path, pending_midi_instrument')
      .eq('id', songId)
      .single();

    if (songErr) throw songErr;

    const toProcess = resolveInstrumentsToProcess(songRow?.instruments);

    for (let i = 0; i < STEP_DELAYS_MS.length; i++) {
      await sleep(STEP_DELAYS_MS[i]);
      await admin.from('processing_jobs').update({
        progress_pct: STEP_PROGRESS[i],
      }).eq('id', jobId);
    }

    const mockBpm = 96 + Math.floor(Math.random() * 40);
    const mockKeys = ['Do mayor', 'La menor', 'Mi mayor', 'Re menor', 'Sol mayor'];
    const keySig = mockKeys[Math.floor(Math.random() * mockKeys.length)];
    const mockDurationSecs = Math.max(
      30,
      Math.ceil((SCORE.totalBeats * 60) / mockBpm),
    );
    const placeholderWav = createSilentWavBuffer(mockDurationSecs);
    const detected: InstrumentKey[] = [];
    // User already supplied a MIDI for this instrument at upload time — Basic Pitch
    // must not transcribe it; the pending-MIDI conversion below replaces this entirely.
    const skipBasicPitchFor = songRow?.pending_midi_path ? songRow.pending_midi_instrument : null;

    for (const instrument of toProcess) {
      const storagePath = options.stemPath(songId, instrument);
      try {
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

        if (instrument !== skipBasicPitchFor) {
          const notes = buildNotesForInstrument(instrument, mockBpm);
          const { error: noteErr } = await admin.from('note_sequences').insert({
            song_id: songId,
            stem_id: stem.id,
            instrument_type: instrument,
            notes,
            tab_data: instrument === 'guitar' || instrument === 'bass'
              ? notes.map((n) => n.tab).filter(Boolean)
              : null,
            key_signature: keySig,
            source: 'ai_basic_pitch',
            confidence_avg: 1,
          });

          if (noteErr) throw noteErr;
        }
        detected.push(instrument);
      } catch {
        /* skip instruments that failed to upload */
      }
    }

    if (!detected.length) {
      throw new Error('No stems could be uploaded to storage — check the stems bucket');
    }

    await admin.from('songs').update({
      status: 'ready',
      bpm: mockBpm,
      key_signature: keySig,
      instruments: detected,
      duration_seconds: mockDurationSecs,
      stems_expires_at: options.stemsExpiresAt,
    }).eq('id', songId);

    await admin.from('processing_jobs').update({
      status: 'completed',
      progress_pct: 100,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);

    if (songRow?.pending_midi_path && songRow?.pending_midi_instrument) {
      try {
        const midiBuffer = await downloadPendingMidi(songRow.pending_midi_path);
        await convertAndStoreMidiNotes(
          admin,
          songId,
          songRow.pending_midi_instrument as InstrumentKey,
          midiBuffer,
          mockBpm,
        );
      } catch {
        /* MIDI conversion is a best-effort follow-up; the AI score remains available */
      } finally {
        await admin.from('songs').update({
          pending_midi_path: null,
          pending_midi_instrument: null,
        }).eq('id', songId);
      }
    }
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
