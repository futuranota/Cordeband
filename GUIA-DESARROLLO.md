# Cordeband — Guía de Desarrollo

> Generada por agent-guide-dev  
> Stack: Next.js 16 + TypeScript + Supabase + Stripe + Railway (Demucs/Basic Pitch) + alphaTab + Web Audio API  
> Scope: **v1** — práctica solo, sala de banda, panel admin. Sin Portal de Creador ni Explorar (Beta).

---

## Cómo usar esta guía

1. Lee cada tarea antes de empezarla.
2. Marca con `- [x]` cuando la completes.
3. No saltes al siguiente bloque si hay tareas sin completar en el actual.
4. Referencia de producto: [`memoria.md`](memoria.md) (Design + Tech Brief + precios).

---

## Estado actual del prototipo (ya hecho)

El repo tiene **UI funcional con datos mock** (`localStorage` + `lib/data.ts`). Lo marcado `[x]` abajo ya existe como prototipo visual; falta conectarlo a backend real.

---

## Bloque 0 — Setup inicial

- [x] **Crear proyecto Next.js con TypeScript** — App Router en `src/app/`
- [x] **Instalar dependencias core** — `next`, `react`, `@supabase/supabase-js`, `@supabase/ssr`, `stripe`, `@stripe/stripe-js`, `resend`, `zustand`, `@coderline/alphatab`
- [x] **Estructura de carpetas base** — `src/app`, `src/components`, `src/lib`, `src/i18n`
- [x] **Sistema visual con CSS Variables** — `globals.css`, `app-flow.css`, acento azul `#4fb8ff`
- [x] **i18n ES/EN** — `src/i18n/strings.ts` + `context.tsx` con `t()` y `tList()`
- [x] **Documento de memoria** — `memoria.md` con Design Brief, Tech Brief y precios
- [x] **Límites de plan en código** — `src/lib/plans.ts` (Free: 1, Pro/Banda: 15/mes)
- [ ] **Crear `.env.example`** — todas las variables del Tech Brief (sin secretos)
- [ ] **Verificar `tsconfig.json` paths** — alias `@/` funcionando
- [ ] **Crear carpeta `services/audio-processor/`** — microservicio Python para Railway
- [ ] **Validar Demucs localmente** — `pip install demucs && demucs -n htdemucs_6s` con 10 canciones de géneros distintos (gate de calidad antes de producción)

---

## Bloque 1 — Base de datos (Supabase)

- [ ] **Crear proyecto en Supabase** — copiar URL, anon key, service role key
- [ ] **Crear tabla `profiles`** — id (FK auth.users), email, plan, songs_used_this_month, stripe_customer_id
- [ ] **Crear trigger `on_auth_user_created`** — auto-insert en `profiles` al registrarse
- [ ] **Crear tabla `songs`** — title, artist, status, is_featured, featured_storage_url, user_id, bpm, key_signature, etc.
- [ ] **Crear tabla `stems`** — song_id, instrument_type, storage_url, storage_path, midi_url
- [ ] **Crear tabla `note_sequences`** — notes JSONB, tab_data JSONB, stem_id, song_id
- [ ] **Crear tabla `processing_jobs`** — status, progress_pct, song_id (para Realtime)
- [ ] **Crear tabla `subscriptions`** — stripe_subscription_id, plan, status, current_period_end
- [ ] **Crear tabla `affiliate_products`** — instrument_type, name, image_url, affiliate_url, platform, is_active, sort_order
- [ ] **Crear tabla `affiliate_clicks`** — product_id, user_id, song_id, instrument_context
- [ ] **Crear tabla `song_cache`** — source_url_hash, reference_song_id, use_count
- [ ] **Crear tabla `band_rooms`** — leader_user_id, song_id, room_code, status, play_started_at
- [ ] **Crear tabla `band_members`** — room_id, user_id, guest_name, instrument_selected, status
- [ ] **Activar RLS en todas las tablas** — candado cerrado verificado en Table Editor
- [ ] **Política RLS `profiles`** — usuario solo ve/edita su perfil
- [ ] **Política RLS `songs`** — propias + lectura pública de `is_featured = true`
- [ ] **Política RLS `affiliate_products`** — lectura pública activos; escritura solo `ADMIN_USER_ID`
- [ ] **Política RLS `band_rooms` / `band_members`** — miembros de sala pueden leer; líder puede modificar sala
- [ ] **Configurar Supabase Storage** — bucket `stems` con TTL 48h; bucket `featured` permanente
- [ ] **Crear `src/lib/supabase/client.ts`** — `createBrowserClient()` para Client Components
- [ ] **Crear `src/lib/supabase/server.ts`** — `createServerClient()` para Server Components y API Routes
- [ ] **Probar trigger de profiles** — registro de prueba crea fila en `profiles`

