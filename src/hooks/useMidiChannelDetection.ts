import { useState, useCallback } from 'react';
import { detectMidiChannels, type ChannelSelectionResult } from '@/lib/midi/parse-midi-to-notes';
import type { InstrumentKey } from '@/lib/data';

export function useMidiChannelDetection() {
  const [detection, setDetection] = useState<ChannelSelectionResult | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectChannels = useCallback(async (file: File, instrument: InstrumentKey) => {
    setIsLoading(true);
    setError(null);
    setDetection(null);
    setSelectedChannel(null);

    try {
      const buffer = await file.arrayBuffer();
      const result = detectMidiChannels(buffer, instrument);
      setDetection(result);

      // Auto-select the detected track if not ambiguous
      if (result.selectedTrack && !result.isAmbiguous) {
        const trackIndex = result.allTracks.findIndex(
          (t) => t.noteCount > 0 && result.selectedTrack &&
                 t.index === result.allTracks.findIndex((track) =>
                   track.noteCount === result.selectedTrack.notes?.length)
        );
        if (trackIndex >= 0) {
          setSelectedChannel(trackIndex);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect MIDI channels');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setDetection(null);
    setSelectedChannel(null);
    setError(null);
  }, []);

  return {
    detection,
    selectedChannel,
    setSelectedChannel,
    isLoading,
    error,
    detectChannels,
    reset,
  };
}
