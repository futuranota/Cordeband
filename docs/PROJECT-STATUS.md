# Cordeband / Instrumently — Estado del proyecto

> **Documento para sincronizar agentes** (Cursor, Claude, etc.)  
> **Última actualización:** 20 jun 2026  
> **Repo:** `/Users/r/Downloads/Coderband` · rama `main`  
> **Dominio producción:** `https://cordeband.site` (ver `docs/supabase-auth-urls.md`)

---

## 1. Qué es este producto

**Instrumently** es el nombre de producto en los briefs. En código y marca actual se usa **Cordeband** / **Coderband**.

App web para músicos: subes un MP3, la app separa stems (Demucs), transcribe notas (Basic Pitch), y practicas con partitura/tablatura sincronizada al audio — como karaoke pero con notas musicales.

**Tres capas de valor (v1):**

| Capa | Plan | Estado en código |
|------|------|------------------|
| Práctica solo | Free / Pro | **Mayormente implementada** (upload → procesamiento → player) |
| Sala de banda en tiempo real | Banda ($24.99/mes) | **Implementada v1** (songId real, dashboard, audio sync; QA 2 browsers pendiente en prod) |
| Portal de creador | Beta | **Fuera de scope v1** — no construir |

**Briefs de referencia:** `memoria.md` (Design Brief + Tech Brief + precios)  
**Checklist de construcción (desactualizado):** `GUIA-DESARROLLO.md` — muchas tareas marcadas `[ ]` ya están hechas; usar **este documento** como fuente de verdad del estado real.

---

## 2. Stack actual

| Capa | Tecnología | Versión / notas |
|------|------------|-----------------|
| Frontend + API | Next.js App Router + TypeScript | Next **16.2.9**, React **19.2.4** |
| Estilos | Tailwind CSS 4 + CSS Variables | `globals.css`, `app-flow.css`, acento `#4fb8ff` |
| Estado cliente | Zustand | `src/stores/playerStore.ts` |
| DB + Auth + Realtime + Storage | Supabase | `@supabase/supabase-js` ^2.108, `@supabase/ssr` |
| Partitura | alphaTab | `@coderline/alphatab` ^1.8.3 |
| Audio browser | Web Audio API | `src/hooks/usePlayerAudio.ts` |
| Pagos | Stripe | Dependencias instaladas; **sin API routes aún** |
| Email | Resend | Stub en `src/lib/resend.ts`; **sin templates ni envíos** |
| ML / procesamiento | Python FastAPI + Demucs + Basic Pitch | `services/audio-processor/` |
| Deploy frontend | Vercel | Documentado; estado de deploy no verificado en repo |
| Deploy ML | Railway | Documentado en `docs/RAILWAY-DEPLOY.md` |

**Importante:** Demucs **nunca** corre en Vercel. Solo en `services/audio-processor` (local o Railway).

---

## 3. Estructura del repo


