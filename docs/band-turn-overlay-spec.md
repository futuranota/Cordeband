# Spec — Capa overlay de turnos (modo banda)

> **Scope:** v1 sala de banda · Plan Banda  
> **Relacionado:** `memoria.md` (sync Realtime), `GUIA-DESARROLLO.md` Bloque 10, `docs/database-schema.md`  
> **Estado:** Spec de producto + técnico — **no implementado**

---

## 1. Objetivo

En una sesión de banda, **todos los participantes ven la misma pantalla base** (partitura, tarima, timeline, roster). Encima, cada browser muestra una **capa personal (overlay)** que indica:

- cuándo **le toca a ese músico** (“Tu turno, Diego”),
- cuándo **toca otro** (“Toca Sofía — Batería”),
- o en qué estado está la sesión antes/después del Play.

El audio no se transmite por red; solo se sincroniza el **momento de arranque** (`play_started_at`) y el estado de la sala. Cada cliente reproduce stems localmente y calcula el overlay con los mismos inputs.

---

## 2. Principios de diseño

| Principio | Descripción |
|-----------|-------------|
| **Vista canónica única** | Misma canción, mismo `curBeat`, misma partitura global, misma tarima iluminada para todos. |
| **Overlay local** | El mensaje de turno depende del `band_member` del viewer (nombre + instrumento asignado). |
| **Determinismo** | Quién está “en vivo” en la tarima se deriva de `curBeat` + mapa de entradas por instrumento (`entry_schedule`), no de eventos ad hoc por usuario. |
| **Nombres humanos** | La tarima y el overlay muestran **nombre del músico**, no solo “Guitarra”. |
| **Líder = misma vista + controles** | El líder ve la misma base; solo tiene controles extra (Play / Pausa / Terminar). |

---

## 3. Arquitectura visual

