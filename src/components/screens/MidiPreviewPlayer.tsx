'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { SheetViewer } from '@/components/player/SheetViewer';
import { parseMidiBufferToScoreNotes } from '@/lib/midi/parse-midi-to-notes';
import { INSTRUMENTS, type InstrumentKey, type ScoreNote } from '@/lib/data';
import { IconPlay, IconPause, IconRotate } from '@/components/ui/icons';

type Props = {
  midiBuffer: ArrayBuffer;
  instrument: InstrumentKey;
  selectedChannel: number | null;
  onClose: () => void;
};

const DEFAULT_BPM = 120;

export function MidiPreviewPlayer({ midiBuffer, instrument, selectedChannel, onClose }: Props) {
  const [notes, setNotes] = useState<ScoreNote[]>([]);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [curBeat, setCurBeat] = useState(0);
  const [curTimeSec, setCurTimeSec] = useState(0);
  const [totalBeats, setTotalBeats] = useState(0);
  const [bpm] = useState(DEFAULT_BPM);

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Parse MIDI on mount
  useEffect(() => {
    try {
      const parsedNotes = parseMidiBufferToScoreNotes(
        midiBuffer,
        bpm,
        instrument,
        selectedChannel ?? undefined
      );

      setNotes(parsedNotes);

      if (parsedNotes.length > 0) {
        const maxEndBeat = Math.max(
          ...parsedNotes.map((n) => n.beat + n.dur)
        );
        setTotalBeats(Math.ceil(maxEndBeat) + 4);
      } else {
        setError('No notes found in MIDI file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse MIDI');
    }
  }, [midiBuffer, instrument, selectedChannel, bpm]);

  // Playback loop
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const animate = (now: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = now;
      }

      const elapsedMs = now - startTimeRef.current + pausedTimeRef.current;
      const elapsedSec = elapsedMs / 1000;
      const beatDuration = (60 / bpm); // seconds per beat
      const beat = elapsedSec / beatDuration;

      setCurTimeSec(elapsedSec);
      setCurBeat(beat);

      // Auto-stop at end
      if (totalBeats > 0 && beat >= totalBeats) {
        setPlaying(false);
        setCurBeat(0);
        setCurTimeSec(0);
        startTimeRef.current = 0;
        pausedTimeRef.current = 0;
      } else {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [playing, bpm, totalBeats]);

  const handlePlayPause = () => {
    if (playing) {
      // Pause: save elapsed time
      pausedTimeRef.current += (performance.now() - startTimeRef.current);
      startTimeRef.current = 0;
    } else {
      // Resume
      startTimeRef.current = performance.now();
    }
    setPlaying(!playing);
  };

  const handleReset = () => {
    setPlaying(false);
    setCurBeat(0);
    setCurTimeSec(0);
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
  };

  const InstIcon = INSTRUMENTS[instrument]?.Icon;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {InstIcon && (
            <div style={{ fontSize: 32 }}>
              <InstIcon size={32} />
            </div>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>MIDI Preview</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-3)', fontSize: 14 }}>
              {notes.length} notes • {instrument}
              {selectedChannel !== null && ` • Channel ${selectedChannel + 1}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-lg"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      {error && (
        <div style={{
          padding: 16,
          marginBottom: 24,
          background: 'rgba(255, 90, 90, 0.1)',
          border: '1px solid rgba(255, 90, 90, 0.3)',
          borderRadius: 8,
          color: '#ff7676',
          fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {/* Score Viewer */}
      {notes.length > 0 && (
        <>
          <div style={{ marginBottom: 24 }}>
            <SheetViewer
              view="staff"
              curBeat={curBeat}
              curTimeSec={curTimeSec}
              bpm={bpm}
              notes={notes}
              totalBeats={totalBeats}
              emptyMessage="No MIDI data"
            />
          </div>

          {/* Transport Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 20,
            background: 'var(--elev)',
            borderRadius: 8,
          }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePlayPause}
              style={{ width: 56, height: 56, borderRadius: '50%' }}
            >
              {playing ? <IconPause size={20} /> : <IconPlay size={20} />}
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleReset}
              title="Reset to start"
            >
              <IconRotate size={16} />
            </button>

            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 13,
                color: 'var(--text-3)',
              }}>
                <span style={{ minWidth: 50, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.floor(curTimeSec / 60)}:{String(Math.floor(curTimeSec % 60)).padStart(2, '0')}
                </span>
                <div style={{
                  flex: 1,
                  height: 4,
                  background: 'var(--elev-3)',
                  borderRadius: 999,
                  position: 'relative',
                  cursor: 'pointer',
                }}>
                  <div style={{
                    height: '100%',
                    background: 'var(--acc)',
                    borderRadius: 999,
                    width: `${totalBeats > 0 ? (curBeat / totalBeats) * 100 : 0}%`,
                    transition: 'width 0.05s linear',
                  }} />
                </div>
                <span style={{ minWidth: 50, fontVariantNumeric: 'tabular-nums' }}>
                  {totalBeats > 0 ? `${Math.floor((totalBeats * 60) / bpm)}s` : '0s'}
                </span>
              </div>
            </div>
          </div>

          <p style={{
            marginTop: 16,
            fontSize: 12,
            color: 'var(--text-4)',
            textAlign: 'center',
          }}>
            🎵 Playback is local • BPM: {bpm} • No audio processing
          </p>
        </>
      )}
    </div>
  );
}
