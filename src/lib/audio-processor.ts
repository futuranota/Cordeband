import { runMockFeaturedProcessor, runMockUserProcessor } from '@/lib/mock-audio-processor';
import { createAdminClient } from '@/lib/supabase/admin';

type DispatchOptions = {
  featured?: boolean;
};

/** Node fetch to localhost can fail on IPv6; uvicorn binds 127.0.0.1 by default. */
function resolveProcessorBaseUrl(raw: string): string {
  return raw.replace(/\/\/localhost\b/i, '//127.0.0.1').replace(/\/$/, '');
}

function processorUnreachableMessage(cause: unknown): string {
  const devHint =
    process.env.NODE_ENV === 'development'
      ? ' Arranca el procesador: npm run dev:processor (otra terminal).'
      : '';
  const detail = cause instanceof Error ? cause.message : String(cause);
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(detail)) {
    return `No se pudo conectar al procesador de audio.${devHint}`;
  }
  return detail || 'Processor dispatch failed';
}

export async function dispatchSongProcessing(
  songId: string,
  storagePath: string,
  jobId: string,
  options: DispatchOptions = {},
): Promise<void> {
  const baseUrl = process.env.AUDIO_PROCESSOR_URL?.trim();
  if (baseUrl) {
    const admin = createAdminClient();
    const { data: song } = await admin
      .from('songs')
      .select('instruments, pending_midi_instrument')
      .eq('id', songId)
      .single();

    const apiKey = process.env.AUDIO_PROCESSOR_API_KEY?.trim();
    const url = `${resolveProcessorBaseUrl(baseUrl)}/process`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          song_id: songId,
          storage_path: storagePath,
          job_id: jobId,
          instrument_hint: song?.instruments ?? [],
          // Instrument the user already supplied a MIDI for at upload time.
          // The processor must still separate this stem, but must skip Basic Pitch
          // transcription for it — the MIDI replaces that note source entirely.
          skip_transcription_for: song?.pending_midi_instrument ?? null,
        }),
      });
    } catch (err) {
      throw new Error(processorUnreachableMessage(err));
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Audio processor HTTP ${res.status}`);
    }
    return;
  }

  const runMock = options.featured ? runMockFeaturedProcessor : runMockUserProcessor;
  void runMock(songId, jobId).catch(() => {
    /* errors persisted on job row */
  });
}