```
┌──────────────────────────────────────────────────────────────┐
│  BandTurnOverlay (z-index alto, pointer-events: none*)       │
│  · estado personal de turno                                  │
│  · nombre asignado del viewer u “otro músico”                │
├──────────────────────────────────────────────────────────────┤
│  VISTA COMPARTIDA (idéntica en todos los clients)            │
│  ┌─────────────┬──────────────────────────────────────────┐  │
│  │ BandRoster  │  SheetViewer (partitura global)          │  │
│  │ (sidebar)   │  StagePanel (spots + nombres)            │  │
│  │             │  Transport (scrubber, tempo — líder only)│  │
│  └─────────────┴──────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

\* Los controles del líder viven fuera del overlay o en una barra con `pointer-events: auto`.

---

## 4. Estados del overlay

### 4.1 Máquina de estados (por viewer)

El overlay del **viewer** depende de:

- `room.status` (`waiting` | `playing` | `ended`)
- `playing` local (audio/clock arrancó tras sync)
- `myInstrument` — instrumento asignado en `band_members`
- `activeInstruments[]` — instrumentos en ventana activa según `curBeat` + `entry_schedule`
- `myName` — `guest_name` o `profiles.name`

| ID | Condición | Overlay (ES) | Variante EN |
|----|-----------|--------------|-------------|
| `lobby` | `room.status === 'waiting'` y sesión no ha empezado | “Esperando a que {leaderName} dé Play…” | “Waiting for {leaderName} to press Play…” |
| `pre_roll` | Líder dio Play, countdown antes de `play_started_at` | “Arranca en {n}…” | “Starting in {n}…” |
| `your_live` | `myInstrument ∈ activeInstruments` | **“Tu turno, {myName}”** | **“Your turn, {myName}”** |
| `your_ready` | Entrada propia en ≤ `LEAD_BEATS` (8 beats) | “Prepárate, {myName} — entras en {secs}s” | “Get ready, {myName} — in {secs}s” |
| `your_waiting` | Hay entrada propia futura, fuera de ventana ready | “Tu parte en {time}” | “Your part in {time}” |
| `other_live` | Otro instrumento activo, no el mío | “Toca {otherName} — {instLabel}” | “{otherName} — {instLabel}” |
| `rest` | Nadie en ventana activa (entre entradas) | “Descansa — siguen los demás” | “Rest — others continue” |
| `ended` | `room.status === 'ended'` | “Sesión terminada” | “Session ended” |
| `unassigned` | Viewer sin instrumento (observador) | “Observando la sesión” | “Watching the session” |

**Prioridad** (evaluar en este orden): `ended` → `lobby` → `pre_roll` → `your_live` → `your_ready` → `other_live` → `your_waiting` → `rest`.

### 4.2 Relación con `TurnBanner` actual

El componente existente `TurnBanner` en `PlayerScreen.tsx` cubre `your_waiting` / `your_ready` / `your_live` en **modo solo**.

En **modo banda**:

- Reutilizar estilos `.turn-banner` (`.waiting`, `.ready`, `.live`).
- Extender lógica con estados `other_live`, `lobby`, `pre_roll`.
- Extraer a `BandTurnOverlay.tsx` para no duplicar en `PlayerScreen`.

---

## 5. Vista compartida — qué es igual para todos

| Elemento | Fuente de verdad | Notas |
|----------|------------------|-------|
| `curBeat` | `play_started_at` + reloj local | `offsetMs = Date.now() - play_started_at`; beats desde BPM y tempo de sala |
| Partitura | `songs` + `note_sequences` (score global o líder) | v1: **una partitura global** por canción; resaltar línea del instrumento activo opcional en v1.1 |
| `StagePanel` | `activeInstruments` derivado de schedule | Cada spot muestra **nombre** del `band_member` con ese instrumento |
| Roster sidebar | `band_members` vía Realtime | Ya especificado en `BandSessionPanel` |
| Tempo | `band_rooms.tempo` o valor del líder al dar Play | Solo líder puede cambiar antes/durante (definir en API) |

### 5.1 Mapa de entradas (`entry_schedule`)

Hoy en prototipo: constante `SCHED` en `PlayerScreen.tsx` (fracción 0–1 de la canción por instrumento).

En producción:

```ts
type EntryWindow = { startBeat: number; endBeat: number };

