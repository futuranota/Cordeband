# Backlog: transcodificación de audio en catálogo destacado

**Estado:** pendiente (fase 2)  
**Contexto:** admin → Canciones destacadas → "+ Agregar producto" → Process and save

## Problema

Hoy el upload guarda el archivo **sin convertir** (MP3/WAV/FLAC tal cual) en Supabase Storage bucket `featured`. El espacio lo consume **Storage**, no Postgres. WAV/FLAC ocupan mucho más que formatos comprimidos modernos.

## Objetivo

Transcodificar automáticamente al subir para reducir tamaño en Storage:

| Formato destino | Uso recomendado |
|-----------------|-----------------|
| **AAC (.m4a)** 128 kbps | Preferido — buena compatibilidad web/Safari/iOS |
| **Opus** 96 kbps | Máximo ahorro; validar Safari/iOS antes de elegirlo como default |

## Flujo propuesto

1. Admin sube MP3/WAV/FLAC (como ahora).
2. Backend transcodifica **antes** de `uploadFeaturedFile()`.
3. Solo se persiste el archivo convertido, p. ej. `audio/{songId}.m4a`.
4. Actualizar `storage_path`, `featured_storage_url`, opcionalmente `audio_codec` en `songs`.

## Punto de integración en código

- `src/app/api/admin/featured-songs/route.ts` — entre recibir `FormData` y `uploadFeaturedFile()`
- Nuevo helper: `src/lib/audio/transcode-featured.ts` (o worker externo)
- `src/lib/supabase/featured-storage.ts` — paths y `contentType` fijos post-conversión

## FFmpeg (referencia)

```bash
# AAC → contenedor M4A (recomendado default)
ffmpeg -i input.wav -c:a aac -b:a 128k -movflags +faststart output.m4a

# Opus
ffmpeg -i input.wav -c:a libopus -b:a 96k output.opus
```

## Dónde ejecutar FFmpeg

| Entorno | Viabilidad |
|---------|------------|
| **Railway / `AUDIO_PROCESSOR_URL`** | ✅ Ideal — mismo worker que Demucs/stems |
| **Vercel serverless (API route)** | ⚠️ Difícil — sin FFmpeg nativo, límites RAM/tiempo |
| **ffmpeg WASM en servidor** | ⚠️ Posible pero lento |
| **Conversión manual pre-upload** | ✅ Workaround inmediato sin código |

**Recomendación:** integrar en el microservicio Python (Railway) cuando exista el processor real; o paso previo en admin API si el deploy incluye FFmpeg.

## Cambios adicionales al implementar

1. **Bucket `featured`:** añadir MIME `audio/mp4`, `audio/opus`, `audio/ogg` en `scripts/setup-featured-bucket.mjs` y `supabase/migrations/add_featured_storage_bucket.sql`.
2. **Player:** confirmar reproducción AAC en `<audio>` (Opus requiere pruebas Safari).
3. **Stems:** el ahorro mayor a largo plazo será comprimir stems cuando Demucs esté activo (6 archivos por canción).

## Ahorro orientativo (canción ~3 min)

| Formato | Tamaño aprox. |
|---------|---------------|
| WAV | ~30 MB |
| FLAC | ~25 MB |
| MP3 192k | ~4–5 MB |
| AAC 128k (.m4a) | ~3 MB |
| Opus 96k | ~2–2.5 MB |

## Workaround manual (hasta implementar)

Convertir con Audacity o ffmpeg a `.m4a` 128 kbps antes de subir en el admin.
