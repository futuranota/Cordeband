FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download Demucs model (~400MB) so first job does not timeout
RUN python -m demucs --help && python -c "import demucs.pretrained; demucs.pretrained.get_model('htdemucs_6s')"

COPY callbacks.py config.py stem_energy.py supabase_client.py notes_converter.py transcription.py worker.py main.py .

ENV PORT=8080
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
