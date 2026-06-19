from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

from notes_converter import basic_pitch_events_to_score_notes


def _to_mono_wav(input_path: Path, output_path: Path) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(input_path),
            "-ac",
            "1",
            "-ar",
            "22050",
            str(output_path),
        ],
        check=True,
        capture_output=True,
    )


def transcribe_stem(wav_path: Path, instrument: str, bpm: float) -> list[dict]:
    try:
        from basic_pitch.inference import predict
        from basic_pitch import ICASSP_2022_MODEL_PATH
    except ImportError:
        return []

    with tempfile.TemporaryDirectory() as tmp:
        mono = Path(tmp) / "mono.wav"
        _to_mono_wav(wav_path, mono)
        _model_output, _midi_data, note_events = predict(str(mono), ICASSP_2022_MODEL_PATH)
        if not note_events:
            return []
        return basic_pitch_events_to_score_notes(note_events, bpm, instrument)
