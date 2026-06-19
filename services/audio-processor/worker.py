from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import time
import wave
from pathlib import Path

from config import (
    CATALOG_INSTRUMENTS,
    DEFAULT_BPM,
    DEMUCS_STEMS,
    PROGRESS_STEPS,
    STEMS_TTL_HOURS,
)
from stem_energy import filter_instruments_by_energy, wav_rms
from supabase_client import (
    clear_existing_stems,
    download_original,
    fetch_song,
    finalize_song,
    get_client,
    insert_note_sequence,
    insert_stem_row,
    mark_song_failed,
    stems_expires_at_iso,
    update_job,
    upload_stem_wav,
)
from transcription import transcribe_stem

_DEBUG_LOG = Path(__file__).resolve().parents[2] / ".cursor" / "debug-133ddb.log"


def _dbg(location: str, message: str, data: dict, hypothesis_id: str) -> None:
    # #region agent log
    try:
        payload = {
            "sessionId": "133ddb",
            "location": location,
            "message": message,
            "data": data,
            "hypothesisId": hypothesis_id,
            "timestamp": int(time.time() * 1000),
        }
        _DEBUG_LOG.parent.mkdir(parents=True, exist_ok=True)
        with _DEBUG_LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")
    except Exception:
        pass
    # #endregion


def _wav_duration_seconds(path: Path) -> int:
    with wave.open(str(path), "rb") as wf:
        frames = wf.getnframes()
        rate = wf.getframerate()
        if rate <= 0:
            return 0
        return max(1, int(round(frames / rate)))


def _estimate_bpm(path: Path) -> int:
    try:
        import librosa

        y, sr = librosa.load(str(path), sr=None, mono=True, duration=60)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        if hasattr(tempo, "__len__"):
            tempo = float(tempo[0]) if len(tempo) else DEFAULT_BPM
        bpm = int(round(float(tempo)))
        return max(60, min(200, bpm))
    except Exception:
        return DEFAULT_BPM