Coderband/
├── src/
│   ├── app/                    # Rutas App Router
│   │   ├── (auth)/             # login, signup, forgot-password, reset-password
│   │   ├── (app)/              # dashboard, upload, instrument, player, band, profile
│   │   ├── admin/              # panel admin
│   │   ├── join/[token]/       # invitados a sala de banda
│   │   ├── auth/callback/      # OAuth + email confirm + password reset
│   │   └── api/                # API Routes (ver sección 5)
│   ├── components/             # UI por pantalla + billing + player + admin
│   ├── hooks/                  # usePlayerAudio, useBandRoom, useBandSync, useBandTurnOverlay
│   ├── lib/                    # supabase/, plans, audio-processor, alphatab/, band-*
│   ├── stores/                 # playerStore.ts
│   ├── types/                  # database.ts, band.ts, catalog.ts
│   └── i18n/                   # ES/EN strings + context
├── services/audio-processor/   # FastAPI + Demucs + Basic Pitch
├── supabase/
│   ├── full_schema.sql         # Schema completo v1 (fuente de verdad SQL)
│   └── migrations/             # buckets, featured, profile location, etc.
├── docs/                       # Este archivo + deploy + backlog
├── memoria.md                  # Design + Tech Brief
└── GUIA-DESARROLLO.md          # Checklist generado (desactualizado)
```

---

## 4. Variables de entorno

Ver `.env.example`. Resumen:

| Variable | Propósito | Estado típico |
|----------|-----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project | Configurado en dev |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente browser/SSR | Configurado |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo server (bypass RLS) | Configurado |
| `ADMIN_USER_ID` | UUID del admin en Supabase Auth | Requerido para `/admin` |
| `AUDIO_PROCESSOR_URL` | URL del microservicio Python | Local: `http://127.0.0.1:8080` o Railway |
| `AUDIO_PROCESSOR_API_KEY` | Bearer token Vercel ↔ Railway | Debe coincidir en ambos lados |
| `NEXT_PUBLIC_APP_URL` | Base URL app | Prod: `https://cordeband.site` |
| `STRIPE_*` | Checkout + webhooks | **Pendiente integración** |
| `RESEND_*` | Emails transaccionales | **Pendiente** |
| `REDIS_URL` | En brief original (BullMQ) | **No usado** — el processor usa BackgroundTasks de FastAPI |

**Comportamiento clave:** Si `AUDIO_PROCESSOR_URL` **no** está definido, los uploads usan el **mock processor** (`src/lib/mock-audio-processor.ts`) que simula progreso y sube WAV placeholder + notas demo.

Si `AUDIO_PROCESSOR_URL` **sí** está definido, `getInstrumentDetectionMode()` pasa a `'auto'` (detección post-Demucs en el worker).

**Dev local del processor:**

```bash
npm run dev:processor   # terminal 1 — FastAPI en :8080
npm run dev             # terminal 2 — Next.js
```

Requisito macOS: `brew install ffmpeg`.

---

## 5. API Routes implementadas

| Ruta | Métodos | Qué hace |
|------|---------|----------|
| `/api/songs` | GET, POST | Lista canciones del usuario; upload MP3 + job + dispatch processor |
| `/api/songs/[id]` | GET, DELETE | Detalle / borrar canción |
| `/api/songs/[id]/job` | GET | Estado del job + instrumentos detectados |
| `/api/songs/[id]/stems` | GET | Signed URLs de stems |
| `/api/admin/featured-songs` | GET, POST | CRUD catálogo destacado (admin) |
| `/api/admin/featured-songs/[id]` | PATCH, DELETE | Publicar/ocultar/borrar destacada |
| `/api/admin/featured-songs/[id]/job` | GET | Job de procesamiento destacada |
| `/api/admin/featured-songs/[id]/process` | POST | Re-procesar destacada |
| `/api/band-rooms` | POST | Crear/unirse a sala |
| `/api/band-rooms/lookup` | GET | Lookup por token/código (join) |
| `/api/band-rooms/[roomId]` | GET | Estado de sala |
| `/api/band-rooms/[roomId]/play` | PATCH | Play/pause sincronizado (solo host) |
| `/api/processing-config` | GET | `{ detectionMode: 'manual' \| 'auto' }` |
| `/api/geocode/reverse` | GET | Geocoding inverso en signup paso 2 |

**No existen aún:**

- `/api/checkout` (Stripe)
- `/api/webhooks/stripe`
- `/api/admin/affiliates` (afiliados van por localStorage hoy)

---

## 6. Base de datos (Supabase)

**Schema completo:** `supabase/full_schema.sql`

### Tablas v1

| Tabla | Propósito |
|-------|-----------|
| `profiles` | Extiende auth.users: plan, intended_plan, songs_used_this_month, stripe_customer_id, city, postal_code |
| `songs` | Canciones usuario + destacadas (`is_featured`, `source_type`: upload \| catalog) |
| `stems` | WAV por instrumento en Storage |
| `note_sequences` | Notas JSONB (persisten aunque expiren stems) |
| `processing_jobs` | Cola/estado; Realtime para UI de upload |
| `subscriptions` | Stripe (tabla lista; webhook pendiente) |
| `affiliate_products` | Productos afiliados (tabla lista; **UI admin usa localStorage**) |
| `affiliate_clicks` | Tracking clicks (sin implementar en frontend) |
| `song_cache` | Dedup futuro (sin lógica en app aún) |
| `band_rooms` | Salas: code, host_id, song_id, status, play_started_at, tempo |
| `band_members` | Miembros: instrument, guest_name, is_leader |