---

## Bloque 2 — Autenticación

- [x] **UI `/signup` y `/login`** — `SignupForm.tsx` con layout `.auth-wrap` + `LandingNav`
- [ ] **Reemplazar mock auth** — quitar `localStorage cordeband_state_v1` como fuente de verdad
- [ ] **Configurar Supabase Auth** — email/password + Google OAuth
- [ ] **Server Actions o API para registro** — crear usuario + perfil `plan: free`
- [ ] **Server Actions o API para login** — sesión Supabase SSR
- [ ] **Crear `middleware.ts`** — proteger rutas `(app)/*` excepto `/player` demo
- [ ] **Actualizar `(app)/layout.tsx`** — leer sesión real con `createServerClient()`
- [ ] **Implementar logout** — `AppNav` limpia sesión Supabase
- [ ] **Probar flujo** — registro → dashboard → logout → login

---

## Bloque 3 — Layout base y navegación

- [x] **`LandingNav`** — links landing, login, signup, idioma
- [x] **`AppNav`** — biblioteca, practicar, banda, suscripción, avatar menu
- [x] **`Footer`** — logo + derechos
- [x] **Componentes UI base** — `.btn`, `.card`, `.pill`, `.input`, `icons.tsx`
- [x] **Responsividad básica** — grids en `app-flow.css` breakpoints ~837px
- [ ] **Extraer `Modal` reutilizable** — límite de canciones del plan (copy en `strings.modal`)
- [ ] **Conectar `AppNav` plan badge** — leer `profiles.plan` desde Supabase, no hardcode

---

## Bloque 4 — Landing (`/`)

- [x] **`HeroSection`** — CTA signup + demo `/player`, guitar asset, demo card
- [x] **`HowSection`** — 3 pasos alineados a ref
- [x] **`InstrumentsSection`** — strip de instrumentos
- [x] **`BandShareSection`** — CTA cyan, roster mock
- [x] **`PricingSection` + `PriceCard`** — Free $0, Pro $12.99, Banda $24.99
- [x] **`TestimonialSection`** — testimonios mock
- [x] **`HeroMotion`** — animación de fondo
- [ ] **Conectar CTAs Pro/Banda a Stripe Checkout** — cuando Stripe esté listo (Bloque 8)

---

## Bloque 5 — Dashboard (`/dashboard`)

- [x] **`DashboardScreen`** — `.song-grid`, `.song-card`, `.stems-pill`, destacadas, bandas
- [x] **Medidor de canciones del mes** — usa `monthlySongLimit()` de `plans.ts`
- [x] **`StemsStatus`** — TTL visual con `stemsMsLeft()`
- [x] **Empty state** — invitar a subir primera canción
- [ ] **Fetch canciones desde Supabase** — `songs` del usuario + `is_featured` públicas
- [ ] **Enforzar límite Free (1 bienvenida)** — bloquear upload si `songs_used_this_month >= limit`
- [ ] **Enforzar límite Pro (15/mes)** — modal upgrade al superar
- [ ] **Mostrar modal límite** — componente con `strings.modal.*`
- [ ] **Incrementar `songs_used_this_month`** — al completar procesamiento (webhook o API)

---

## Bloque 6 — Upload (`/upload`)

- [x] **`UploadScreen`** — `.dropzone`, `.proc-card`, `.proc-steps` (simulación)
- [ ] **Subir MP3 a Supabase Storage** — signed URL o direct upload
- [ ] **Crear registro `songs` status `pending`** — API Route `POST /api/songs`
- [ ] **Disparar procesamiento en Railway** — `POST /process { song_id, storage_path }`
- [ ] **Suscribirse a `processing_jobs` via Realtime** — actualizar UI sin polling
- [ ] **Redirigir a `/instrument` al `status: completed`**
- [ ] **Flujo reactivar stems vencidos** — re-upload MP3, conservar `note_sequences`
- [ ] **Validar tamaño archivo** — máx 50 MB / 10 min (decisión pendiente en memoria)

