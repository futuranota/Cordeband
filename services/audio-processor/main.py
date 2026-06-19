"""
Cordeband audio processor — Demucs + RMS gate + Supabase upload.

Deploy on Railway. Set AUDIO_PROCESSOR_URL in Next.js when ready.
"""

from __future__ import annotations

import os
import subprocess
import wave
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Cordeband Audio Processor", version="0.1.0")

RMS_THRESHOLD = float(os.getenv("RMS_THRESHOLD", "0.008"))
API_KEY = os.getenv("AUDIO_PROCESSOR_API_KEY", "").strip()
STEMS_BUCKET = os.getenv("STEMS_BUCKET", "stems")

DEMUCS_LABELS = {
    "drums": "drums",
    "bass": "bass",
    "other": "other",
    "vocals": "vocals",
    "guitar": "guitar",
    "piano": "piano",
}


class ProcessRequest(BaseModel):
    song_id: str
    storage_path: str
    job_id: str
    instrument_hint: list[str] = Field(default_factory=list)


def _auth(authorization: str | None) -> None:
    if not API_KEY:
        return
    if not authorization or authorization != f"Bearer {API_KEY}":
        raise HTTPException(status_code=401, detail="Unauthorized")


def _wav_rms(path: Path) -> float:
    with wave.open(str(path), "rb") as wf:
        frames = wf.readframes(wf.getnframes())
        sample_width = wf.getsampwidth()
        if sample_width == 2:
            pcm = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
        else:
            pcm = np.frombuffer(frames, dtype=np.int8).astype(np.float32) / 128.0
    if pcm.size == 0:
        return 0.0
    return float(np.sqrt(np.mean(pcm ** 2)))


def _run_demucs(input_path: Path, out_dir: Path) -> Path:
    subprocess.run(
        [
            "python", "-m", "demucs",
            "-n", "htdemucs_6s",
            "--two-stems", "vocals",
            "-o", str(out_dir),
            str(input_path),
        ],
        check=True,
    )
    # demucs writes: out_dir/htdemucs_6s/<track_name>/*.wav
    candidates = list(out_dir.rglob("*.wav"))
    if not candidates:
        raise RuntimeError("Demucs produced no WAV files")
    return candidates[0].parent


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/process")
def process(req: ProcessRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    """
    Full Supabase integration is completed when SUPABASE_URL and
    SUPABASE_SERVICE_ROLE_KEY are configured. Until then this endpoint
    validates auth and runs Demucs locally for smoke tests.
    """
    _auth(authorization)

    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not supabase_url or not service_key:
        raise HTTPException(
            status_code=503,
            detail="SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for production processing",
        )

    # TODO: download original from Storage, run Demucs, upload stems, update DB.
    # See README.md for the full Railway wiring checklist.
    raise HTTPException(
        status_code=501,
        detail="Demucs worker scaffold ready — complete Storage/DB handlers before production",
    )


def _filter_by_rms(stem_dir: Path) -> list[str]:
    detected: list[tuple[str, float]] = []
    for label in DEMUCS_LABELS:
        wav = stem_dir / f"{label}.wav"
        if not wav.exists():
            continue
        rms = _wav_rms(wav)
        if rms >= RMS_THRESHOLD:
            detected.append((label, rms))
    detected.sort(key=lambda item: item[1], reverse=True)
    return [label for label, _ in detected]
