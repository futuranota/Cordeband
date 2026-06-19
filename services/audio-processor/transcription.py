from __future__ import annotations

import logging
import subprocess
import tempfile
from pathlib import Path

from notes_converter import basic_pitch_events_to_score_notes

logger = logging.getLogger(__name__)


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


def _basic_pitch_model_path():
    """Use ONNX model — TensorFlow 2.16+ cannot load the bundled SavedModel."""
    from basic_pitch import FilenameSuffix, build_icassp_2022_model_path

    return build_icassp_2022_model_path(FilenameSuffix.onnx)


def transcribe_stem(wav_path: Path, instrument: str, bpm: float) -> list[dict]:
    try:
        from basic_pitch.inference import predict
    except ImportError as exc:
        logger.warning("basic_pitch unavailable: %s", exc)
        return []

    model_path = _basic_pitch_model_path()
    if not model_path.is_file():
        logger.error("basic_pitch ONNX model missing at %s", model_path)
        return []

    try:
        with tempfile.TemporaryDirectory() as tmp:
            mono = Path(tmp) / "mono.wav"
            _to_mono_wav(wav_path, mono)
            _model_output, _midi_data, note_events = predict(
                str(mono),
                model_path,
                minimum_note_length=50.0,
                onset_threshold=0.4,
                frame_threshold=0.25,
            )
            if not note_events:
                logger.info("No note events for %s stem", instrument)
                return []
            return basic_pitch_events_to_score_notes(note_events, bpm, instrument)
    except Exception as exc:
        logger.exception("transcribe_stem failed for %s: %s", instrument, exc)
        return []
