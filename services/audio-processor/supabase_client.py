from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from supabase import Client, create_client

from config import FEATURED_BUCKET, STEMS_BUCKET, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL


def get_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def download_original(client: Client, storage_path: str, is_featured: bool) -> bytes:
    bucket = FEATURED_BUCKET if is_featured else STEMS_BUCKET
    data = client.storage.from_(bucket).download(storage_path)
    if not data:
        raise RuntimeError(f"Could not download {bucket}/{storage_path}")
    return data


def upload_stem_wav(client: Client, storage_path: str, wav_bytes: bytes) -> None:
    # storage3 expects x-upsert as str header, not Python bool (upsert=True breaks httpx)
    client.storage.from_(STEMS_BUCKET).upload(
        storage_path,
        wav_bytes,
        file_options={"content-type": "audio/mpeg", "x-upsert": "true"},
    )


def update_job(
    client: Client,
    job_id: str,
    *,
    status: str | None = None,
    progress_pct: int | None = None,
    error_message: str | None = None,
    started: bool = False,
    completed: bool = False,
) -> None:
    payload: dict[str, Any] = {}
    if status is not None:
        payload["status"] = status
    if progress_pct is not None:
        payload["progress_pct"] = progress_pct
    if error_message is not None:
        payload["error_message"] = error_message
    if started:
        payload["started_at"] = datetime.now(timezone.utc).isoformat()
    if completed:
        payload["completed_at"] = datetime.now(timezone.utc).isoformat()
    if payload:
        client.table("processing_jobs").update(payload).eq("id", job_id).execute()


def mark_song_failed(client: Client, song_id: str, job_id: str, message: str) -> None:
    update_job(client, job_id, status="failed", error_message=message, completed=True)
    client.table("songs").update({"status": "failed"}).eq("id", song_id).execute()


def fetch_song(client: Client, song_id: str) -> dict[str, Any]:
    res = (
        client.table("songs")
        .select("id, is_featured, instruments, storage_path")
        .eq("id", song_id)
        .single()
        .execute()
    )
    if not res.data:
        raise RuntimeError(f"Song {song_id} not found")
    return res.data


def clear_existing_stems(client: Client, song_id: str) -> None:
    client.table("note_sequences").delete().eq("song_id", song_id).execute()
    client.table("stems").delete().eq("song_id", song_id).execute()


def insert_stem_row(
    client: Client,
    song_id: str,
    instrument: str,
    storage_path: str,
) -> str:
    res = (
        client.table("stems")
        .insert(
            {
                "song_id": song_id,
                "instrument_type": instrument,
                "storage_url": None,
                "storage_path": storage_path,
            }
        )
        .execute()
    )
    rows = res.data or []
    if not rows:
        raise RuntimeError(f"Failed to insert stem row for {instrument}")
    return rows[0]["id"]


def insert_note_sequence(
    client: Client,
    song_id: str,
    stem_id: str,
    instrument: str,
    notes: list[dict[str, Any]],
    key_signature: str | None,
    *,
    source: str = "ai_basic_pitch",
    confidence_avg: float | None = None,
) -> None:
    tab_data = None
    if instrument in ("guitar", "bass"):
        tab_data = [n.get("tab") for n in notes if n.get("tab")]

    row: dict[str, Any] = {
        "song_id": song_id,
        "stem_id": stem_id,
        "instrument_type": instrument,
        "notes": notes,
        "tab_data": tab_data,
        "key_signature": key_signature,
        "source": source,
    }
    if confidence_avg is not None:
        row["confidence_avg"] = confidence_avg

    client.table("note_sequences").insert(row).execute()


def confidence_avg_from_notes(notes: list[dict[str, Any]]) -> float | None:
    vals = [
        float(n["confidence"])
        for n in notes
        if isinstance(n.get("confidence"), (int, float))
    ]
    if not vals:
        return None
    return round(sum(vals) / len(vals), 3)


def finalize_song(
    client: Client,
    song_id: str,
    *,
    instruments: list[str],
    bpm: int,
    duration_seconds: int,
    key_signature: str | None,
    stems_expires_at: str | None,
) -> None:
    client.table("songs").update(
        {
            "status": "ready",
            "instruments": instruments,
            "bpm": bpm,
            "duration_seconds": duration_seconds,
            "key_signature": key_signature,
            "stems_expires_at": stems_expires_at,
        }
    ).eq("id", song_id).execute()


def stems_expires_at_iso(hours: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()
