from __future__ import annotations

import subprocess
import sys
import tempfile
import wave
from pathlib import Path

from config import (
    DEFAULT_BPM,
    DEMUCS_STEMS,
    PROGRESS_STEPS,
    STEMS_TTL_HOURS,
)
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
    try:
        subprocess.run(
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
        detail = (exc.stderr or exc.stdout or "").strip()
        raise RuntimeError(
            f"Demucs failed (exit {exc.returncode})"
            + (f": {detail[-500:]}" if detail else "")
        ) from exc

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


def _all_demucs_stems(demucs_dir: Path) -> list[str]:
    """All stems Demucs produced (htdemucs_6s → up to 6 WAV files)."""
    return [inst for inst in DEMUCS_STEMS if (demucs_dir / f"{inst}.wav").exists()]


def process_song(song_id: str, storage_path: str, job_id: str, _instrument_hint: list[str]) -> None:
    client = get_client()

    try:
        song = fetch_song(client, song_id)
        is_featured = bool(song.get("is_featured"))
        update_job(client, job_id, status="processing", progress_pct=PROGRESS_STEPS[0], started=True)
        client.table("songs").update({"status": "processing"}).eq("id", song_id).execute()

        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            original_bytes = download_original(client, storage_path, is_featured)
            input_path = work / "input.mp3"
            input_path.write_bytes(original_bytes)

            update_job(client, job_id, progress_pct=PROGRESS_STEPS[1])
            demucs_out = work / "demucs"
            stem_dir = _run_demucs(input_path, demucs_out)

            update_job(client, job_id, progress_pct=PROGRESS_STEPS[2])
            upload_targets = _all_demucs_stems(stem_dir)
            if not upload_targets:
                raise RuntimeError("Demucs produced no stem WAV files")

            bpm = _estimate_bpm(input_path)
            duration_seconds = max(
                _wav_duration_seconds(stem_dir / f"{inst}.wav") for inst in upload_targets
            )

            clear_existing_stems(client, song_id)

            update_job(client, job_id, progress_pct=PROGRESS_STEPS[3])
            for inst in upload_targets:
                wav_path = stem_dir / f"{inst}.wav"
                storage_target = _stem_storage_path(song_id, inst, is_featured)
                upload_stem_wav(client, storage_target, wav_path.read_bytes())
                stem_id = insert_stem_row(client, song_id, inst, storage_target)

                update_job(client, job_id, progress_pct=PROGRESS_STEPS[4])
                notes = transcribe_stem(wav_path, inst, float(bpm))
                if notes:
                    insert_note_sequence(client, song_id, stem_id, inst, notes, None)

            expires = None if is_featured else stems_expires_at_iso(STEMS_TTL_HOURS)
            finalize_song(
                client,
                song_id,
                instruments=upload_targets,
                bpm=bpm,
                duration_seconds=duration_seconds,
                key_signature=None,
                stems_expires_at=expires,
            )
            update_job(client, job_id, status="completed", progress_pct=PROGRESS_STEPS[5], completed=True)

    except Exception as exc:
        mark_song_failed(client, song_id, job_id, str(exc))
        raise