---

## Bloque 7 — Microservicio audio (Railway)

- [ ] **Scaffold FastAPI** — `services/audio-processor/main.py`
- [ ] **Instalar Demucs + Basic Pitch + rq/redis** — `requirements.txt`
- [ ] **Dockerfile con modelo Demucs pre-descargado** — evitar 400MB en cada deploy
- [ ] **Endpoint `POST /process`** — auth con `AUDIO_PROCESSOR_API_KEY`
- [ ] **Worker: descargar MP3** — desde Supabase Storage
- [ ] **Worker: Demucs htdemucs_6s** — 6 stems WAV
- [ ] **Worker: subir stems a Storage** — path `songs/{id}/stems/{instrument}.wav`, TTL 48h
- [ ] **Worker: Basic Pitch por stem** — mono, guardar `note_sequences.notes` JSONB
- [ ] **Worker: actualizar `songs.status = ready`** — y `processing_jobs.status = completed`
- [ ] **Borrar MP3 original de terceros** — tras procesar (decisión legal)
- [ ] **Deploy en Railway** — Redis + worker + API
- [ ] **Probar integración end-to-end** — upload desde Vercel → Railway → Supabase → Realtime

---

## Bloque 8 — Selector de instrumento (`/instrument`)

- [x] **`InstrumentScreen`** — `.inst-grid`, `StagePanel`, persist `cordeband_instrument`
- [ ] **Leer instrumentos detectados desde `stems` reales** — no mock `LIBRARY[0].instruments`
- [ ] **Restringir Free a guitarra + piano** — deshabilitar otros en plan free
- [ ] **Guardar selección en DB** — opcional: `user_preferences` o session

---

## Bloque 9 — Reproductor (`/player`)

- [x] **`PlayerScreen`** — layout `.player`, transport, mixer, turn banner, aff rail collapse
- [x] **`StagePanel`** — tarima `.stage-floor`
- [x] **`SheetViewer`** — partitura SVG mock con scroll sincronizado
- [ ] **Crear `src/stores/playerStore.ts` (Zustand)** — stems, instrumento, posición, playing
- [ ] **Cargar stems como AudioBuffer** — Web Audio API desde Supabase Storage URLs
- [ ] **GainNode por stem** — instrumento del usuario en `gain = 0`
- [ ] **Reemplazar `SheetViewer` mock por alphaTab** — cursor visual; audio vía Web Audio propio
- [ ] **Cargar `note_sequences` desde Supabase** — convertir JSONB a alphaTex
- [ ] **Loop A–B funcional con audio real** — no solo UI
- [ ] **Tempo 50–150% con pitch preservation** — `playbackRate` o librería
- [ ] **Export MIDI** — solo plan Pro (generar desde `note_sequences`)
- [ ] **Descargar MP3 sin instrumento** — requiere auth; mock hoy redirige a `/signup`
- [ ] **`AffiliateRail` desde `affiliate_products`** — reemplazar `DEFAULT_AFFILIATES` + localStorage admin
- [ ] **Registrar clicks en `affiliate_clicks`** — al abrir producto

---

## Bloque 10 — Sala de banda (`/band`) — Plan Banda

- [x] **`BandScreen` UI mock** — crear sala, copiar link, roster
- [ ] **API `POST /api/band-rooms`** — crear sala, generar `room_code` único (6 chars)
- [ ] **Ruta invitado `/band/[code]`** — entrada con nombre (guest) o login
- [ ] **Insertar `band_members`** — al unirse
- [ ] **Componente `BandLobby`** — lista miembros, estados joined/ready/choosing
- [ ] **Componente `BandMemberCard`** — avatar, instrumento, estado
- [ ] **Supabase Realtime canal `band_room:{id}`** — subscribe `band_members` + `band_rooms`
- [ ] **Componente `SyncPlayButton`** — solo líder; `PATCH` status `playing` + `play_started_at = NOW()`
- [ ] **Hook `useBandSync`** — calcular offset `Date.now() - play_started_at`, arrancar AudioContext
- [ ] **Vista invitado en lobby** — esperar Play del líder
- [ ] **Enforzar plan Banda** — solo usuarios con `profiles.plan = banda` crean salas
- [ ] **Pool compartido 15 canciones/mes** — contador a nivel de sala/grupo, no por usuario

