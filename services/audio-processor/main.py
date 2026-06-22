"""
Cordeband audio processor — Demucs + Basic Pitch + Supabase.
"""

from __future__ import annotations

from typing import Any

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from config import API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
from worker import process_song

app = FastAPI(title="Cordeband Audio Processor", version="0.2.0")


class ProcessRequest(BaseModel):
    song_id: str
    storage_path: str
    job_id: str
    instrument_hint: list[str] = Field(default_factory=list)
    skip_transcription_for: str | None = None
    callback_url: str | None = None
    callback_token: str | None = None


def _auth(authorization: str | None) -> None:
    if not API_KEY:
        return
    if not authorization or authorization != f"Bearer {API_KEY}":
        raise HTTPException(status_code=401, detail="Unauthorized")


def _run_job(req: ProcessRequest) -> None:
    process_song(
        req.song_id,
        req.storage_path,
        req.job_id,
        req.instrument_hint,
        skip_transcription_for=req.skip_transcription_for,
        callback_url=req.callback_url,
        callback_token=req.callback_token,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/process")
def process(
    req: ProcessRequest,
    background_tasks: BackgroundTasks,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    _auth(authorization)

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=503,
            detail="SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required",
        )

    background_tasks.add_task(_run_job, req)
    return {"accepted": True, "song_id": req.song_id, "job_id": req.job_id}
