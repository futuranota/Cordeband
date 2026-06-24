import { buildScoreFromNotes } from '@/lib/supabase/fetch-song-score';
import { parseMidiBufferToScoreNotes, validateMidiUpload } from '@/lib/midi/parse-midi-to-notes';
import type { InstrumentKey } from '@/lib/data';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { userPendingMidiPath, uploadPendingMidi } from '@/lib/supabase/user-song-storage';
import type { SupabaseClient } from '@supabase/supabase-js';

export type UserMidiUploadInput = {
  songId: string;
  instrument: InstrumentKey;
  fileName: string;
  fileSize: number;
  buffer: ArrayBuffer;
  channel?: number;
};

// Shared by the direct-upload path (song already ready, real bpm known) and by
// the processing pipeline finalizing a MIDI that was attached before the song's
// bpm was known (see runMockProcessor in mock-audio-processor.ts).
export async function convertAndStoreMidiNotes(
  admin: SupabaseClient,
  songId: string,
  instrument: InstrumentKey,
  buffer: ArrayBuffer,
  bpm: number,
  channel?: number,
) {
  const notes = parseMidiBufferToScoreNotes(buffer, bpm, instrument, channel);
  if (!notes.length) {
    return { error: 'No notes found in MIDI file', status: 400 as const };
  }

  const { data: stem } = await admin
    .from('stems')
    .select('id')
    .eq('song_id', songId)
    .eq('instrument_type', instrument)
    .maybeSingle();

  await admin
    .from('note_sequences')
    .delete()
    .eq('song_id', songId)
    .eq('instrument_type', instrument);

  const tabData = instrument === 'guitar' || instrument === 'bass'
    ? notes.map((n) => n.tab)
    : null;

  const { error: insertErr } = await admin
    .from('note_sequences')
    .insert({
      song_id: songId,
      stem_id: stem?.id ?? null,
      instrument_type: instrument,
      notes,
      tab_data: tabData,
      source: 'user_upload',
      confidence_avg: 1,
    });

  if (insertErr) {
    return { error: insertErr.message, status: 500 as const };
  }

  const score = buildScoreFromNotes(notes, bpm, 'user_upload');
  return { score, noteCount: notes.length };
}

export async function uploadUserMidiScore(input: UserMidiUploadInput) {
  const validationError = validateMidiUpload({ name: input.fileName, size: input.fileSize });
  if (validationError) {
    return { error: validationError, status: 400 as const };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized', status: 401 as const };
  }

  const { data: song, error: songErr } = await supabase
    .from('songs')
    .select('id, user_id, bpm, status')
    .eq('id', input.songId)
    .single();

  if (songErr || !song) {
    return { error: 'Not found', status: 404 as const };
  }
  if (song.user_id !== user.id) {
    return { error: 'Forbidden', status: 403 as const };
  }

  const admin = createAdminClient();

  // bpm isn't known yet (song still pending/processing): stash the raw file and
  // let the processing pipeline convert it once the real bpm is set, instead of
  // baking in a guessed bpm now and desyncing the score from the audio.
  if (song.status !== 'ready') {
    let path: string;
    try {
      path = userPendingMidiPath(input.songId);
      await uploadPendingMidi(path, input.buffer);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not store MIDI file';
      return { error: message, status: 500 as const };
    }

    const { error: updateErr } = await admin
      .from('songs')
      .update({
        pending_midi_path: path,
        pending_midi_instrument: input.instrument,
        midi_filename: input.fileName,
      })
      .eq('id', input.songId);

    if (updateErr) {
      return { error: updateErr.message, status: 500 as const };
    }

    return { pending: true as const, noteCount: 0 };
  }

  const bpm = Number(song.bpm) > 0 ? Number(song.bpm) : 120;

  try {
    const result = await convertAndStoreMidiNotes(admin, input.songId, input.instrument, input.buffer, bpm, input.channel);
    if ('error' in result) {
      return result;
    }

    // Store the MIDI filename
    await admin
      .from('songs')
      .update({ midi_filename: input.fileName })
      .eq('id', input.songId);

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid MIDI file';
    return { error: message, status: 400 as const };
  }
}