---

## Bloque 11 — Perfil (`/profile`)

- [x] **`ProfileScreen` UI** — plan actual, medidor, stats mock
- [ ] **Leer `profiles` + `subscriptions` desde Supabase**
- [ ] **Botón upgrade → Stripe Checkout** — Pro $12.99 / Banda $24.99
- [ ] **Botón cancelar suscripción** — Stripe Customer Portal
- [ ] **Mostrar add-ons** — +5 ($2.99) / +10 ($4.99) canciones ese mes

---

## Bloque 12 — Panel Admin (`/admin`)

- [x] **`AdminScreen` UI mock** — tabs afiliados + destacadas, localStorage
- [ ] **Proteger `/admin` en `middleware.ts`** — `session.user.id === ADMIN_USER_ID` → sino redirect `/404`
- [ ] **Quitar login mock por email** — usar Supabase session + env `ADMIN_USER_ID`
- [ ] **API `POST /api/admin/affiliates`** — verificar admin server-side
- [ ] **API `PATCH /api/admin/affiliates/[id]`** — activar/desactivar
- [ ] **Componente `AdminAffiliateForm`** — con vista previa `.aff-preview` (parcial en UI)
- [ ] **API `PATCH /api/admin/songs/[id]/feature`** — `is_featured = true`, mover MP3 a storage permanente
- [ ] **Upload canción destacada** — mismo pipeline Demucs; flag featured al publicar
- [ ] **Probar que usuarios normales reciben 404 en `/admin`**

---

## Bloque 13 — Stripe

- [ ] **Crear cuenta Stripe (modo Test)**
- [ ] **Crear producto Pro** — $12.99/mes → copiar `STRIPE_PRO_PRICE_ID`
- [ ] **Crear producto Banda** — $24.99/mes → copiar `STRIPE_BANDA_PRICE_ID`
- [ ] **Crear precios add-on** — +5 canciones $2.99, +10 $4.99 (one-time)
- [ ] **API `POST /api/checkout`** — crear Stripe Checkout Session según plan
- [ ] **API `POST /api/webhooks/stripe`** — verificar firma `STRIPE_WEBHOOK_SECRET`
- [ ] **Handler `customer.subscription.created/updated`** — `profiles.plan` = pro | banda
- [ ] **Handler `customer.subscription.deleted`** — volver a `free`
- [ ] **Handler add-on payment** — incrementar cupo de canciones del mes
- [ ] **Probar tarjeta test `4242 4242 4242 4242`**
- [ ] **Probar cancelación** — plan vuelve a free al period end

---

## Bloque 14 — Emails (Resend)

- [ ] **Crear cuenta Resend** — API key
- [ ] **Verificar dominio** — registros DNS
- [ ] **Template bienvenida** — al registrarse
- [ ] **Template confirmación pago** — upgrade Pro/Banda
- [ ] **Template invitación sala** — opcional, link `band/[code]`
- [ ] **Template procesamiento listo** — canción ready (alternativa a solo Realtime)
- [ ] **Probar envío en staging**

---

## Bloque 15 — Deployment

### GitHub

- [ ] **Revisar `.gitignore`** — `.env*`, `.next`, `node_modules`
- [ ] **Verificar que secretos no están en el repo**
- [ ] **Push branch `nextjs-migration` o `main`** — según estrategia del equipo

### Vercel

- [ ] **Conectar repo a Vercel**
- [ ] **Agregar todas las variables de entorno**
- [ ] **Primer deploy** — build sin errores
- [ ] **Actualizar Supabase Auth URLs** — Site URL + Redirect URLs con dominio Vercel
- [ ] **Actualizar Stripe webhook URL** — dominio producción
- [ ] **Configurar `NEXT_PUBLIC_APP_URL`**

### Railway

- [ ] **Deploy microservicio audio** — URL en `AUDIO_PROCESSOR_URL`
- [ ] **Configurar Redis** — `REDIS_URL` en worker y API
- [ ] **Probar job de procesamiento desde preview Vercel**

### Post-deploy

- [ ] **Flujo completo en producción** — registro → upload → procesamiento → instrument → player
- [ ] **Sala de banda con 2 browsers** — sync Play dentro de ~300ms
- [ ] **Stripe Test en producción**
- [ ] **Dominio personalizado** — cuando esté listo
- [ ] **Stripe Live** — solo con usuarios reales

