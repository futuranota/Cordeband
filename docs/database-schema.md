# Coderband — Schema SQL para Supabase

## Tablas

| Tabla | Propósito |
|---|---|
| `profiles` | Extiende `auth.users` con nombre, plan, idioma |
| `songs` | Canciones del usuario + canciones destacadas del admin |
| `band_rooms` | Salas de práctica con código único (ej. `BND-4X9`) |
| `band_members` | Qué usuario toca qué instrumento en cada sala |
| `subscriptions` | Estado de suscripción Stripe por usuario |
| `affiliate_products` | Productos de afiliados gestionados desde el admin |

---

## SQL

```sql
-- ══════════════════════════════════════════════════════════════
--  CODERBAND — Schema SQL para Supabase
-- ══════════════════════════════════════════════════════════════

-- ── 1. PROFILES ───────────────────────────────────────────────
-- Extiende auth.users de Supabase Auth con datos de la app
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  email       text,
  lang        text not null default 'es',
  plan        text not null default 'free' check (plan in ('free', 'pro', 'banda')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger: auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── 2. SONGS ──────────────────────────────────────────────────
-- Canciones subidas por usuarios + canciones destacadas del admin
create table public.songs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.profiles(id) on delete cascade,
  title            text not null,
  artist           text not null default '',
  glyph            text not null default '♪',
  duration         integer not null default 0,   -- segundos
  bpm              integer,
  key_sig          text,
  instruments      text[] not null default '{}', -- ['guitar','vocals',...]
  stems_expires_at timestamptz,                  -- null = no expira (featured)
  published        boolean not null default false,
  featured         boolean not null default false,
  added_this_month boolean not null default false,
  created_at       timestamptz not null default now()
);

create index on public.songs(user_id);
create index on public.songs(featured) where featured = true;


-- ── 3. BAND ROOMS ─────────────────────────────────────────────
-- Salas de práctica colaborativa en tiempo real
create table public.band_rooms (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,              -- ej: 'BND-4X9'
  host_id     uuid references public.profiles(id) on delete cascade,
  song_id     uuid references public.songs(id) on delete set null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz                        -- null = no expira
);

create index on public.band_rooms(code);
create index on public.band_rooms(host_id);


-- ── 4. BAND MEMBERS ───────────────────────────────────────────
-- Participantes en una sala y el instrumento elegido
create table public.band_members (
  room_id    uuid references public.band_rooms(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  instrument text not null default 'guitar'
    check (instrument in ('guitar','piano','bass','drums','vocals','other')),
  joined_at  timestamptz not null default now(),
  primary key (room_id, user_id)
);


-- ── 5. SUBSCRIPTIONS ──────────────────────────────────────────
-- Stripe: un registro por usuario (upsert al recibir webhooks)
create table public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null unique references public.profiles(id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  plan                   text not null default 'free'
    check (plan in ('free', 'pro', 'banda')),
  status                 text not null default 'inactive'
    check (status in ('active','inactive','past_due','canceled','trialing')),
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);


-- ── 6. AFFILIATE PRODUCTS ─────────────────────────────────────
-- Productos administrados desde el panel de admin
create table public.affiliate_products (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  price      text not null,          -- ej: '$14.99'
  url        text not null,
  image_url  text,
  platform   text not null,          -- 'Amazon', 'Sweetwater', ...
  instrument text not null default 'all'
    check (instrument in ('guitar','piano','bass','drums','vocals','other','all')),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create index on public.affiliate_products(instrument);


-- ══════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════════════

alter table public.profiles           enable row level security;
alter table public.songs              enable row level security;
alter table public.band_rooms         enable row level security;
alter table public.band_members       enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.affiliate_products enable row level security;

-- profiles: cada usuario ve/edita solo su propio perfil
create policy "profile: own read"   on public.profiles for select using (auth.uid() = id);
create policy "profile: own update" on public.profiles for update using (auth.uid() = id);

-- songs: el dueño gestiona sus canciones; todos ven las featured publicadas
create policy "songs: own all"      on public.songs for all    using (auth.uid() = user_id);
create policy "songs: public read"  on public.songs for select using (featured = true and published = true);

-- band_rooms: el host puede crear/eliminar; cualquier autenticado puede leer
create policy "rooms: host manage"  on public.band_rooms for all    using (auth.uid() = host_id);
create policy "rooms: auth read"    on public.band_rooms for select using (auth.role() = 'authenticated');

-- band_members: los miembros ven y gestionan su propia fila
create policy "members: own"        on public.band_members for all using (auth.uid() = user_id);
create policy "members: room read"  on public.band_members for select
  using (exists (
    select 1 from public.band_members m
    where m.room_id = band_members.room_id and m.user_id = auth.uid()
  ));

-- subscriptions: solo el propio usuario puede leer
create policy "subs: own"           on public.subscriptions for select using (auth.uid() = user_id);

-- affiliate_products: todos los autenticados leen; solo admin escribe (via service_role)
create policy "affiliates: auth read" on public.affiliate_products for select using (auth.role() = 'authenticated');
```

---

## Notas

- El trigger `handle_new_user` crea el perfil automáticamente al registrarse vía Supabase Auth.
- `stems_expires_at = null` significa que los stems no expiran (canciones featured).
- Las escrituras a `affiliate_products` se hacen con `service_role` key desde el servidor (panel admin).
- El plan en `profiles` se sincroniza desde `subscriptions` via webhook de Stripe.