### Storage buckets

| Bucket | TTL | Uso |
|--------|-----|-----|
| `stems` | 48h (lifecycle) | Originales usuario + stems procesados |
| `featured` | Permanente | MP3/cover canciones destacadas admin |

Migraciones en `supabase/migrations/`. **Nota:** `add_profile_location.sql` tiene un error de sintaxis (coma extra en el INSERT del trigger) — revisar antes de aplicar en prod.

### Post-instalación manual en Supabase Dashboard

1. Auth → Anonymous → habilitar (requerido para `/join`)
2. Replication → `band_rooms`, `band_members`, `processing_jobs`
3. Auth URLs → ver `docs/supabase-auth-urls.md`

---

## 7. Planes y límites

Definidos en `src/lib/plans.ts`:

| Plan | Precio | Canciones incluidas | Notas |
|------|--------|---------------------|-------|
| Free | $0 | 1 | Solo guitarra + piano (restricción **no enforced** en UI aún) |
| Pro | $12.99/mes | 15 | Mostrado como "Basic" en UI |
| Banda | $24.99/mes | 15 (pool compartido en brief) | + sala tiempo real |

- Add-on en UI: `$5` por canción extra (`ADDON_SONG_PRICE`) — distinto del brief original ($2.99/+5)
- Billing anual: 20% descuento (`ANNUAL_DISCOUNT_PERCENT`)
- El límite de upload se enforce por **conteo de canciones** en DB (`POST /api/songs`), no por `songs_used_this_month` (campo existe pero no es la fuente de verdad del límite)
- Admin (`ADMIN_USER_ID`) tiene cuota ilimitada vía `src/lib/admin-privileges.ts`

**Stripe:** UI de upgrade en `/profile` guarda `intended_plan` en profiles y muestra CTA "Completar pago" con **mock** (`completePayment()` hace `setTimeout` + refresh). **No hay checkout real.**

---

## 8. Pantallas — estado detallado

### Leyenda

- ✅ Funcional con backend real
- 🟡 Parcial (mezcla real + mock)
- ⬜ Solo UI/mock
- ❌ No implementado

| Pantalla | Ruta | Estado | Detalle |
|----------|------|--------|---------|
| Landing | `/` | ✅ UI | Hero, pricing, testimonios. CTAs Pro/Banda → signup con `?plan=`; **sin Stripe Checkout** |
| Login | `/login` | ✅ | Supabase email/password + Google OAuth button |
| Signup | `/signup` | ✅ | 2 pasos: datos + ubicación (city/postal). Google OAuth. Email confirm flow |
| Forgot/Reset password | `/forgot-password`, `/reset-password` | ✅ | Flow completo vía `/auth/callback?next=/reset-password` |
| Dashboard | `/dashboard` | 🟡 | Fetch real: biblioteca + destacadas. **Mis Bandas:** salas reales desde `band_rooms` + roster |
| Upload | `/upload` | ✅ | Upload real a Storage + job + Realtime/polling. Límite 50 MB. InstrumentPicker pre-upload |
| Instrument selector | `/instrument` | 🟡 | Fetch real con `?songId=`. Sin songId → demo `LIBRARY[0]`. Free plan no restringe instrumentos |
| Player | `/player` | 🟡 | Demo sin auth. Con auth: audio real, partitura desde `note_sequences`, **turnos "tu turno/espera" derivados de notas transcritas en solo** (si `score.fromDb`). Banda sigue con schedule demo |
| Band | `/band` | ✅ | Picker biblioteca+destacadas (ready), songId UUID real, Realtime lobby, link join |
| Join (invitado) | `/join/[token]` | ✅ | Lookup API + canción real + anonymous auth + join |
| Profile | `/profile` | 🟡 | Lee profile real. Upgrade/cancel/add-on UI sin Stripe |
| Admin | `/admin` | 🟡 | Login Supabase + check admin vía API. **Destacadas: real.** **Afiliados: localStorage** (`loadAdminAffiliates`) |