---

## Bloque 16 — Verificación final

- [ ] **Auth** — registro, login, logout, sesión persiste, rutas protegidas
- [ ] **RLS** — usuario A no ve canciones de usuario B
- [ ] **Límites de plan** — Free 1, Pro 15, Banda pool 15 enforced
- [ ] **Procesamiento** — MP3 → stems → notas → Realtime → redirect
- [ ] **Reproductor** — audio real, partitura sincronizada, mute del instrumento
- [ ] **Stems TTL 48h** — expiran; partitura persiste; reactivar funciona
- [ ] **Stripe** — checkout, webhook, cambio de plan en UI
- [ ] **Banda** — lobby Realtime, Play sincronizado, invitado sin cuenta
- [ ] **Admin** — solo owner; afiliados y destacadas en producción
- [ ] **i18n** — ES/EN en todas las pantallas críticas
- [ ] **Sin secrets en cliente** — `SUPABASE_SERVICE_ROLE_KEY` solo server
- [ ] **Consola limpia** — sin warnings React ni errores en producción
- [ ] **Mobile** — landing, dashboard, player usables en viewport estrecho

---

## Variables de entorno requeridas

- [ ] `NEXT_PUBLIC_SUPABASE_URL` → Supabase Dashboard → Settings → API
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Supabase Dashboard → Settings → API
- [ ] `SUPABASE_SERVICE_ROLE_KEY` → Supabase (solo server, nunca cliente)
- [ ] `STRIPE_SECRET_KEY` → Stripe Dashboard → Developers → API keys
- [ ] `STRIPE_WEBHOOK_SECRET` → Stripe → Webhooks → endpoint signing secret
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Stripe Dashboard
- [ ] `STRIPE_PRO_PRICE_ID` → Stripe → Products → Pro $12.99/mes
- [ ] `STRIPE_BANDA_PRICE_ID` → Stripe → Products → Banda $24.99/mes
- [ ] `STRIPE_ADDON_5_PRICE_ID` → add-on +5 canciones $2.99
- [ ] `STRIPE_ADDON_10_PRICE_ID` → add-on +10 canciones $4.99
- [ ] `RESEND_API_KEY` → Resend Dashboard
- [ ] `RESEND_FROM_EMAIL` → dominio verificado (ej. `hola@cordeband.com`)
- [ ] `AUDIO_PROCESSOR_URL` → Railway deploy URL
- [ ] `AUDIO_PROCESSOR_API_KEY` → generar secret interno Vercel ↔ Railway
- [ ] `REDIS_URL` → Railway Redis plugin
- [ ] `ADMIN_USER_ID` → UUID de tu usuario en Supabase Auth
- [ ] `NEXT_PUBLIC_APP_URL` → `https://tu-dominio.vercel.app`

---

## Notas del proyecto

- **Nombre producto:** Instrumently en briefs; código y marca actual: **Cordeband**.
- **Demucs NUNCA en Vercel** — solo Railway (RAM + timeout).
- **Audio de banda NO viaja por red** — solo `play_started_at` del servidor; cada browser tiene stems locales.
- **MP3 de terceros:** borrar original post-proceso; stems TTL 48h; `note_sequences` permanente.
- **Canciones destacadas (`is_featured`):** MP3 permanente; solo admin activa el flag.
- **Free:** 1 canción de bienvenida + guitarra y piano solamente.
- **Pro:** $12.99/mes, 15 canciones/mes.
- **Banda:** $24.99/mes, 15 canciones/mes **pool compartido** + sala tiempo real.
- **Fuera de v1:** Portal Creador, Explorar, pitch por micrófono, app móvil, YouTube links.
- **Próximo paso crítico antes de escalar:** validar Demucs en 7/10 canciones de géneros distintos.

---

## Orden recomendado (resumen)

```
0. Validar Demucs local
1. Supabase schema + RLS + Storage
2. Auth real (reemplazar mock)
3. Upload → Railway → Realtime → Dashboard con datos reales
4. Web Audio + alphaTab en Player
5. Stripe planes + límites enforced
6. Banda Realtime + sync Play
7. Admin server-side
8. Resend emails
9. Deploy Vercel + Railway
10. Verificación final
```
