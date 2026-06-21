# Problema: partituras y promesa de producto

> **Documento de investigación** — Cordeband / Instrumently  
> **Fecha:** 20 jun 2026  
> **Objetivo:** Definir qué es real, qué es aproximado, y qué arquitectura/código se necesita para vender **notas musicales** con honestidad técnica.

---

## 1. El conflicto de producto

**Lo que vendemos (promesa):** las notas musicales exactas de la canción para practicar.

**Lo que hace el código hoy:** separa audio real (Demucs) pero **adivina** las notas con Basic Pitch y las muestra en AlphaTab.

**Conclusión:** con el pipeline actual **no se puede prometer** que cada nota en pantalla es exactamente la que suena en ese instante. Eso no es un bug de UI — es una limitación del origen de los datos.

---

## 2. Pipeline actual (cómo funciona hoy)

```
MP3 subido
  → Demucs (htdemucs_6s)           → stems reales (.wav / .mp3)
  → librosa beat_track              → BPM estimado
  → Basic Pitch (ONNX) por stem     → lista de notas { beat, dur, midi }
  → Supabase note_sequences         → JSON en DB
  → fetchSongScore()                → ScoreNote[]
  → notesToAlphaTex()               → alphaTex string
  → AlphaTabViewer                  → SVG partitura
  → usePlayerAudio                  → curBeat sincronizado al audio
```

### Archivos clave

| Archivo | Rol |
|---------|-----|
| `services/audio-processor/worker.py` | Orquesta Demucs + transcripción + guardado |
| `services/audio-processor/transcription.py` | Basic Pitch por stem |
| `services/audio-processor/notes_converter.py` | Convierte eventos Basic Pitch → JSON |
| `src/lib/supabase/fetch-song-score.ts` | Lee notas de DB |
| `src/lib/alphatab/notes-to-alphatex.ts` | Genera alphaTex para AlphaTab |
| `src/components/player/AlphaTabViewer.tsx` | Renderiza partitura + cursor (tickPosition) |
| `src/components/player/SheetViewer.tsx` | Fallback con cursor verde visible |
| `src/hooks/usePlayerAudio.ts` | Audio real + curBeat vía Web Audio API |

### Modo mock (sin processor)

Si `AUDIO_PROCESSOR_URL` no está definido, `src/lib/mock-audio-processor.ts` sube WAV silencioso + **notas demo** de `SCORE` en `src/lib/data.ts`. Ahí la partitura es 100% ficticia.

---

## 3. Qué es REAL vs qué es APROXIMADO

| Capa | ¿Es exacta? | Explicación |
|------|-------------|-------------|
| **Audio del instrumento** (stem piano, guitarra, etc.) | ✅ **Sí** | Es el WAV/MP3 separado por Demucs del MP3 original |
| **Tiempo de reproducción** | ✅ **En general sí** | `curBeat` sigue el reloj del Web Audio API |
| **Notas en pantalla** | ❌ **No garantizable** | Inferidas por Basic Pitch — pueden fallar |
| **Sincronización nota ↔ audio** | ⚠️ **Aproximada** | Usa BPM estimado + beats redondeados, no tiempo de audio por nota |
| **Cursor en AlphaTab** | ⚠️ **Parcial** | `enableCursor: true` pero puede no verse (overflow, layout page, tema oscuro) |
| **Cursor en SheetViewer** | ✅ **Visible** | Raya verde `.sheet-cursor` + scroll + notas atenuadas |

### Por qué Basic Pitch no basta para “notas exactas”

1. **Polifonía (piano):** varias teclas a la vez; el modelo simplifica o se equivoca.
2. **Stems imperfectos:** Demucs deja restos de otros instrumentos en el stem.
3. **BPM estimado:** `_estimate_bpm()` con librosa puede desviarse 2–5 BPM → todo se desalinea.
4. **Notas en beats, no en segundos:** se guarda `{ beat, dur, midi }` redondeado, no `{ startTime, endTime }` del audio.
5. **Sin verificación:** no hay humano ni fuente oficial que valide la transcripción.

### Mensaje que la app ya muestra (honesto)

- Badge: **Transcripción real** = hay notas en DB, no que sean perfectas.
- Texto: **"Partitura generada automáticamente — puede tener imprecisiones"** (`player.scoreApprox`).

---

## 4. Preguntas abiertas (para investigar)

### Producto / legal

- [ ] ¿Podemos licenciar MusicXML oficial para el catálogo destacado?
- [ ] ¿Partnership con Songsterr, Hal Leonard u otro proveedor de tabs/partituras?
- [ ] ¿Qué copy legal usar en marketing vs lo que el código garantiza?
- [ ] ¿Permitimos al usuario subir MIDI/MusicXML/GP5 junto al MP3?

### Técnico — transcripción

- [ ] ¿Qué transcriptor usar para **piano polifónico**? (MT3, Onsets+Frames, Klang.io, otro)
- [ ] ¿Qué transcriptor para **batería**?
- [ ] ¿Basic Pitch sigue siendo OK para voz/bajo/guitarra monofónica con post-proceso?
- [ ] ¿API externa (Klang, AudioShake, LALAL.AI) vs self-hosted en Railway?
- [ ] ¿Costo por canción vs calidad?

