from __future__ import annotations

from typing import Any


def _staff_pos(midi: int) -> int:
    pc_map = {0: 0, 1: 0, 2: 1, 3: 1, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5, 10: 5, 11: 6}
    diatonic = lambda m: (m // 12) * 7 + pc_map[m % 12]
    return diatonic(midi) - diatonic(64)


TUNING = [64, 59, 55, 50, 45, 40]


def _midi_to_tab(midi: int) -> dict[str, int]:
    best: tuple[int, int] | None = None
    for s, open_midi in enumerate(TUNING):
        fret = midi - open_midi
        if fret < 0 or fret > 15:
            continue
        if best is None or fret < best[1]:
            best = (s, fret)
    if best is None:
        return {"string": 0, "fret": max(0, midi - 64)}
    return {"string": best[0], "fret": best[1]}


def basic_pitch_events_to_score_notes(
    events: list[tuple[float, float, int, int]],
    bpm: float,
    instrument: str,
) -> list[dict[str, Any]]:
    """Convert Basic Pitch note_events (start, end, pitch, velocity) to Cordeband JSON."""
    notes: list[dict[str, Any]] = []
    for start, end, pitch, _velocity in events:
        duration = max(end - start, 0.05)
        beat = (start * bpm) / 60.0
        dur = (duration * bpm) / 60.0
        midi = int(pitch)
        note: dict[str, Any] = {
            "beat": round(beat, 4),
            "dur": round(dur, 4),
            "midi": midi,
            "s": _staff_pos(midi),
        }
        if instrument in ("guitar", "bass"):
            note["tab"] = _midi_to_tab(midi)
        notes.append(note)
    notes.sort(key=lambda n: n["beat"])
    return notes
