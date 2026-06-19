# Deploy audio processor en Railway

## Prerrequisitos

- Cuenta Railway
- Supabase `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- Next.js en Vercel con variables listas para actualizar

## Pasos

1. **Nuevo servicio** en Railway → Deploy from repo → root directory: `services/audio-processor`
2. **Variables de entorno** (Railway → Variables):

   | Variable | Valor |
   |----------|-------|
   | `SUPABASE_URL` | URL del proyecto Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role (secreto) |
   | `AUDIO_PROCESSOR_API_KEY` | Genera un secret largo |
   | `STEMS_BUCKET` | `stems` |
   | `FEATURED_BUCKET` | `featured` |
   | `RMS_THRESHOLD` | `0.008` (opcional) |

3. **Recursos**: mínimo **4 GB RAM** — Demucs en CPU consume mucha memoria.

4. **Build**: el `Dockerfile` pre-descarga `htdemucs_6s` (~400 MB). El primer build puede tardar varios minutos.

5. **URL pública**: Railway asigna `https://xxx.up.railway.app` — probar `GET /health`.

6. **Vercel** (y `.env.local` en prod):

   ```env
   AUDIO_PROCESSOR_URL=https://xxx.up.railway.app
   AUDIO_PROCESSOR_API_KEY=<mismo secret que Railway>
   ```

7. **Verificación**: subir una canción destacada con solo Piano → job `completed` → player con audio real.

## Sin Railway (solo local)

Ver [services/audio-processor/README.md](../services/audio-processor/README.md).