### Técnico — sincronización

- [ ] ¿Implementar **beat map** real (downbeats en segundos) con madmom/essentia?
- [ ] ¿Migrar notas a `{ startTime, endTime, confidence }` como fuente de verdad?
- [ ] ¿Player sincroniza por **segundos de audio**, no por `beat * 60/bpm`?
- [ ] ¿Forzar SheetViewer (cursor visible) vs AlphaTab con MusicXML nativo?

### Técnico — calidad / UX

- [ ] ¿Badge por fuente: `licensed | user_upload | human_verified | ai_high | ai_draft`?
- [ ] ¿Umbral de confidence para mostrar nota (ej. ocultar si < 0.7)?
- [ ] ¿Editor de corrección de notas post-transcripción?
- [ ] ¿Flujo “verificar partitura” antes de marcar canción como `ready`?

### Catálogo vs upload de usuario

- [ ] Catálogo destacado: ¿MusicXML curado en lugar de auto-transcribir?
- [ ] Upload usuario: ¿aceptar solo MP3 (IA) o también MIDI/XML (exacto)?

---

## 5. Arquitectura objetivo (la que debe ir)

```
                    ┌─────────────────────────────────────┐
  Usuario sube MP3  │  OPCIONAL: MusicXML / MIDI / GP5   │  ← EXACTO (prioridad 1)
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │  Stem separation (Demucs o API)    │  ← audio real
                    └─────────────────┬───────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
   Beat map real                 Transcriptor por instrumento    Si hay MusicXML
   (madmom/essentia)             (NO solo Basic Pitch)           → usar directo
          │                           │                           │
          └───────────────────────────┼───────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │  Notas: startTime, endTime, midi,     │
                    │  velocity, confidence, source         │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │  Player: cursor por TIEMPO DE AUDIO   │
                    │  nota activa si t ∈ [start, end]    │
                    └───────────────────────────────────────┘
```

**Regla de oro:** el cursor y el highlight de nota deben usar **`audioContext.currentTime` ↔ `note.startTime` en segundos**, no solo `beat * 60 / bpm`.

---

## 6. Cambios de base de datos propuestos

```sql
alter table public.note_sequences
  add column if not exists source text not null default 'ai_basic_pitch'
    check (source in (
      'ai_basic_pitch', 'ai_mt3', 'ai_klang',
      'user_upload', 'licensed', 'human_verified'
    )),
  add column if not exists confidence_avg numeric,
  add column if not exists musicxml_path text,
  add column if not exists midi_path text;

alter table public.songs
  add column if not exists score_source text default 'auto'
    check (score_source in ('auto', 'licensed', 'user_upload', 'verified')),
  add column if not exists beat_map jsonb;
```

### Formato de nota objetivo

```json
{
  "startTime": 12.847,
  "endTime": 13.210,
  "midi": 64,
  "velocity": 82,
  "confidence": 0.91,
  "beat": 32.5,
  "dur": 0.75
}
```

- `startTime` / `endTime` → fuente de verdad para el player.
- `beat` / `dur` → derivados para visualización en partitura.

---

## 7. Worker Python — dirección del código

### Reemplazar `transcribe_stem()` monolítico por pipeline v2

```python
# services/audio-processor/transcription_v2.py (nuevo)

@dataclass
class NoteEvent:
    start_time: float
    end_time: float
    midi: int
    velocity: int
    confidence: float

def detect_beat_map(wav_path: Path) -> list[float]:
    """Downbeats en segundos."""
    ...

def transcribe_piano_polyphonic(wav_path: Path) -> list[NoteEvent]:
    """MT3, Onsets+Frames, o API Klang — NO Basic Pitch."""
    ...

def transcribe_stem_v2(wav_path, instrument, bpm) -> tuple[list[dict], str, float]:
    """Retorna (notes, source, confidence_avg)."""
    ...
```

### Integración API externa (patrón)

```python
# services/audio-processor/providers/klang.py (ejemplo)
async def transcribe_via_klang(wav_path, instrument) -> list[dict]:
    # 1. POST audio
    # 2. Poll job
    # 3. Normalizar a { startTime, endTime, midi, velocity, confidence }
    ...
```

### Import MusicXML (fuente exacta)

```python
# services/audio-processor/musicxml_import.py
from music21 import converter

def musicxml_to_notes(xml_bytes, bpm) -> list[dict]:
    # source = 'licensed' o 'user_upload'
    # confidence = 1.0
    ...
```

---

## 8. Frontend — sync real nota ↔ audio

### Hook de audio: exponer `curTimeSec`

```typescript
// usePlayerAudio.ts
const elapsedSec = (ctx.currentTime - playStartCtxRef.current) * tempo;
const curTimeSec = beatToSeconds(startBeatRef.current, bpm) + elapsedSec;
return { curBeat, curTimeSec, ... };
```

