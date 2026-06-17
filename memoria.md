# Instrumently — Memoria del producto

> Documento de referencia: visión de producto, pantallas, flujos, stack e integraciones planificadas.

El prototipo actual en este repo se llama **Coderband / Cordeband**; **Instrumently** es el nombre de producto definido en estos briefs.

## Índice

- [Instrumently — Design Brief](#instrumently--design-brief)
- [Instrumently — Tech Brief](#instrumently--tech-brief)
- [Planes y precios (revisado)](#planes-y-precios-revisado)

---

# Instrumently — Design Brief

> El karaoke para músicos: practica solo, toca en banda en tiempo real, y monetiza tu música original.

---

## Qué es este producto

Instrumently es una app web con tres capas de valor que crecen con el músico:

**Capa 1 — Práctica solo (todos los planes)**
El usuario sube el MP3 de la canción que quiere aprender, elige su instrumento, y la app hace el resto: elimina ese instrumento de la mezcla y muestra la partitura o tablatura sincronizada en pantalla avanzando sola — exactamente como el karaoke, pero en vez de letras, son notas musicales.

**Capa 2 — Sala de banda en tiempo real (Plan Banda $24.99/mes)**
El líder de banda crea una sala con un ID único, invita a sus músicos vía link, cada quien entra y escoge su instrumento. Cuando el líder presiona Play, todos los browsers arrancan sincronizados al mismo tiempo — cada músico ve las notas de su instrumento avanzando en su pantalla mientras todos tocan la misma pieza juntos, en tiempo real.

**Capa 3 — Portal de creador (Beta — no incluido en v1)**
Si el músico tiene música original o generada con AI verificada por el equipo de Instrumently, puede publicarla en la plataforma y monetizarla — insertando sus propios links de afiliados (Amazon, Etsy, Shopify) o productos físicos propios. Otros usuarios pueden descubrir esa música, practicarla, y comprar los productos del creador.

---

## Usuarios objetivo

- **Usuario Free/Pro:** Músico aficionado o intermedio que quiere practicar canciones reales con su instrumento
- **Usuario Banda:** Músico que toca con otros — quiere coordinar sesiones de práctica grupal a distancia
- **Usuario Creador:** Músico con música original que quiere monetizar su trabajo y su audiencia dentro de la plataforma
- **Nivel técnico:** Básico-medio. Sabe usar apps web, no necesariamente conoce términos musicales técnicos
- **Contexto de uso:** En casa, con su instrumento a mano. Sesiones de 20-60 minutos

---

## Planes

> Ver [Planes y precios (revisado)](#planes-y-precios-revisado) para la estructura actualizada, rationale de costos y pool compartido del plan Banda.

| Plan | Precio | Para quién |
|---|---|---|
| **Free** | $0 | 1 canción de bienvenida al registrarse — probar el producto |
| **Pro** | $12.99/mes | Músico activo — 15 canciones/mes, todos los instrumentos, tabs, tempo, loops, export MIDI |
| **Banda** | $24.99/mes | Grupo que ensaya junto — 15 canciones/mes (pool compartido) + sala en tiempo real |
| **Add-on** | $2.99 | +5 canciones adicionales ese mes (puntual) |

---

## Planes y precios (revisado)

### Resumen final de precios

| Plan | Precio | Canciones | Para quién |
|---|---|---|---|
| **Free** | $0 | 1 (bienvenida) | Probar el producto |
| **Pro** | $12.99/mes | 15/mes | Músico que practica solo activamente |
| **Banda** | $24.99/mes | 15/mes (pool compartido) | Grupo que ensaya junto |
| **Add-on** | $2.99 | +5 ese mes | Quien necesita más puntualmente |
| **Add-on** | $4.99 | +10 ese mes | Quien necesita más puntualmente |

### Estructura por plan

**FREE**

- 1 canción de bienvenida (solo al registrarse)
- Partitura guardada indefinidamente
- 2 instrumentos (guitarra y piano)

**PRO — $12.99/mes**

- 15 canciones/mes
- Todos los instrumentos
- Guitar tabs + notación estándar
- Control de tempo
- Loop A-B
- Export MIDI

**BANDA — $24.99/mes**

- 15 canciones/mes compartidas entre la banda (no 15 por usuario — 15 del pool de la sala)
- Sala de banda en tiempo real
- Miembros ilimitados por sala
- Salas ilimitadas

### ¿Cuántas canciones consume un músico de banda en promedio?

Un músico en una banda activa típicamente:

- **Ensayo semanal** = 8-12 canciones en el setlist activo
- **Canciones nuevas por mes** = 2-4 (las que están aprendiendo)
- **Canciones que ya saben** = no necesitan reprocesar (partitura guardada)

El patrón real es: el primer mes consume más (sube todo el setlist), los meses siguientes consume mucho menos porque la partitura ya está guardada y solo necesita el audio.

| Período | Consumo típico |
|---|---|
| Mes 1 (onboarding de banda) | 8-12 canciones |
| Mes 2 en adelante | 2-4 canciones nuevas/mes |

**Conclusión:** 20 canciones/mes es demasiado para uso recurrente, pero perfecto para el mes de arranque.

### El problema real del plan Banda

El costo no es solo las canciones — es también la sala de banda con Supabase Realtime activo. Pero ese costo es mínimo comparado con el procesamiento.

**El verdadero diferenciador del plan Banda no debería ser "más canciones" sino la experiencia de tocar juntos** — eso es lo que justifica el precio mayor.

### El pool compartido de canciones en Banda

Esta es la idea más importante: en vez de dar 20 canciones por usuario, dar **15 canciones compartidas del grupo**.

**Ejemplo — Banda de 4 músicos, plan Banda $24.99:**

1. El líder sube "Wonderwall" — cuenta 1 canción del pool
2. Los 4 miembros practican esa misma canción
3. Solo se procesó 1 vez, no 4
4. Cobras $24.99, gastaste ~$0.10

Esto resuelve el problema de costos porque una banda no necesita 20 canciones distintas — necesitan las mismas canciones para todos.

### Por qué subir los precios

| Plan | Antes | Ahora | Cambio |
|---|---|---|---|
| Pro | $9.99/mes | $12.99/mes | +$3 |
| Banda | $19.99/mes | $24.99/mes | +$5 |

**Dos razones:**

1. **El caché no es perfecto al inicio.** Hasta tener una biblioteca grande de canciones ya procesadas, cada canción cuesta ~$0.10 real. Con 15 canciones/mes en Pro:
   - Costo por usuario Pro: 15 × $0.10 = **$1.50/mes**
   - Margen a $12.99: **$11.49** por usuario ✓
   - Margen a $9.99: **$8.49** por usuario (muy ajustado si escala)

2. **Músicos de banda pagan más por herramientas de práctica.** Aplicaciones como Yousician cobran $19.99/mes y Tomplay $9.99/mes solo por catálogo fijo. Instrumently ofrece cualquier canción + sala en tiempo real — el precio está justificado.

### Cuándo subir el precio o el límite

Si un usuario Pro escribe diciendo que se quedó sin canciones consistentemente, ese es el momento de añadir un add-on de canciones extra:

- **+5 canciones adicionales** = $2.99 (one-time ese mes)
- **+10 canciones adicionales** = $4.99

Esto es mejor que subir el límite del plan porque captura el ingreso extra solo de los usuarios que realmente lo necesitan, sin cambiar el precio para todos.

---

## Pantallas y vistas

### 1. Landing / Home (usuario no autenticado)

- **Propósito:** Comunicar las tres capas del producto y convertir visitantes en usuarios
- **Elementos clave:**
  - Título principal que describe el producto en una frase
  - Motion loop de fondo: notas musicales flotando + silueta de instrumento musical — animación suave y continua sobre fondo beige
  - Sección de planes con los tres niveles (Free / Pro / Banda)
  - El Plan Banda se presenta como "toca con tu banda, desde donde estés"
- **Acciones disponibles:** Registrarse, iniciar sesión, ver demo
- **Tono:** Musical, editorial, accesible — no técnico

### 2. Dashboard (biblioteca personal)

- **Propósito:** Ver todas las canciones procesadas y acceder a salas de banda
- **Elementos clave:**
  - Grid de SongCards (canciones propias procesadas)
  - Sección "Mis Bandas" — lista de salas de banda creadas o a las que pertenece (solo Plan Banda)
  - Indicador de canciones restantes del plan Free
- **Estado vacío:** Mensaje invitando a subir la primera canción

### 3. Agregar canción (upload + procesamiento)

- **Propósito:** El usuario sube su MP3 y espera el procesamiento
- **Elementos clave:** Drag & drop, estados de procesamiento en tiempo real, indicación de tiempo estimado
- **Decisión tomada:** Solo upload directo — no links de YouTube. Si no tiene el MP3, sugerencia de comprarlo en Amazon Music

### 4. Selector de instrumento

- **Propósito:** El usuario elige qué instrumento va a practicar
- **Elementos clave:** Grid visual de instrumentos disponibles en esa canción. Un click, sin formularios.

### 5. Reproductor + Partitura (práctica solo)

- **Propósito:** El corazón del producto individual
- **Elementos clave:**
  - Zona de partitura/tablatura con cursor sincronizado al audio
  - Controles: play/pause, barra de progreso, stem mixer, control de tempo
  - Panel lateral discreto: productos afiliados del instrumento seleccionado (plataforma) O productos del creador (si es canción de un creador verificado)
- **Scroll:** Automático, suave, sincronizado. El usuario puede también scrollear manualmente

### 6. Sala de Banda (Plan Banda)

- **Propósito:** Espacio de práctica grupal en tiempo real
- **Elementos clave:**
  - **Vista del líder (admin de sala):**
    - Lista de invitados conectados con nombre + instrumento elegido
    - Métrica: "X músicos en sala ahora"
    - Botón Play grande — cuando el líder lo presiona, todos arrancan
    - Estado de cada miembro: conectado / eligiendo instrumento / listo
  - **Vista del invitado:**
    - Pantalla de entrada: campo de nombre (si es invitado sin cuenta) o login
    - Selector de instrumento
    - Partitura de su instrumento específico con cursor sincronizado
    - Indicador de quién más está en la sala y qué toca cada quien
  - **Panel lateral (ambas vistas):** lista de miembros activos como avatars o iniciales con su instrumento
- **Flujo de sincronización:** El comando Play viaja por Supabase Realtime con timestamp — cada browser arranca su stem local en el mismo instante. El audio no viaja por internet, solo el comando.
- **Acceso de invitados:** Pueden entrar sin cuenta insertando solo su nombre. Opcionalmente pueden crear cuenta durante o después de la sesión.

### 7. Perfil / Suscripción

- **Propósito:** Gestionar plan, ver uso, upgrade
- **Elementos clave:** Plan actual, uso del mes, historial, botón de upgrade, cancelación

### 8. Panel de Admin — solo tú, acceso privado por user_id (v1)

- **Propósito:** Tu espacio privado para gestionar los contenidos de la plataforma antes de abrirlo a creadores externos
- **Ruta:** `/admin` — protegida, solo accesible con tu user_id específico. Invisible para cualquier otro usuario
- **Dos secciones principales:**

**Sección A — Gestor de Afiliados**

- Tabla de todos los `affiliate_products` activos con columnas: imagen, nombre, instrumento, plataforma, precio, estado (activo/inactivo)
- Botón "Agregar producto" → formulario: nombre, imagen URL, link de afiliado, plataforma (Amazon/Etsy/Shopify), precio a mostrar, instrumento al que aplica, orden de aparición
- Botón editar / activar / desactivar por producto
- Vista previa de cómo se verá la card en el reproductor

**Sección B — Gestor de Canciones Destacadas**

- Subir tu propia música (mismo flujo de procesamiento que cualquier usuario, pero con flag `is_featured = true`)
- Lista de canciones destacadas activas con opción de publicar/ocultar
- Estas canciones aparecen en el dashboard de todos los usuarios como sección "Canciones para practicar" — no requieren que el usuario suba su propio MP3

### 9. Portal de Creador — ⏸ BETA (no incluido en v1)

Guardado para después de validar adopción del Plan Banda. Abrirá el Gestor de Admin a creadores externos con verificación.

### 10. Explorar — ⏸ BETA (no incluido en v1)

Depende del Portal de Creador.

---

## Flujos de usuario principales

### Flujo 1 — Primera vez (onboarding)

1. Usuario llega al landing, ve el motion loop de notas musicales
2. Se registra con email o Google
3. Ve el dashboard vacío → sube su primer MP3
4. Espera el procesamiento (1-3 min) con estados claros
5. Selecciona instrumento → entra al reproductor → practica

### Flujo 2 — Crear sala de banda (Plan Banda)

1. Usuario con Plan Banda va al dashboard → "Crear Sala"
2. Nombra la sala, selecciona la canción a practicar
3. Copia el link de invitación y lo comparte a sus músicos
4. Ve el lobby: quién se fue uniendo, qué instrumento eligió cada quien
5. Cuando todos están listos → presiona Play → todos arrancan sincronizados

### Flujo 3 — Unirse como invitado a sala de banda

1. Invitado recibe el link
2. Abre el link → ve pantalla de entrada: "Insertar nombre" (o login si tiene cuenta)
3. Selecciona su instrumento
4. Ve el lobby esperando que el líder dé Play
5. El líder presiona Play → ve su partitura sincronizada

### Flujo 4 — Tú (admin) agregas un producto afiliado

1. Entras a `/admin` con tu cuenta
2. Sección "Afiliados" → click "Agregar producto"
3. Rellenas: nombre, imagen, link de afiliado, instrumento, precio, plataforma
4. Activas el producto → aparece inmediatamente en el reproductor para ese instrumento
5. Puedes desactivarlo en cualquier momento sin borrarlo

### Flujo 5 — Tú (admin) subes una canción destacada

1. Entras a `/admin` → sección "Canciones Destacadas"
2. Subes tu MP3 (mismo proceso que cualquier usuario — Demucs lo procesa)
3. Cuando termina el procesamiento, marcas `is_featured = true` y la publicas
4. La canción aparece en el dashboard de todos los usuarios en la sección "Practica estas canciones"
5. Puedes ocultarla sin borrarla en cualquier momento

---

## Componentes clave a diseñar

- **SongCard** — Card de canción. Muestra título, artista, instrumentos disponibles, fecha. Si es destacada: badge "Destacada"
- **FeaturedSongCard** — Variante de SongCard para canciones destacadas del admin en el dashboard
- **InstrumentSelector** — Grid visual de instrumentos. Un click.
- **ProcessingStatus** — Estados de procesamiento en tiempo real con checkmarks animados
- **SheetMusicViewer** — Partitura con cursor sincronizado y scroll automático
- **StemMixer** — Controles de volumen por stem. El instrumento del usuario empieza en mute.
- **TempoControl** — Velocidad 50%-150% sin cambiar el tono
- **LoopMarker** — Marcar sección A-B para repetir
- **AffiliateProductCard** — Card discreta de producto afiliado en el reproductor. Imagen, nombre, precio, plataforma, botón de compra. Se siente como recomendación útil, no publicidad
- **BandLobby** — Vista de sala de banda: lista de miembros, instrumentos, estado, botón Play (solo líder)
- **BandMemberCard** — Avatar o iniciales del músico + instrumento + estado (conectado/listo)
- **SyncPlayButton** — Botón Play del líder. Visualmente diferente al play normal — comunica que arranca para todos
- **AdminAffiliateRow** — Fila en el gestor de afiliados: imagen, nombre, instrumento, estado, botones editar/activar
- **AdminAffiliateForm** — Formulario de agregar/editar producto afiliado con vista previa
- **AdminFeaturedSongRow** — Fila en el gestor de canciones destacadas con toggle publicar/ocultar

---

## Decisiones de UX ya tomadas

- **No hay campo de YouTube link** — upload directo de MP3. Razón: copyright
- **Stems se borran en 48h para canciones de terceros** — la partitura (notas JSON) persiste siempre
- **Invitados a sala de banda pueden entrar solo con nombre** — no es obligatorio crear cuenta, pero se les invita a registrarse al final de la sesión
- **La sincronización de banda usa comando de Play, no streaming de audio** — cada browser tiene los stems, solo se sincronizan con un timestamp del servidor
- **El admin (`/admin`) es solo para la dueña del producto** — protegido por user_id hardcodeado, invisible para cualquier otro usuario
- **Los afiliados de v1 son solo los que el admin inserta** — no hay afiliados de terceros hasta Beta
- **Canciones destacadas (`is_featured = true`) aparecen en dashboard de todos** — son las canciones que el admin sube para que cualquier usuario pueda practicar sin subir su propio MP3
- **MP3 de canciones destacadas del admin se guarda permanentemente** — el admin es el dueño del contenido

---

## Lo que NO forma parte del scope v1

- Links de YouTube para procesar canciones (decisión legal)
- Detección de pitch en tiempo real vía micrófono (Fase 3)
- App móvil (web primero)
- Portal de Creador para usuarios externos — guardado para Beta
- Sección Explorar — guardado para Beta
- Verificación de creadores externos — guardado para Beta
- Chat o video dentro de la sala de banda

---

## Lo que viene en Beta (después de validar v1)

1. Abrir el Panel de Admin a creadores externos verificados
2. Portal de Creador — subir música propia, productos de afiliados propios, ID de creador
3. Sección Explorar — catálogo de canciones de creadores verificados
4. Verificación manual de los 3 checks (plan, banda, copyright)
5. Estadísticas para creadores (plays, clicks en productos)

---

# Instrumently — Tech Brief

> Stack completo, arquitectura y decisiones técnicas para arrancar la construcción.

---

## Stack

| Capa | Tecnología | Propósito |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | Frontend + API Routes |
| Estilos | Tailwind CSS + CSS Variables | Layout, theming, dark mode |
| Estado cliente | Zustand | Estado del reproductor y UI |
| DB + Auth | Supabase (PostgreSQL + Auth + Realtime) | Usuarios, canciones, notas, jobs |
| Storage | Supabase Storage (TTL 48h para stems) | Archivos de audio de stems separados |
| Pagos | Stripe | Suscripción freemium |
| Email | Resend | Emails transaccionales |
| Deploy frontend | Vercel | Frontend + API Routes |
| Deploy backend ML | Railway | Microservicio Python con Demucs |
| Queue | Redis + BullMQ (en Railway) | Cola de procesamiento de canciones |
| Separación de stems | Demucs htdemucs_6s (Meta, MIT) | Separar canción en 6 stems |
| Transcripción a MIDI | Basic Pitch (Spotify, open source) | Audio de stem → MIDI → notas |
| Renderizado partitura | alphaTab | Partitura + tabs con scroll sincronizado |
| Reproducción audio | Web Audio API (nativa browser) | Reproductor multi-stem |
| Afiliados | Amazon Affiliates + Sweetwater | Marketplace de productos por instrumento |

---

## Arquitectura de servidores

### Servidor 1 — Vercel

- **Qué corre aquí:** App Next.js completa — páginas, componentes, API Routes (auth, CRUD de songs, trigger de procesamiento, webhooks de Stripe)
- **Por qué aquí:** Deploy instantáneo, escala automático, integración nativa con Next.js, plan gratuito cubre el MVP
- **Límites relevantes:** Funciones serverless: máx 512MB RAM, máx 60s timeout — por eso Demucs NO puede correr aquí
- **Costo:** Gratis para MVP, ~$20/mes si escala
- **Comunicación:** Llama al microservicio Python en Railway vía HTTP con API key interna

### Servidor 2 — Railway

- **Qué corre aquí:** Microservicio Python (FastAPI) + Redis + Worker de Demucs + Basic Pitch
- **Por qué aquí y no en Vercel:** Demucs necesita 2-4GB RAM y puede tardar 1-3 minutos — Vercel lo mataría. Railway permite procesos de larga duración con RAM configurable
- **Límites relevantes:** Sin timeout rígido, RAM configurable ($), sin GPU en plan base (procesamiento con CPU: ~90s por canción de 4min)
- **Costo:** ~$20/mes para empezar, sube con el volumen de canciones procesadas
- **Comunicación:** Recibe jobs de Vercel, procesa, sube stems a Supabase Storage, actualiza DB directamente

---

## APIs y servicios externos

| Servicio | Propósito | Tipo | Costo | Notas importantes |
|---|---|---|---|---|
| **Demucs htdemucs_6s** | Separar MP3 en 6 stems (vocals, drums, bass, guitar, piano, other) | Open source Python (MIT) | Gratis | Instalar en Railway: `pip install demucs`. Modelo 6s separa guitarra y piano individualmente |
| **Basic Pitch TS** (Spotify) | Convertir stem de audio a MIDI con detección de notas | Open source npm | Gratis | Polyphonic, instrument-agnostic. Versión Python más rápida para server-side |
| **alphaTab** | Renderizar partitura y tabs con scroll sincronizado en browser | Open source JS | Gratis | Soporta notación estándar + guitar tabs. Tiene scroll nativo sync con audio |
| **Web Audio API** | Reproducir múltiples stems simultáneamente con control de volumen individual | Nativa del browser | Gratis | GainNode por stem para mute/unmute. `AudioContext.currentTime` para sincronización |
| **Supabase Realtime** | Notificar al browser cuando el procesamiento termina | Incluido en Supabase | Gratis en plan Pro | Subscripción a tabla `processing_jobs` — cuando status cambia a 'ready', el browser lo detecta |
| **Amazon Affiliates** | Comisiones en productos de música | Programa de afiliados | 3-6% comisión | Registrarse en affiliate-program.amazon.com |
| **Sweetwater** | Afiliados de instrumentos musicales (mejor comisión que Amazon) | Programa de afiliados | 4-8% comisión | Alternativa/complemento a Amazon para productos de música |

---

## Schema de base de datos

### profiles

- **Propósito:** Perfil extendido del usuario (sobre auth.users de Supabase)
- **Campos clave:** id (UUID, FK auth.users), email, plan ('free'/'pro'/'lifetime'), songs_used_this_month (INTEGER), stripe_customer_id
- **RLS:** Usuario solo puede ver y editar su propio perfil

### songs

- **Propósito:** Cada canción que un usuario ha procesado
- **Campos clave:** id, user_id (FK profiles), title, artist, source_type ('upload'), duration_seconds, bpm, key_signature, status ('pending'/'processing'/'ready'/'failed'), storage_path, is_public (BOOLEAN), is_featured (BOOLEAN DEFAULT false — solo el admin lo activa), featured_storage_url (TEXT — URL permanente del MP3 cuando is_featured = true)
- **Nota:** Si `is_featured = true`, el MP3 se guarda permanentemente y la canción aparece en el dashboard de todos los usuarios. Solo el admin puede activar este flag.
- **RLS:** Usuario ve sus propias canciones. Todos ven las `is_featured = true`.

### stems

- **Propósito:** Archivos de audio separados por Demucs para cada canción
- **Campos clave:** id, song_id (FK), instrument_type ('vocals'/'drums'/'bass'/'guitar'/'piano'/'other'), storage_url, storage_path, midi_url
- **Nota:** TTL de 48h en Supabase Storage — los stems se borran automáticamente. El usuario puede regenerarlos subiendo el MP3 de nuevo
- **RLS:** Heredada de songs

### note_sequences

- **Propósito:** Notas musicales detectadas por Basic Pitch para renderizar la partitura
- **Campos clave:** id, stem_id (FK), song_id (FK desnormalizado), instrument_type, notes (JSONB — array de {pitch, startTime, duration, velocity}), tab_data (JSONB para guitar tabs), time_signature, key_signature
- **Nota:** Este es el dato más valioso — NO tiene TTL. Persiste indefinidamente aunque los stems se borren
- **RLS:** Heredada de songs

### processing_jobs

- **Propósito:** Queue y estado del procesamiento de cada canción
- **Campos clave:** id, song_id (FK), job_type, status ('queued'/'processing'/'completed'/'failed'), progress_pct, error_message, started_at, completed_at
- **Uso Realtime:** El browser se subscribe a cambios en esta tabla para mostrar progreso en tiempo real

### subscriptions

- **Propósito:** Plan activo del usuario
- **Campos clave:** id, user_id (FK, UNIQUE), stripe_subscription_id, plan, status, current_period_end, cancel_at_period_end

### affiliate_products

- **Propósito:** Productos afiliados gestionados por el admin — aparecen en el reproductor según el instrumento seleccionado
- **Campos clave:** id, instrument_type, category, name, image_url, affiliate_url, platform ('amazon'/'etsy'/'shopify'/'sweetwater'), display_price, is_active, sort_order
- **Quién puede escribir:** Solo el admin (protegido por RLS con admin user_id hardcodeado)
- **Quién puede leer:** Todos los usuarios (lectura pública de productos activos)

### affiliate_clicks

- **Propósito:** Tracking de clicks en productos afiliados
- **Campos clave:** id, product_id, user_id (nullable), song_id, instrument_context, created_at

### song_cache

- **Propósito:** Evitar reprocesar la misma canción si dos usuarios suben el mismo archivo
- **Campos clave:** id, source_url_hash (UNIQUE — hash del contenido del archivo), title, artist, available_instruments (TEXT[]), reference_song_id, use_count

---

## Flujos técnicos end-to-end

### Flujo 1 — Upload y procesamiento de canción

```
Usuario sube MP3 en el browser
→ Next.js API Route /api/songs crea registro en songs (status: 'pending')
→ API Route llama a Railway: POST /process { song_id, storage_path }
→ Railway recibe, crea job en processing_jobs (status: 'queued')
→ Redis BullMQ encola el trabajo
→ Worker toma el trabajo de la queue:
    1. Descarga el MP3 desde Supabase Storage
    2. Corre Demucs htdemucs_6s → genera 6 stems como archivos WAV
    3. Sube cada stem a Supabase Storage (path: songs/{song_id}/stems/{instrument}.wav)
    4. Corre Basic Pitch en cada stem → genera nota_sequence JSON
    5. Guarda stems en tabla stems
    6. Guarda notas en tabla note_sequences
    7. Actualiza songs.status = 'ready'
    8. Actualiza processing_jobs.status = 'completed'
→ Supabase Realtime notifica al browser
→ Browser redirige al usuario al selector de instrumento
```

### Flujo 2 — Sesión de práctica (reproducción sincronizada)

```
Usuario selecciona instrumento
→ Browser carga todos los stems como AudioBuffer (Web Audio API)
→ Crea un GainNode por stem
→ GainNode del instrumento seleccionado: gain.value = 0 (silenciado)
→ Browser carga note_sequence desde Supabase
→ alphaTab renderiza la partitura desde las notas
→ Usuario presiona Play:
    → AudioContext.currentTime empieza a correr
    → requestAnimationFrame loop: compara currentTime con startTime de cada nota
    → alphaTab scrollea automáticamente manteniendo la nota activa visible
    → Usuario toca encima de la canción
```

### Flujo 3 — Webhook de Stripe (upgrade a Pro)

```
Usuario paga en Stripe Checkout
→ Stripe envía webhook a /api/webhooks/stripe
→ API Route verifica firma del webhook
→ Actualiza subscriptions y profiles.plan = 'pro'
→ Usuario recibe email de confirmación (Resend)
→ Browser detecta el cambio de plan (Supabase Realtime o refresh)
```

---

## Decisiones técnicas tomadas

| Decisión | Razón |
|---|---|
| Railway para Demucs, no Vercel | Vercel tiene límite de 512MB RAM y 60s timeout. Demucs necesita 2-4GB y varios minutos |
| Upload directo de MP3, no links de YouTube | Evitar violación de ToS de YouTube y problemas legales de copyright |
| alphaTab para partitura | Único open source que soporta tabs de guitarra + notación estándar + scroll sincronizado con audio nativo |
| Supabase Realtime para notificar procesamiento | Evita polling. El browser recibe el update exactamente cuando el worker termina |
| TTL de 48h para stems de canciones de terceros | Los stems son audio (zona gris legal). Las notas JSON no tienen TTL |
| Sin TTL para canciones `is_featured = true` | El admin es dueño del contenido — puede guardarse permanentemente |
| note_sequences.notes como JSONB | Una canción puede tener miles de notas — JSONB es más eficiente para leer todo de una vez |
| htdemucs_6s sobre htdemucs | El modelo de 6 stems separa guitarra y piano individualmente |
| Basic Pitch Python (server-side) | La versión Python es más rápida que la TS corriendo en Node |
| Ruta `/admin` protegida por user_id hardcodeado | No es un rol en DB — es una constante en el código (`ADMIN_USER_ID=process.env.ADMIN_USER_ID`). Si el user_id del session no coincide, redirect a 404. Invisible para cualquier otro usuario |
| affiliate_products solo escribible por admin | RLS policy: `WITH CHECK (auth.uid() = 'ADMIN_USER_ID_AQUI')`. Lectura pública para todos |
| is_featured activable solo por admin | La API Route que cambia `is_featured = true` verifica `auth.uid() === ADMIN_USER_ID` antes de ejecutar |

---

## Lo que todavía NO está decidido

- Si usar Piano Roll como vista alternativa a partitura estándar
- Límite exacto de tamaño de archivo para upload (sugerido: máx 50MB / 10min de audio)
- GPU en Railway para Demucs (más rápido pero más caro) — evaluar cuando haya usuarios reales
- Sistema de caché: si dos usuarios suben el mismo MP3, ¿se reutilizan los stems?

---

## Flujo técnico — Panel de Admin (v1)

### Protección de ruta

```typescript
// middleware.ts
const ADMIN_USER_ID = process.env.ADMIN_USER_ID

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const session = await getSession(request)
    if (!session || session.user.id !== ADMIN_USER_ID) {
      return NextResponse.redirect(new URL('/404', request.url))
    }
  }
}
```

### Flujo — Admin agrega producto afiliado

```
Admin entra a /admin → sección Afiliados
→ Rellena formulario: nombre, imagen, link, instrumento, plataforma, precio
→ POST /api/admin/affiliates (verifica ADMIN_USER_ID en server)
→ Inserta en affiliate_products (is_active: true por defecto)
→ Producto aparece inmediatamente en el reproductor para ese instrumento
→ Admin puede editar / activar / desactivar en cualquier momento
```

### Flujo — Admin sube canción destacada

```
Admin entra a /admin → sección Canciones Destacadas
→ Sube MP3 → mismo pipeline de procesamiento que cualquier usuario
→ Cuando status = 'ready', admin activa toggle "Publicar como destacada"
→ PATCH /api/admin/songs/{id}/feature (verifica ADMIN_USER_ID en server)
→ songs.is_featured = true
→ MP3 se mueve a carpeta permanente en Storage (sin TTL)
→ Canción aparece en dashboard de todos los usuarios en sección "Practica estas canciones"
→ Admin puede ocultarla (is_featured = false) sin borrarla
```

---

## Riesgos identificados

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Calidad de separación de stems en géneros complejos (metal, jazz denso) | Medio | Testear Demucs con 20 canciones de géneros distintos antes de lanzar |
| Calidad de transcripción de Basic Pitch en acordes complejos | Medio | La partitura puede tener imprecisiones — comunicarlo al usuario como "aproximación" |
| Costo de Railway escala con volumen | Medio | Implementar caché agresivo — no reprocesar canciones ya procesadas |
| Copyright de los stems almacenados | Alto | TTL de 48h en Storage + no almacenar el MP3 original después del procesamiento |
| Tiempo de procesamiento frustra al usuario (1-3 min) | Medio | UI de procesamiento con pasos claros y progreso en tiempo real vía Realtime |

---

## Próximo paso concreto

Instalar Demucs localmente y procesarlo con 10 canciones de géneros distintos para validar la calidad de los stems antes de construir nada:

```bash
pip install demucs
demucs -n htdemucs_6s tu_cancion.mp3
```

Si el resultado es usable en 7/10 canciones → el riesgo técnico más grande está controlado y se puede arrancar la Fase 1.

---

## ACTUALIZACIÓN — v1: Sala de Banda

### Nuevas tablas — v1 (construir ahora)

#### band_rooms (salas de banda)

- **Propósito:** Sala de práctica grupal en tiempo real
- **Campos clave:** id, leader_user_id (FK profiles), song_id (FK songs), name, room_code (6 chars único, ej: `BND-4X9`), status ('waiting'/'playing'/'ended'), play_started_at (TIMESTAMPTZ — timestamp exacto del Play para sincronización), created_at
- **RLS:** Solo el líder puede crear/modificar. Todos los miembros pueden leer.

#### band_members (miembros de una sala)

- **Propósito:** Cada participante en una sala de banda
- **Campos clave:** id, room_id (FK band_rooms), user_id (FK profiles, nullable — puede ser invitado sin cuenta), guest_name (TEXT — si es invitado sin cuenta), instrument_selected, status ('joined'/'ready'/'disconnected'), joined_at
- **RLS:** Lectura pública dentro de la sala. El miembro puede actualizar su propio registro.

---

### Tablas reservadas para Beta — ⏸ NO construir en v1

Las siguientes tablas están documentadas para referencia futura pero NO se crean en v1.
Se activan cuando se lance el Portal de Creador después de validar el Plan Banda:

- `creator_profiles` — perfiles de creadores verificados
- `creator_songs` — canciones originales publicadas
- `creator_products` — links de productos del creador
- `creator_product_clicks` — tracking de clicks
- `admin_verifications` — log de decisiones de admin

---

### Flujo técnico — Sincronización de banda en tiempo real

```
Líder crea sala → band_rooms creado (status: 'waiting')
→ Líder comparte link con room_code
→ Invitados abren link → ingresan nombre o hacen login
→ Cada invitado crea registro en band_members
→ Todos los browsers se subscriben al canal Supabase Realtime: `band_room:{room_id}`
→ Líder ve en tiempo real quién se une (Realtime update de band_members)
→ Cuando todos están listos, líder presiona Play:
    → API Route actualiza band_rooms.status = 'playing'
    → API Route escribe band_rooms.play_started_at = NOW() (timestamp exacto del servidor)
    → Supabase Realtime emite evento a TODOS los subscribers del canal
    → Cada browser recibe el evento con el play_started_at
    → Cada browser calcula: offset = Date.now() - play_started_at
    → Cada browser arranca su AudioContext con ese offset
    → Todos los stems arrancan sincronizados al mismo instante
```

**Por qué el timestamp del servidor y no del cliente:**
Si cada browser usa su propio reloj, hay desincronización por latencia de red (100-300ms).
Usar `play_started_at` del servidor como referencia única garantiza que todos calcules
el mismo punto de arranque aunque reciban el evento en momentos ligeramente distintos.

---

### Flujo técnico — Verificación de creador (panel de admin)

```
Usuario con Plan Banda solicita ser creador:
→ Sube MP3 original a Supabase Storage (carpeta: creator-songs/{user_id}/)
→ Acepta DMCA declaration (dmca_accepted_at = NOW())
→ Crea registro en creator_profiles (status: 'pending')
→ Crea registro en creator_songs (is_published: false)

Admin recibe notificación (email vía Resend):
→ Abre panel de admin → ve la solicitud
→ Check 1 (automático): ¿profiles.plan = 'banda'? → verde/rojo
→ Check 2 (automático): ¿tiene al menos 1 band_room creado? → verde/rojo
→ Check 3 (manual): Admin escucha el MP3, verifica que es original → aprueba/rechaza

Si aprueba:
→ creator_profiles.verification_status = 'approved'
→ Sistema genera creator_id único: 'INST-' + 4 dígitos aleatorios + '-' + 2 letras
→ creator_songs.is_published = true
→ La canción aparece en "Explorar" para todos los usuarios
→ Email al creador: "¡Fuiste verificado! Tu ID: INST-4829-KX"
→ Registro en admin_verifications (log auditable)

Si rechaza:
→ creator_profiles.verification_status = 'rejected'
→ rejection_reason guardado
→ Email al creador con la razón
→ El usuario puede volver a intentar con otra canción
```

---

### Decisiones técnicas adicionales

| Decisión | Razón |
|---|---|
| Sincronización de banda vía Supabase Realtime (no WebRTC) | Supabase Realtime ya está en el stack. WebRTC agregaría complejidad de peer-to-peer innecesaria — no necesitamos streaming de audio, solo el comando Play |
| El audio NO viaja por internet durante la sesión de banda | Cada usuario tiene los stems cargados en su browser. Solo viaja el timestamp de Play. Elimina latencia de audio por completo |
| Timestamp de Play viene del servidor (not cliente) | Garantiza sincronización precisa entre browsers con distintas latencias de red |
| MP3 de creadores verificados sin TTL | A diferencia de stems de canciones de terceros (copyright), el creador es el dueño legal verificado por admin |
| creator_id alfanumérico asignado por sistema | Evita que el creador elija su propio ID (podría elegir IDs engañosos). El sistema lo genera al aprobar |
| Verificación Check 3 siempre manual | No hay forma confiable de detectar copyright automáticamente al 100%. La responsabilidad legal requiere decisión humana |
| Plataformas de venta: solo Amazon / Etsy / Shopify | Son plataformas con sistemas de afiliados establecidos y confiables. Links genéricos podrían ser maliciosos o de plataformas sin control |
| Instrumently nunca toca el dinero del creador | El creador pone su propio link de afiliado. La comisión va directo de Amazon/Etsy/Shopify al creador. Instrumently no es intermediario financiero — elimina regulación de pagos |
| Invitados sin cuenta pueden entrar a sala solo con nombre | Reduce fricción de onboarding en el contexto de banda. Se les invita a crear cuenta al finalizar la sesión |

---

### Roles en el sistema — v1

| Rol | Cómo se asigna | Acceso |
|---|---|---|
| `user` | Default al registrarse | Dashboard, práctica solo |
| `pro` | Stripe Plan Pro activo | Todo lo de user + features Pro |
| `banda` | Stripe Plan Banda activo | Todo lo de Pro + crear salas de banda |
| `admin` | Asignado manualmente en DB | Reservado para Beta (panel de admin de creadores) |
| `guest` | Sin cuenta, entró a sala con nombre | Solo acceso a sala de banda específica |

> **Rol `creator` — reservado para Beta.** Se activa cuando se lance el Portal de Creador.

---

## Tips de implementación

> Guía concreta de lenguajes, librerías, APIs y patrones para construir Instrumently.
> Léela antes de escribir cualquier línea de código.

### Lenguaje principal y versión recomendada

| Capa | Lenguaje | Versión | Por qué |
|---|---|---|---|
| Frontend + API Routes | TypeScript | 5.x | Tipado estricto esencial para el sync de audio y las note_sequences |
| Microservicio ML | Python | 3.10+ | Demucs y Basic Pitch solo tienen soporte oficial en Python |
| Scripts de queue | Python | 3.10+ | BullMQ alternativa en Python: rq o celery sobre Redis |

> Regla de oro: TypeScript para todo lo que corre en Vercel. Python para todo lo que corre en Railway. Nunca mezclar en el mismo servidor.

### Setup inicial

```bash
# 1. Crear el proyecto Next.js
npx create-next-app@latest instrumently --typescript --tailwind --app --src-dir

# 2. Instalar dependencias principales
cd instrumently
npm install @supabase/supabase-js @supabase/ssr zustand stripe @stripe/stripe-js resend

# 3. Instalar alphaTab para la partitura
npm install @coderline/alphatab

# 4. Variables de entorno
cp .env.example .env.local

# 5. Microservicio Python (en carpeta separada /services/audio-processor)
pip install demucs basic-pitch fastapi uvicorn redis rq python-dotenv supabase
```

### Librerías clave

| Librería | Versión | Para qué en Instrumently | Instalar | Docs |
|---|---|---|---|---|
| `@supabase/supabase-js` | ^2.x | DB, Auth, Storage, Realtime | `npm i @supabase/supabase-js` | supabase.com/docs |
| `@supabase/ssr` | ^0.x | Auth SSR en Next.js App Router | `npm i @supabase/ssr` | supabase.com/docs/guides/auth/server-side/nextjs |
| `zustand` | ^4.x | Estado del reproductor y sala de banda | `npm i zustand` | zustand-demo.pmnd.rs |
| `stripe` | ^14.x | Suscripciones server-side | `npm i stripe` | stripe.com/docs/api |
| `@stripe/stripe-js` | ^2.x | Stripe client-side (Checkout) | `npm i @stripe/stripe-js` | stripe.com/docs/js |
| `@coderline/alphatab` | ^1.x | Partitura + tabs + scroll sincronizado | `npm i @coderline/alphatab` | alphatab.net/docs |
| `resend` | ^3.x | Emails transaccionales e invitaciones | `npm i resend` | resend.com/docs |
| `demucs` | latest | Separación de stems en Python | `pip install demucs` | github.com/facebookresearch/demucs |
| `basic-pitch` | latest | Audio → MIDI → notas en Python | `pip install basic-pitch` | basicpitch.spotify.com |
| `fastapi` | ^0.x | API del microservicio Python | `pip install fastapi uvicorn` | fastapi.tiangolo.com |
| `rq` | ^1.x | Queue de jobs Python sobre Redis | `pip install rq` | python-rq.org |

### Variables de entorno

```env
# ─── Supabase ───────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Solo server-side, nunca exponer al cliente

# ─── Stripe ─────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRO_PRICE_ID=price_...      # ID del precio Pro en Stripe Dashboard
STRIPE_BANDA_PRICE_ID=price_...    # ID del precio Banda en Stripe Dashboard

# ─── Resend ─────────────────────────────────────────
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hola@instrumently.app

# ─── Microservicio Python (Railway) ─────────────────
AUDIO_PROCESSOR_URL=https://instrumently-audio.up.railway.app
AUDIO_PROCESSOR_API_KEY=sk_internal_...  # API key interna entre Vercel y Railway

# ─── Redis (Railway) ────────────────────────────────
REDIS_URL=redis://default:password@host:6379

# ─── Admin ──────────────────────────────────────────
ADMIN_USER_ID=uuid-del-usuario-admin   # Tu user_id de Supabase Auth

# ─── App ────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://instrumently.app
```

### Patrones de código obligatorios

```
NAMING:
- Componentes React: PascalCase → AudioPlayer.tsx, BandLobby.tsx
- Hooks: camelCase con "use" → usePlayerStore.ts, useBandSync.ts
- API Routes: kebab-case → /api/band-rooms/route.ts
- Tipos: PascalCase con sufijo → SongType, BandRoomType, NoteSequenceType
- Stores Zustand: camelCase con "Store" → playerStore.ts, bandStore.ts

SUPABASE — cuándo usar qué cliente:
- Server Components y API Routes → createServerClient() de @supabase/ssr
- Client Components ('use client') → createBrowserClient() de @supabase/ssr
- NUNCA usar la service_role_key en el cliente — solo en API Routes server-side

ESTADO:
- Zustand: estado del reproductor (stems cargados, instrumento activo, posición), estado de la sala de banda (miembros, estado de play)
- Server Components: fetching de datos de DB (canciones, notas, planes)
- NUNCA useEffect para fetching — usar Server Components o SWR si necesita revalidar

API ROUTES — patrón estándar:
  export async function POST(request: Request) {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    // lógica aquí
    return Response.json({ data: result })
  }

PROTECCIÓN DE ADMIN:
  if (user.id !== process.env.ADMIN_USER_ID) {
    return NextResponse.redirect(new URL('/404', request.url))
  }
```

### Integraciones externas — cómo conectarlas

#### Supabase Realtime — sync de sala de banda

```typescript
// En el componente BandLobby.tsx
const supabase = createBrowserClient()

useEffect(() => {
  const channel = supabase
    .channel(`band_room:${roomId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'band_members',
      filter: `room_id=eq.${roomId}`
    }, (payload) => {
      // Actualizar lista de miembros en tiempo real
      updateMembers(payload)
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'band_rooms',
      filter: `id=eq.${roomId}`
    }, (payload) => {
      // El líder dio Play — arrancar audio
      if (payload.new.status === 'playing') {
        syncPlay(payload.new.play_started_at)
      }
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [roomId])
```

- **Error más común:** El canal Realtime no dispara si RLS bloquea la lectura — verificar que los miembros tienen SELECT en band_rooms y band_members
- **Límite:** Supabase Realtime tiene límite de 200 conexiones simultáneas en plan Free, 10,000 en Pro

#### alphaTab — partitura sincronizada con audio

```typescript
// En SheetMusicViewer.tsx
import * as alphaTab from '@coderline/alphatab'

const api = new alphaTab.AlphaTabApi(containerRef.current, {
  core: { engine: 'svg' },
  display: { layoutMode: alphaTab.LayoutMode.Page },
  player: {
    enablePlayer: true,
    enableCursor: true,     // cursor que avanza con el audio
    enableAnimatedBeatCursor: true,
    soundFont: '/soundfont/default.sf2'
  }
})

// Cargar notas desde note_sequences
api.tex(convertNotesToAlphaTex(noteSequence.notes))

// Sincronizar con Web Audio API externo
api.playbackSpeed = tempoPercent / 100
```

- **Error más común:** alphaTab necesita un SoundFont (.sf2) para reproducir audio propio — si usas Web Audio API externo, desactiva el player interno de alphaTab y usa solo el cursor visual
- **Límite:** El render SVG puede ser lento con partituras muy largas (>5 min) — paginar o usar canvas engine

#### Demucs (Python microservicio)

```python
# En el worker de Railway
import subprocess
import os

def separate_stems(input_path: str, output_dir: str, song_id: str):
    result = subprocess.run([
        "demucs",
        "--two-stems", "guitar",   # o sin este flag para 6 stems
        "-n", "htdemucs_6s",
        "--out", output_dir,
        input_path
    ], capture_output=True, text=True)

    if result.returncode != 0:
        raise Exception(f"Demucs failed: {result.stderr}")

    # Los stems quedan en: output_dir/htdemucs_6s/{nombre_archivo}/{stem}.wav
    stems_path = os.path.join(output_dir, "htdemucs_6s",
                              os.path.splitext(os.path.basename(input_path))[0])
    return stems_path
```

- **Error más común:** Demucs descarga el modelo la primera vez (~400MB) — pre-descargarlo en el Dockerfile de Railway para no esperar en cada deploy
- **Límite:** ~90s por canción de 4min en CPU. Con GPU A100 baja a ~10s pero cuesta más en Railway

#### Basic Pitch (Python microservicio)

```python
from basic_pitch.inference import predict
from basic_pitch import ICASSP_2022_MODEL_PATH

def transcribe_stem(stem_path: str) -> list:
    model_output, midi_data, note_events = predict(stem_path)

    # note_events es una lista de (start_time, end_time, pitch, velocity, ...)
    notes = [
        {
            "pitch": int(note[2]),
            "startTime": float(note[0]),
            "duration": float(note[1] - note[0]),
            "velocity": int(note[3])
        }
        for note in note_events
    ]
    return notes  # Guardar esto en note_sequences.notes como JSONB
```

- **Error más común:** Basic Pitch funciona mejor con audios mono — convertir el stem WAV a mono antes de pasarlo
- **Límite:** Precisión baja en acordes muy complejos (guitarra con barras). Comunicar al usuario que la partitura es una "aproximación inteligente"

#### Stripe — tres planes

```typescript
// En /api/webhooks/stripe/route.ts
const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)

switch (event.type) {
  case 'customer.subscription.created':
  case 'customer.subscription.updated':
    const subscription = event.data.object
    const plan = getPlanFromPriceId(subscription.items.data[0].price.id)
    // plan = 'free' | 'pro' | 'banda'
    await supabase.from('profiles').update({ plan }).eq('stripe_customer_id', subscription.customer)
    break
  case 'customer.subscription.deleted':
    await supabase.from('profiles').update({ plan: 'free' }).eq('stripe_customer_id', subscription.customer)
    break
}

function getPlanFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  if (priceId === process.env.STRIPE_BANDA_PRICE_ID) return 'banda'
  return 'free'
}
```

- **Error más común:** El webhook llega antes de que el usuario exista en DB — usar `upsert` en vez de `update`
- **Límite:** Stripe webhooks pueden llegar fuera de orden — manejar idempotencia con el `event.id`

### Orden de construcción recomendado

1. **Supabase schema + RLS** — crear todas las tablas y políticas antes de tocar el frontend
2. **Auth (login / registro)** — sin auth nada funciona. Email + Google
3. **Upload de MP3 + procesamiento básico** — el flujo core: subir → Demucs → Basic Pitch → stems en Storage
4. **Reproductor de audio** — Web Audio API con stems, mute del instrumento seleccionado
5. **alphaTab con notas** — partitura con scroll sincronizado
6. **Stripe + planes** — Free / Pro / Banda con webhook
7. **Sala de banda** — Supabase Realtime, sync de Play, lobby
8. **Panel de Admin** — ruta `/admin` protegida, CRUD de afiliados y canciones destacadas
9. **Emails (Resend)** — invitaciones de sala, confirmación de pago, verificación

### Qué NO hacer en este proyecto

- ❌ **No llamar a Demucs desde Vercel** — Vercel mata el proceso a los 60s y 512MB. Siempre desde Railway
- ❌ **No guardar el MP3 original en Storage** para canciones de terceros — borrarlo inmediatamente después del procesamiento. Solo guardar stems (TTL 48h) y notas (permanente)
- ❌ **No usar `useEffect` para fetching de DB** — usar Server Components de Next.js o SWR. El useEffect crea race conditions y no tiene caché
- ❌ **No exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente** — esta key bypasea RLS y da acceso total. Solo usarla en API Routes server-side
- ❌ **No sincronizar el audio de banda por WebRTC o streaming** — el audio no viaja por la red. Solo viaja el `play_started_at` timestamp del servidor
- ❌ **No usar el player interno de alphaTab si tienes Web Audio API propio** — activa solo el cursor visual de alphaTab y controla el audio con tu propio AudioContext
- ❌ **No cambiar `is_featured` desde el cliente sin verificar ADMIN_USER_ID en el server** — la verificación debe ser server-side en la API Route, no solo en el middleware
- ❌ **No pre-descargar el modelo de Demucs en cada run** — hacerlo una vez en el Dockerfile de Railway y cachearlo