type EntrySchedule = Record<InstrumentKey, EntryWindow[]>;
```

- Se genera al procesar la canción (detección de actividad por stem) o se edita manualmente en admin.
- Todos los clients reciben el mismo JSON al unirse a la sala (join payload o fetch `songs.entry_schedule`).

Función pura compartida (tests unitarios):

```ts
function activeInstrumentsAt(
  curBeat: number,
  totalBeats: number,
  schedule: EntrySchedule,
): InstrumentKey[]
```

---

## 6. Datos y contratos

### 6.1 Inputs del overlay (hook `useBandTurnOverlay`)

```ts
type BandTurnOverlayInput = {
  room: {
    id: string;
    status: 'waiting' | 'playing' | 'ended';
    playStartedAt: string | null; // ISO UTC
    leaderUserId: string;
    tempo: number; // 0.5–1.5
  };
  members: BandMemberRow[]; // Realtime
  viewer: {
    memberId: string | null;
    userId: string | null;
    name: string;
    instrument: InstrumentKey | null;
    isLeader: boolean;
  };
  playback: {
    playing: boolean;
    curBeat: number;
    totalBeats: number;
    bpm: number;
    schedule: EntrySchedule;
  };
  leadBeats?: number; // default 8
};
```

```ts
type BandTurnOverlayState = {
  kind: 'lobby' | 'pre_roll' | 'your_live' | 'your_ready' | 'your_waiting'
      | 'other_live' | 'rest' | 'ended' | 'unassigned';
  title: string;       // ya resuelto con t()
  subtitle?: string;
  countdownSecs?: number;
  otherMember?: { name: string; instrument: InstrumentKey };
  variant: 'waiting' | 'ready' | 'live' | 'neutral' | 'ended';
};
```

### 6.2 Tabla `band_members` (existente en schema)

Campos usados por el overlay:

| Campo | Uso |
|-------|-----|
| `guest_name` / `user_id` → profile.name | Nombre en overlay y tarima |
| `instrument_selected` | `myInstrument` del viewer |
| `status` | `joined` \| `ready` \| `disconnected` — roster; no cambia el overlay de turno |
| `is_leader` (o comparar `leader_user_id`) | Controles de Play |

### 6.3 Resolución nombre por instrumento

```ts
function memberForInstrument(
  members: BandMemberRow[],
  instrument: InstrumentKey,
): BandMemberRow | null
```

Si dos miembros comparten instrumento (error de producto): mostrar el primero `joined` y log warning; v1 debe **bloquear** doble asignación en API.

---

## 7. Componentes

### 7.1 Nuevos

| Componente | Responsabilidad |
|------------|-----------------|
| `useBandTurnOverlay(input)` | Máquina de estados + strings |
| `useBandSync(roomId)` | Realtime + `play_started_at` → `playing`, `curBeat` |
| `BandTurnOverlay` | Render del banner superior; props: `state: BandTurnOverlayState` |
| `lib/band-schedule.ts` | `activeInstrumentsAt`, `nextEntryFor`, tests |

### 7.2 Modificados

| Componente | Cambio |
|------------|--------|
| `PlayerScreen` | Modo banda: usar `BandTurnOverlay` en lugar de `TurnBanner` solo |
| `StagePanel` / `BandStage` | Prop `memberLabels: Record<InstrumentKey, string>` para nombre bajo cada spot |
| `BandSessionPanel` | Roster ya OK; resaltar fila si `kind === 'your_live'` |

### 7.3 Ubicación en layout

El overlay se ancla **encima de la partitura**, dentro de `.player-band-main`, antes de `SheetViewer`:

```tsx
<div className="player-band-main">
  <BandTurnOverlay state={overlayState} />
  <section className="stage">…</section>
  <SheetViewer … />
</div>
```

CSS sugerido:

```css
.band-turn-overlay {
  position: sticky;
  top: 0;
  z-index: 20;
  margin-bottom: 12px;
}
```

---

## 8. Copy i18n (nuevas keys)

Añadir namespace `bandOverlay` en `strings.ts`:

| Key | ES | EN |
|-----|----|----|
| `lobbyTitle` | Esperando a que {leader} dé Play… | Waiting for {leader} to press Play… |
| `preRoll` | Arranca en {n}… | Starting in {n}… |
| `yourTurn` | Tu turno, {name} | Your turn, {name} |
| `yourReady` | Prepárate, {name} — entras en {secs}s | Get ready, {name} — in {secs}s |
| `yourWaiting` | Tu parte en {time} | Your part in {time} |
| `otherPlaying` | Toca {name} — {inst} | {name} — {inst} |
| `rest` | Descansa — siguen los demás | Rest — others continue |
| `ended` | Sesión terminada | Session ended |
| `watching` | Observando la sesión | Watching the session |
| `youSubLive` | Toca tu parte — la partitura está sincronizada | Play your part — the score is synced |
| `youSubReady` | Tu entrada está por llegar | Your entry is coming up |

Reutilizar `inst.{key}` para `{inst}`.

---

## 9. Flujo por rol

### 9.1 Líder

1. Crea sala, asigna / comparte links por instrumento.
2. Ve roster llenarse (Realtime).
3. Misma pantalla que todos; overlay personal según **su** instrumento si también toca.
4. Barra fija: **Play para todos** → API set `playing` + `play_started_at`.
5. Opcional: **Terminar sesión** → `ended`; overlay `ended` para todos.

### 9.2 Invitado

1. Abre `/join/[token]` → nombre + instrumento (pre-asignado o elegido).
2. Redirige a `/player?room=[id]` en vista banda.
3. Overlay `lobby` hasta el Play del líder.
4. Tras sync: mismos estados que el líder, personalizados con su nombre.

### 9.3 Observador (sin instrumento)

- Overlay `watching` / `unassigned`.
- Tarima y partitura visibles; sin mensajes de “tu turno”.

---

## 10. Sincronización

```
Líder: POST /api/band-rooms/[id]/play
  → band_rooms.status = 'playing'
  → band_rooms.play_started_at = NOW()  -- servidor