---

## 9. Flujos técnicos — qué funciona hoy

### 9.1 Upload usuario (happy path)

```
Usuario autenticado → /upload → POST /api/songs (multipart)
  → insert songs (pending → processing)
  → upload MP3 a stems/originals/{id}.mp3
  → insert processing_jobs (queued)
  → dispatchSongProcessing()
       ├─ si AUDIO_PROCESSOR_URL → POST /process al microservicio
       └─ si no → runMockUserProcessor() en background
  → UI subscribe Realtime processing_jobs + polling /api/songs/{id}/job
  → status ready → redirect /instrument?songId=
```

### 9.2 Procesamiento real (audio-processor)

```
FastAPI POST /process (Bearer AUDIO_PROCESSOR_API_KEY)
  → BackgroundTasks → worker.process_song()
  → download MP3 from Supabase
  → Demucs htddemucs_6s
  → RMS filter + instrument_hint del upload
  → upload WAV stems to Storage
  → Basic Pitch → note_sequences JSONB
  → songs.status = ready, processing_jobs completed
```

Ver `services/audio-processor/README.md` y `docs/RAILWAY-DEPLOY.md`.

### 9.3 Player solo (usuario autenticado)

```
/player?songId=uuid
  → fetchSongById + fetchSongScore(instrument)
  → usePlayerAudio: stems signed URLs → Web Audio API
  → instrument seleccionado → gain = 0 (mute) en tu stem
  → AlphaTabViewer si score.fromDb (notesToAlphaTex)
  → windowsFromNotes(score.notes) → ventanas "tu turno"
  → TurnBanner: waiting / ready / live según gaps reales entre notas
  → SheetViewer overlay "Esperando tu parte…" fuera de tus ventanas
```

**Gap default:** 2 beats de silencio entre clusters de notas = nuevo segmento.

### 9.4 Sala de banda

```
Host plan banda → /band → picker canción (biblioteca + destacadas, status=ready)
  → POST /api/band-rooms { songId: UUID, instrument }
  → Supabase Realtime canal band_room:{id}
  → Invitado: /join/{code} → lookup con metadatos de canción → join
  → /player?room={id}&songId={uuid}
  → songId resuelto desde band_rooms.song_id (prioridad sobre localStorage)
  → RLS: user_can_read_song incluye miembros de sala activa (migración add_band_song_access.sql)
  → PATCH /api/band-rooms/{id}/play { action: 'play' }
  → play_started_at del servidor → useBandSync → useBandAudioFollow (stems reales en sync)
  → useBandRoom fallback a demo si API/Realtime falla
```

**QA manual 2 browsers (pendiente verificar en prod):**
1. Host (plan banda) crea sala con canción ready → copia link join
2. Guest abre `/join/{code}` → ve canción real → elige instrumento distinto
3. Ambos en player: roster Realtime con instrumentos correctos
4. Host Play → pre-roll 3s → mismo beat en ambos
5. Audio stems en ambos browsers
6. Host Pause → ambos paran
7. Dashboard host muestra sala con roster/estado real

**Precondiciones prod:** aplicar `supabase/migrations/add_band_song_access.sql`, Realtime ON en `band_rooms`/`band_members`.

### 9.5 Admin — canciones destacadas

```
/admin → tab Destacadas → FeaturedSongForm
  → POST /api/admin/featured-songs (audio + cover + instruments)
  → upload bucket featured + dispatch processor
  → PATCH publish (is_public)
  → aparecen en dashboard vía fetchPublishedCatalogSongs()
```

**Backlog:** transcodificación AAC antes de guardar — `docs/backlog/audio-transcoding-featured-catalog.md`

---

## 10. Autenticación y middleware