### Resolver nota activa por tiempo

```typescript
// src/lib/active-note.ts
export function activeNotesAtTime(notes, tSec, padMs = 30) {
  return notes.filter(n =>
    tSec >= (n.startTime - pad) && tSec < (n.endTime + pad)
  );
}
```

### SheetViewer: highlight por `curTimeSec`

```typescript
const startSec = n.startTime ?? (n.beat * 60 / bpm);
const endSec = n.endTime ?? ((n.beat + n.dur) * 60 / bpm);
const played = endSec <= curTimeSec;
const active = curTimeSec >= startSec && curTimeSec < endSec;
```

### AlphaTab vs SheetViewer

| Opción | Cuándo |
|--------|--------|
| **SheetViewer siempre** | Cursor visible, control total — recomendado mientras se migra |
| **AlphaTab + MusicXML** | Partitura profesional exacta (catálogo licenciado) |
| **AlphaTab + alphaTex desde IA** | Solo para borrador / no vender como exacto |

---

## 9. Badge de calidad en UI

```typescript
type ScoreQuality =
  | 'licensed'
  | 'user_upload'
  | 'human_verified'
  | 'ai_high'
  | 'ai_draft';

// Solo "exacto" para: licensed, user_upload, human_verified
```

| Badge | ¿Vendible como exacto? |
|-------|------------------------|
| Partitura verificada / licenciada | ✅ Sí |
| Tu partitura (MIDI/XML subido) | ✅ Sí |
| Transcripción IA alta confianza | ❌ No — "avanzada" |
| Borrador IA | ❌ No — "orientativa" |
| Demo | ❌ No — ejemplo |

---

## 10. APIs y servicios externos a evaluar

| Necesidad | Opciones | ¿Exacto? |
|-----------|----------|----------|
| Separación stems | Demucs (self), AudioShake, LALAL.AI | Audio sí; notas no |
| Piano polifónico | MT3, Onsets+Frames, Klang.io | Mejor, no 100% |
| Monofónico | Basic Pitch, CREPE | Aproximado |
| Partitura oficial | Songsterr (partnership), publishers MusicXML | ✅ Con licencia |
| Usuario sube score | MIDI/MusicXML/GP parse | ✅ Exacto |
| Letra | Whisper, Musixmatch | Texto, no notas |
| Beat map | madmom, essentia | Sync más preciso |
| QA humano | Editor interno | ✅ Tras validación |

**Nota:** no existe API que convierta cualquier MP3 en partitura perfecta. Las mejores dan ~85–95% en condiciones ideales.

---

## 11. Qué prometer según implementación

| Estado | Copy de venta |
|--------|---------------|
| **Hoy** (Basic Pitch) | "Partitura auto-generada orientativa" — ❌ no "exacta" |
| MT3/Klang + confidence | "Transcripción IA avanzada" |
| MusicXML catálogo | ✅ "Partitura verificada" (canciones del catálogo) |
| Usuario sube MIDI+MP3 | ✅ "Tu partitura sincronizada" |
| IA + editor + verified | ✅ "Verificada por ti" |

---

## 12. Plan de implementación (orden sugerido)

1. [ ] Migración DB: `startTime`, `endTime`, `confidence`, `source`
2. [ ] Player: sync por `curTimeSec`; nota activa por ventana temporal
3. [ ] UI: badge por fuente; ocultar "exacto" en IA draft
4. [ ] Forzar SheetViewer (cursor verde) o mejorar AlphaTab scroll/cursor
5. [ ] Worker: beat map real
6. [ ] Worker: transcriptor piano ≠ Basic Pitch
7. [ ] Upload: aceptar MIDI/MusicXML opcional
8. [ ] Admin catálogo: import MusicXML licenciado
9. [ ] Integrar API externa (Klang / MT3 en Railway)
10. [ ] Editor de corrección + flujo `human_verified`

---

## 13. Cómo comprobar calidad (sin saber música)

1. Silenciar todos los stems excepto el instrumento elegido.
2. Pulsar Play.
3. Comparar oído vs nota resaltada en pantalla.
4. Si no coincide → transcripción falló (esperable con IA pura).
5. Repetir con canción de catálogo MusicXML licenciado → debe coincidir mucho mejor.

---

## 14. Decisión pendiente (negocio)

**¿El producto es "notas exactas de cualquier MP3" o "notas exactas cuando hay fuente verificada"?**

- Si **cualquier MP3** → hay que invertir en IA premium + beat map + editor + expectativa de ~90%, no 100%.
- Si **exactas de verdad** → catálogo licenciado + upload MIDI/XML + verificación humana; MP3 solo para audio/stems.

---

## 15. Referencias en repo

- `docs/PROJECT-STATUS.md` — estado general
- `services/audio-processor/README.md` — deploy processor
- `supabase/full_schema.sql` — tabla `note_sequences`
- `memoria.md` — brief de producto original

---

*Documento vivo — actualizar cuando se tomen decisiones o se implementen cambios.*
