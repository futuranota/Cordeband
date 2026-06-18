import { runMockUserProcessor } from '@/lib/mock-audio-processor';

export async function dispatchSongProcessing(
  songId: string,
  storagePath: string,
  jobId: string,
): Promise<void> {
  const baseUrl = process.env.AUDIO_PROCESSOR_URL?.trim();
  if (baseUrl) {
    const apiKey = process.env.AUDIO_PROCESSOR_API_KEY?.trim();
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        song_id: songId,
        storage_path: storagePath,
        job_id: jobId,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Audio processor HTTP ${res.status}`);
    }
    return;
  }

  void runMockUserProcessor(songId, jobId).catch(() => {
    /* errors persisted on job row */
  });
}