- **Middleware:** `src/middleware.ts` → `updateSession()` en `src/lib/supabase/middleware.ts`
- Rutas protegidas: `/dashboard`, `/upload`, `/instrument`, `/band`, `/profile` → redirect `/login?next=`
- `/player` **no** protegida (demo público)
- `/api/admin/*` → 401 si no `ADMIN_USER_ID`
- `/admin` page → gate en `AdminScreen` (no redirect 404 en middleware)

**Providers:** email/password ✅ · Google OAuth UI ✅ (requiere config en Supabase Dashboard) · Anonymous ✅ (join flow)

---

## 11. Componentes y libs clave

| Archivo | Rol |
|---------|-----|
| `src/lib/supabase/client.ts` | Browser client |
| `src/lib/supabase/server.ts` | Server Components + API |
| `src/lib/supabase/admin.ts` | Service role (server only) |
| `src/lib/audio-processor.ts` | Dispatch real vs mock |
| `src/lib/mock-audio-processor.ts` | Simula Demucs cuando no hay processor |
| `src/hooks/usePlayerAudio.ts` | Web Audio multi-stem |
| `src/components/player/AlphaTabViewer.tsx` | Partitura real (cursor only, no player interno) |
| `src/lib/alphatab/notes-to-alphatex.ts` | JSONB → alphaTex |
| `src/hooks/useBandRoom.ts` | Realtime lobby |
| `src/hooks/useBandSync.ts` | Sync beat desde play_started_at |
| `src/hooks/useBandAudioFollow.ts` | Audio stems sigue play_started_at en banda live |
| `src/lib/supabase/fetch-band-rooms.ts` | Salas activas del host (dashboard) |
| `src/lib/supabase/fetch-band-songs.ts` | Canciones elegibles para sala (ready) |
| `src/lib/note-turn-schedule.ts` | Ventanas "tu turno" desde notas transcritas (solo) |
| `src/lib/data.ts` | **Mocks legacy:** LIBRARY, SCORE, DEFAULT_AFFILIATES, getAffiliates() |
| `src/lib/plans.ts` | Límites y precios |
| `src/i18n/strings.ts` | Traducciones ES/EN |

---

## 12. Tests

Vitest configurado (`npm test`). Tests existentes:

- `src/lib/band-sync.test.ts`
- `src/lib/note-turn-schedule.test.ts`
- `src/lib/band-schedule.test.ts`
- `src/lib/band-turn-overlay.test.ts`
- `src/lib/parse-instruments.test.ts`
- `src/lib/alphatab/notes-to-alphatex.test.ts`
- `src/lib/supabase/fetch-song-score.test.ts`

No hay tests E2E ni tests de integración con Supabase/Stripe.

---

## 13. Fuera de scope v1 (NO construir)

Según `memoria.md`:

- Portal de Creador / Explorar (Beta)
- Links de YouTube para procesar
- Detección de pitch por micrófono
- App móvil nativa
- Chat/video en sala de banda
- Tablas creator_* (documentadas pero no creadas)

---

## 14. Trabajo pendiente — priorizado

### 🔴 Crítico (bloquea producción real)

- [ ] **Stripe completo:** `/api/checkout`, `/api/webhooks/stripe`, sync `profiles.plan` + `subscriptions`
- [ ] **Deploy Railway** del audio-processor (≥4 GB RAM) + `AUDIO_PROCESSOR_URL` en Vercel
- [ ] **Validar Demucs** con 7–10 canciones de géneros distintos antes de escalar
- [ ] Corregir migración `add_profile_location.sql` (syntax error)

### 🟠 Importante (v1 incompleto sin esto)

- [ ] **Afiliados en DB:** API admin CRUD + player lee `affiliate_products` (quitar localStorage)
- [x] **Band screen:** songId real biblioteca+destacadas, picker, Realtime lobby
- [x] **Dashboard bandas:** listar `band_rooms` reales con roster
- [x] **Band audio sync:** stems reales en banda live (`useBandAudioFollow`)
- [ ] **Verificar banda en prod:** QA 2 browsers + migración RLS aplicada
- [ ] **Enforce Free plan:** solo guitarra + piano en instrument picker
- [ ] **Resend:** emails bienvenida, confirmación pago, procesamiento listo
- [ ] **Middleware /admin:** redirect 404 para no-admin (hoy solo API admin está protegida)
- [ ] **Pool compartido Banda:** contador a nivel sala/grupo (brief) — hoy es per-user count