def _run_demucs(input_path: Path, out_dir: Path) -> Path:
    python_bin = sys.executable
    # #region agent log
    _dbg(
        "worker.py:_run_demucs:pre",
        "Starting demucs subprocess",
        {
            "python_bin": python_bin,
            "input_path": str(input_path),
            "input_bytes": input_path.stat().st_size if input_path.exists() else 0,
            "out_dir": str(out_dir),
            "ffmpeg": shutil.which("ffmpeg"),
            "ffprobe": shutil.which("ffprobe"),
        },
        "H1",
    )
    # #endregion
    try:
        completed = subprocess.run(
            [
                python_bin,
                "-m",
                "demucs",
                "-n",
                "htdemucs_6s",
                "-o",
                str(out_dir),
                str(input_path),
            ],
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as exc:
        # #region agent log
        _dbg(
            "worker.py:_run_demucs:fail",
            "Demucs subprocess failed",
            {
                "returncode": exc.returncode,
                "stderr_tail": (exc.stderr or "")[-2000:],
                "stdout_tail": (exc.stdout or "")[-1000:],
                "python_bin": python_bin,
            },
            "H2",
        )
        # #endregion
        detail = (exc.stderr or exc.stdout or "").strip()
        raise RuntimeError(
            f"Demucs failed (exit {exc.returncode})"
            + (f": {detail[-500:]}" if detail else "")
        ) from exc

    # #region agent log
    _dbg(
        "worker.py:_run_demucs:ok",
        "Demucs completed",
        {"stdout_tail": (completed.stdout or "")[-500:]},
        "H3",
    )
    # #endregion
    stem_dirs = list((out_dir / "htdemucs_6s").glob("*"))
    if not stem_dirs:
        raise RuntimeError("Demucs produced no output directory")
    stem_dir = stem_dirs[0]
    if not any(stem_dir.glob("*.wav")):
        raise RuntimeError("Demucs produced no WAV files")
    return stem_dir


def _stem_storage_path(song_id: str, instrument: str, is_featured: bool) -> str:
    if is_featured:
        return f"featured/stems/{song_id}/{instrument}.wav"
    return f"songs/{song_id}/stems/{instrument}.wav"


def _resolve_targets(
    demucs_dir: Path,
    instrument_hint: list[str],
) -> list[str]:
    hint = [i for i in instrument_hint if i in CATALOG_INSTRUMENTS]
    candidates = hint if hint else list(DEMUCS_STEMS)
    return [inst for inst in candidates if (demucs_dir / f"{inst}.wav").exists()]


def process_song(song_id: str, storage_path: str, job_id: str, instrument_hint: list[str]) -> None:
    client = get_client()

    try:
        song = fetch_song(client, song_id)
        is_featured = bool(song.get("is_featured"))
        hint = instrument_hint or list(song.get("instruments") or [])

        update_job(client, job_id, status="processing", progress_pct=PROGRESS_STEPS[0], started=True)
        client.table("songs").update({"status": "processing"}).eq("id", song_id).execute()

        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            original_bytes = download_original(client, storage_path, is_featured)
            input_path = work / "input.mp3"
            input_path.write_bytes(original_bytes)
            # #region agent log
            _dbg(
                "worker.py:process_song:download",
                "Downloaded original audio",
                {
                    "song_id": song_id,
                    "storage_path": storage_path,
                    "is_featured": is_featured,
                    "byte_len": len(original_bytes),
                },
                "H4",
            )
            # #endregion

            update_job(client, job_id, progress_pct=PROGRESS_STEPS[1])
            demucs_out = work / "demucs"
            stem_dir = _run_demucs(input_path, demucs_out)

            update_job(client, job_id, progress_pct=PROGRESS_STEPS[2])
            targets = _resolve_targets(stem_dir, hint)
            if not targets:
                raise RuntimeError("No stems matched instrument selection")

            energies: dict[str, float] = {}
            for inst in targets:
                wav = stem_dir / f"{inst}.wav"
                energies[inst] = wav_rms(wav)

            detected = filter_instruments_by_energy(energies)
            if hint:
                detected = [inst for inst in hint if inst in detected]
                if not detected:
                    detected = [inst for inst in hint if (stem_dir / f"{inst}.wav").exists()]
            if not detected:
                raise RuntimeError("No stems passed energy threshold")

            bpm = _estimate_bpm(input_path)
            duration_seconds = _wav_duration_seconds(stem_dir / f"{detected[0]}.wav")

            clear_existing_stems(client, song_id)

            update_job(client, job_id, progress_pct=PROGRESS_STEPS[3])
            for inst in detected:
                wav_path = stem_dir / f"{inst}.wav"
                storage_target = _stem_storage_path(song_id, inst, is_featured)
                upload_stem_wav(client, storage_target, wav_path.read_bytes())
                # #region agent log
                _dbg(
                    "worker.py:process_song:stem_uploaded",
                    "Stem uploaded to storage",
                    {"song_id": song_id, "instrument": inst, "storage_target": storage_target},
                    "H6",
                )
                # #endregion
                stem_id = insert_stem_row(client, song_id, inst, storage_target)

                update_job(client, job_id, progress_pct=PROGRESS_STEPS[4])
                try:
                    notes = transcribe_stem(wav_path, inst, float(bpm))
                except Exception:
                    notes = []
                if notes:
                    insert_note_sequence(client, song_id, stem_id, inst, notes, None)

            expires = None if is_featured else stems_expires_at_iso(STEMS_TTL_HOURS)
            finalize_song(
                client,
                song_id,
                instruments=detected,
                bpm=bpm,
                duration_seconds=duration_seconds,
                key_signature=None,
                stems_expires_at=expires,
            )
            update_job(client, job_id, status="completed", progress_pct=PROGRESS_STEPS[5], completed=True)
            # #region agent log
            _dbg(
                "worker.py:process_song:ok",
                "Song processing completed",
                {"song_id": song_id, "instruments": detected, "bpm": bpm},
                "H7",
            )
            # #endregion

    except Exception as exc:
        # #region agent log
        _dbg(
            "worker.py:process_song:fail",
            "process_song failed",
            {"song_id": song_id, "error": str(exc)[:2000]},
            "H5",
        )
        # #endregion
        mark_song_failed(client, song_id, job_id, str(exc))
        raise
