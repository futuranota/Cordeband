#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -d .venv ]]; then
  echo "Missing .venv — run: python3.11 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

# shellcheck disable=SC1091
source .venv/bin/activate

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
elif [[ -f ../../.env.local ]]; then
  echo "Using Supabase vars from ../../.env.local"
  set -a
  # shellcheck disable=SC1091
  source ../../.env.local
  set +a
  export AUDIO_PROCESSOR_API_KEY="${AUDIO_PROCESSOR_API_KEY:-dev-secret}"
fi

export SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Set SUPABASE_SERVICE_ROLE_KEY in services/audio-processor/.env or repo .env.local}"
export AUDIO_PROCESSOR_API_KEY="${AUDIO_PROCESSOR_API_KEY:-dev-secret}"

if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
  echo "ERROR: ffmpeg and ffprobe are required for Demucs (MP3 decoding)."
  echo "Install on macOS: brew install ffmpeg"
  exit 1
fi

if lsof -ti :8080 >/dev/null 2>&1; then
  echo "ERROR: el puerto 8080 ya está en uso (¿otro dev:processor abierto?)."
  echo "Libéralo con: lsof -ti :8080 | xargs kill -9"
  exit 1
fi

echo "Starting audio processor on http://127.0.0.1:8080"
exec uvicorn main:app --reload --host 127.0.0.1 --port 8080
