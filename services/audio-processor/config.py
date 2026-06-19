import os

RMS_THRESHOLD = float(os.getenv("RMS_THRESHOLD", "0.008"))
API_KEY = os.getenv("AUDIO_PROCESSOR_API_KEY", "").strip()
STEMS_BUCKET = os.getenv("STEMS_BUCKET", "stems")
FEATURED_BUCKET = os.getenv("FEATURED_BUCKET", "featured")
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
STEMS_TTL_HOURS = int(os.getenv("STEMS_TTL_HOURS", "48"))
DEFAULT_BPM = int(os.getenv("DEFAULT_BPM", "120"))

CATALOG_INSTRUMENTS = ("guitar", "piano", "bass", "drums", "vocals", "other")
DEMUCS_STEMS = CATALOG_INSTRUMENTS

PROGRESS_STEPS = (5, 15, 45, 75, 95, 100)