### 🟡 Mejoras / polish

- [ ] Loop A–B funcional con audio real (UI existe; verificar integración completa)
- [ ] Tempo 50–150% con pitch preservation en audio real
- [ ] Export MIDI (solo Pro)
- [ ] Tracking `affiliate_clicks`
- [ ] `song_cache` dedup
- [ ] Transcodificación AAC en destacadas (`docs/backlog/audio-transcoding-featured-catalog.md`)
- [ ] Actualizar `GUIA-DESARROLLO.md` para reflejar estado real

### ⬜ Deployment checklist

- [ ] Vercel: todas las env vars
- [ ] Supabase Auth URLs producción + localhost
- [ ] Stripe webhook URL producción
- [ ] Verificación final (auth, RLS, upload→player, banda 2 browsers, admin)

---

## 15. Decisiones técnicas activas

| Decisión | Detalle |
|----------|---------|
| Mock fallback | Sin `AUDIO_PROCESSOR_URL`, todo el pipeline de upload funciona pero con audio/notas placeholder |
| Sin Redis/BullMQ | Processor usa FastAPI BackgroundTasks, no cola Redis como decía el brief original |
| Límite canciones | Count de filas en `songs`, no `songs_used_this_month` |
| alphaTab | Solo cursor visual; audio controlado por Web Audio API propio |
| Admin afiliados | localStorage temporal — tabla `affiliate_products` existe pero no conectada |
| Nombre Pro en UI | Se muestra como "Basic" (`getPlanLabel`) |
| Detección instrumentos | Manual pre-upload siempre; auto post-Demucs solo con processor real |

---

## 16. Cómo usar este doc con otro agente

**Al iniciar sesión con Claude (u otro agente), pega:**

1. Este archivo completo (`docs/PROJECT-STATUS.md`)
2. Si vas a trabajar en producto/UX: sección relevante de `memoria.md`
3. Si vas a tocar SQL: `supabase/full_schema.sql`
4. **No pegues** `.env.local` (secretos)

**Frases útiles para el agente:**

- "Lee `docs/PROJECT-STATUS.md` — ahí está el estado real del proyecto"
- "El checklist en `GUIA-DESARROLLO.md` está desactualizado; confía en PROJECT-STATUS"
- "Antes de implementar Stripe, verifica que no existen rutas `/api/checkout` ni `/api/webhooks/stripe`"

**Orden recomendado de trabajo restante:**

```
1. Railway deploy + probar upload→player con audio real end-to-end
2. Stripe checkout + webhooks + enforce planes
3. Afiliados DB + admin API
4. Band: songId real + dashboard salas reales + test sync 2 browsers
5. Resend emails
6. Deploy Vercel prod + verificación final
7. Polish (loop, tempo, MIDI export, song_cache)
```

---

## 17. Commits recientes (contexto)

```
71cc49b added demucs and notes converter
ed49004 modified feature song
79efc85 modified supabase user song storage
bd757d5 modified player sheetviewer
e3433b0 modified admin
5a627ca modified screen dashboard
...
b36ba40 added component forgotpassword
8de88922 modified app database
```

El proyecto avanzó significativamente desde que se generó `GUIA-DESARROLLO.md`. La integración Supabase + upload + processor + player parcial es el bloque más reciente de trabajo.

---

## 18. Archivos que NO tocar sin contexto

- `memoria.md` — fuente de verdad de producto; no cambiar decisiones de scope v1
- `supabase/full_schema.sql` — schema canónico; preferir migrations incrementales
- `.env.local` — secretos locales; nunca commitear
- `src/lib/data.ts` — mocks aún usados en demo player, band fallback, afiliados; migrar gradualmente a Supabase