Todos (Realtime UPDATE band_rooms):
  → useBandSync recibe play_started_at
  → pre_roll si NOW() < play_started_at + grace (opcional 3s countdown UI)
  → playing = true; curBeat avanza con RAF/Web Audio

activeInstruments = activeInstrumentsAt(curBeat, …)
overlayState = useBandTurnOverlay({ … })
```

**Tolerancia:** desincronización aceptable &lt; 150 ms entre clients en LAN/broadband con timestamp de servidor.

---

## 11. Casos borde

| Caso | Comportamiento |
|------|----------------|
| Invitado se desconecta mid-song | Roster `disconnected`; tarima sin su nombre; overlay de otros sin cambio |
| Líder pausa (v1.1) | Congelar `curBeat` en servidor; overlay `lobby`-like “En pausa” |
| Cambio de tempo mid-song | v1: no permitido tras Play; v1.1: broadcast `tempo` por Realtime |
| Instrumento sin músico asignado | Spot en tarima solo con label de instrumento, atenuado |
| Viewer entra tarde | `curBeat` calculado con offset; salta al momento actual, no al inicio |
| `?demo=banda` sin sala | Mantener demo mock actual; **sin** overlay de nombres reales |

---

## 12. Criterios de aceptación (v1)

1. Dos browsers en la misma sala muestran el **mismo** `curBeat` ±150 ms tras Play.
2. Cuando el schedule marca guitarra activa y el viewer es guitarra → overlay **“Tu turno, {nombre}”**.
3. Cuando batería está activa y el viewer es guitarra → **“Toca {nombreBatería} — Batería”**.
4. `StagePanel` muestra el **mismo** spot iluminado en ambos browsers.
5. Antes del Play → overlay `lobby` en invitados.
6. Líder tiene Play; invitado no.
7. Strings ES/EN en `bandOverlay.*`.
8. Tests unitarios de `activeInstrumentsAt` y `useBandTurnOverlay` con fixtures de schedule.

---

## 13. Fases de implementación

| Fase | Entregable |
|------|------------|
| **A** | `lib/band-schedule.ts` + tests; extraer `SCHED` del player |
| **B** | `useBandTurnOverlay` + `BandTurnOverlay` + i18n; cablear en player con datos mock de sala |
| **C** | `useBandSync` + Realtime; reemplazar mock `DEMO_BAND_MEMBERS` por `band_members` |
| **D** | Nombres en `StagePanel`; join flow `/join/[token]` |
| **E** | Play API + `pre_roll` + QA multi-browser |

---

## 14. Referencias en código actual

| Archivo | Relevancia |
|---------|------------|
| `src/components/screens/PlayerScreen.tsx` | `TurnBanner`, `SCHED`, `activeKeys`, modo `isBandView` |
| `src/components/player/StagePanel.tsx` | Tarima compartida; extender con nombres |
| `src/components/player/BandSessionPanel.tsx` | Roster lateral |
| `src/lib/demo-band.ts` | Mock a reemplazar por Realtime |
| `src/lib/plan-access.ts` | Gating plan Banda en player |
| `docs/database-schema.md` | `band_rooms`, `band_members` |

---

## 15. Fuera de scope v1

- Segunda partitura / “mini player” del otro músico
- Screen sharing / video
- Aprobación manual del líder por cada join (opcional v1.1)
- Resaltado por nota individual (solo por ventanas de instrumento)
