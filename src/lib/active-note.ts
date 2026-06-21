// src/lib/active-note.ts
// Resuelve qué notas están activas en un momento dado.
//
// Usa startTime/endTime en segundos si existen en la nota (notas nuevas con
// pipeline v2). Si no existen, cae al cálculo por beats como fallback
// (notas antiguas en DB — retrocompatible).

export interface NoteWithTime {
  // Nuevos campos (pipeline v2 / migración DB)
  startTime?: number | null;
  endTime?: number | null;
  // Campos existentes (siempre presentes)
  beat: number;
  dur: number;
  midi: number;
}

/**
 * Retorna las notas activas en el tiempo `tSec` (segundos de audio).
 *
 * @param notes     Array de notas de la canción
 * @param tSec      Tiempo actual en segundos (curTimeSec del hook)
 * @param bpm       BPM de la canción (fallback si no hay startTime)
 * @param padMs     Ventana de tolerancia en ms (default 30ms)
 */
export function activeNotesAtTime(
  notes: NoteWithTime[],
  tSec: number,
  bpm: number,
  padMs = 30,
): NoteWithTime[] {
  const pad = padMs / 1000;

  return notes.filter((n) => {
    const startSec = (n.startTime != null)
      ? n.startTime
      : (n.beat * 60) / bpm;

    const endSec = (n.endTime != null)
      ? n.endTime
      : ((n.beat + n.dur) * 60) / bpm;

    return tSec >= (startSec - pad) && tSec < (endSec + pad);
  });
}

/**
 * Helper: indica si una nota específica está activa en tSec.
 * Útil para el highlight individual en SheetViewer/StaffView.
 */
export function isNoteActive(
  note: NoteWithTime,
  tSec: number,
  bpm: number,
  padMs = 30,
): boolean {
  return activeNotesAtTime([note], tSec, bpm, padMs).length > 0;
}

/**
 * Helper: indica si una nota ya fue tocada (played).
 * Una nota está "played" cuando su endTime ya pasó.
 */
export function isNotePlayed(
  note: NoteWithTime,
  tSec: number,
  bpm: number,
): boolean {
  const endSec = (note.endTime != null)
    ? note.endTime
    : ((note.beat + note.dur) * 60) / bpm;

  return endSec <= tSec;
}
