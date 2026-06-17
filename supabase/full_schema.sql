-- ══════════════════════════════════════════════════════════════════════════════
--  CODERBAND — Schema SQL completo v1
-- ══════════════════════════════════════════════════════════════════════════════
--
--  Reemplaza: supabase/schema.sql + supabase/band_rooms.sql (ejecutar solo este archivo en proyecto nuevo)
--
--  POST-EJECUCIÓN (Dashboard Supabase):
--    1. Auth → Providers → Anonymous → habilitar (requerido para /join)
--    2. Database → Replication → verificar band_rooms, band_members, processing_jobs
--    3. Storage → crear buckets:
--         - stems    (TTL 48h en lifecycle rules)
--         - featured (permanente)
--
--  Convenciones unificadas:
--    - profiles.full_name (no "name")
--    - band_rooms.host_id, .code, .play_started_at, .tempo
--    - band_members.instrument, .guest_name, .is_leader
--
--  Fuera de v1 (no crear): creator_profiles, creator_songs, creator_products, creator_product_clicks
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Tipos / dominios reutilizables ───────────────────────────────────────────

-- (checks inline por tabla; instrumentos: guitar | piano | bass | drums | vocals | other)

-- ══════════════════════════════════════════════════════════════════════════════
--  1. PROFILES
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  plan text not null default 'free'
    check (plan in ('free', 'pro', 'banda')),
  intended_plan text
    check (intended_plan is null or intended_plan in ('free', 'pro', 'banda')),
  songs_used_this_month integer not null default 0,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, intended_plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'intended_plan', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ══════════════════════════════════════════════════════════════════════════════
--  2. SONGS
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  artist text not null default '',
  glyph text not null default '♪',
  duration_seconds integer not null default 0,
  bpm integer,
  key_signature text,
  instruments text[] not null default '{}',
  source_type text not null default 'upload'
    check (source_type in ('upload')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'ready', 'failed')),
  storage_path text,
  is_public boolean not null default false,
  is_featured boolean not null default false,
  featured_storage_url text,
  stems_expires_at timestamptz,
  added_this_month boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists songs_user_id_idx on public.songs(user_id);
create index if not exists songs_featured_idx on public.songs(is_featured) where is_featured = true;
create index if not exists songs_status_idx on public.songs(status);

-- ══════════════════════════════════════════════════════════════════════════════
--  3. STEMS
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists public.stems (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  instrument_type text not null
    check (instrument_type in ('vocals', 'drums', 'bass', 'guitar', 'piano', 'other')),
  storage_url text,
  storage_path text,
  midi_url text,
  created_at timestamptz not null default now(),
  unique (song_id, instrument_type)
);

create index if not exists stems_song_id_idx on public.stems(song_id);

-- ══════════════════════════════════════════════════════════════════════════════
--  4. NOTE_SEQUENCES
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists public.note_sequences (
  id uuid primary key default gen_random_uuid(),
  stem_id uuid references public.stems(id) on delete set null,
  song_id uuid not null references public.songs(id) on delete cascade,
  instrument_type text not null
    check (instrument_type in ('vocals', 'drums', 'bass', 'guitar', 'piano', 'other')),
  notes jsonb not null default '[]',
  tab_data jsonb,
  time_signature text not null default '4/4',
  key_signature text,
  created_at timestamptz not null default now()
);

create index if not exists note_sequences_song_id_idx on public.note_sequences(song_id);
create index if not exists note_sequences_stem_id_idx on public.note_sequences(stem_id);

-- ══════════════════════════════════════════════════════════════════════════════
--  5. PROCESSING_JOBS
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  job_type text not null default 'full'
    check (job_type in ('full', 'regen')),
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed')),
  progress_pct integer not null default 0
    check (progress_pct >= 0 and progress_pct <= 100),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists processing_jobs_song_id_idx on public.processing_jobs(song_id);
create index if not exists processing_jobs_status_idx on public.processing_jobs(status);

-- ══════════════════════════════════════════════════════════════════════════════
--  6. SUBSCRIPTIONS
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'free'
    check (plan in ('free', 'pro', 'banda')),
  status text not null default 'inactive'
    check (status in ('active', 'inactive', 'past_due', 'canceled', 'trialing')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

-- ══════════════════════════════════════════════════════════════════════════════
--  7. AFFILIATE_PRODUCTS
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists public.affiliate_products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price text not null,
  url text not null,
  image_url text,
  platform text not null,
  instrument text not null default 'all'
    check (instrument in ('guitar', 'piano', 'bass', 'drums', 'vocals', 'other', 'all')),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_products_instrument_idx on public.affiliate_products(instrument);
create index if not exists affiliate_products_active_idx on public.affiliate_products(active) where active = true;

-- ══════════════════════════════════════════════════════════════════════════════
--  8. AFFILIATE_CLICKS
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.affiliate_products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  song_id uuid references public.songs(id) on delete set null,
  instrument_context text,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_clicks_product_id_idx on public.affiliate_clicks(product_id);
create index if not exists affiliate_clicks_user_id_idx on public.affiliate_clicks(user_id);

-- ══════════════════════════════════════════════════════════════════════════════
--  9. SONG_CACHE
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists public.song_cache (
  id uuid primary key default gen_random_uuid(),
  source_hash text not null unique,
  title text,
  artist text,
  available_instruments text[] not null default '{}',
  reference_song_id uuid references public.songs(id) on delete set null,
  use_count integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists song_cache_reference_song_id_idx on public.song_cache(reference_song_id);

-- ══════════════════════════════════════════════════════════════════════════════
--  10. BAND_ROOMS
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists public.band_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid not null references public.profiles(id) on delete cascade,
  song_id uuid references public.songs(id) on delete set null,
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'ended')),
  play_started_at timestamptz,
  tempo real not null default 1 check (tempo >= 0.5 and tempo <= 1.5),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists band_rooms_code_idx on public.band_rooms(code);
create index if not exists band_rooms_host_idx on public.band_rooms(host_id);
create index if not exists band_rooms_song_id_idx on public.band_rooms(song_id);

-- ══════════════════════════════════════════════════════════════════════════════
--  11. BAND_MEMBERS
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists public.band_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.band_rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  guest_name text,
  instrument text not null default 'guitar'
    check (instrument in ('guitar', 'piano', 'bass', 'drums', 'vocals', 'other')),
  is_leader boolean not null default false,
  status text not null default 'joined'
    check (status in ('joined', 'ready', 'disconnected')),
  joined_at timestamptz not null default now(),
  unique (room_id, user_id),
  unique (room_id, instrument)
);

create index if not exists band_members_room_idx on public.band_members(room_id);
create index if not exists band_members_user_id_idx on public.band_members(user_id);

-- ══════════════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.songs enable row level security;
alter table public.stems enable row level security;
alter table public.note_sequences enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.affiliate_products enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.song_cache enable row level security;
alter table public.band_rooms enable row level security;
alter table public.band_members enable row level security;

-- Helper: acceso a canción propia o destacada
create or replace function public.user_can_read_song(p_song_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.songs s
    where s.id = p_song_id
      and (s.user_id = auth.uid() or s.is_featured = true)
  );
$$;

-- ── profiles ──────────────────────────────────────────────────────────────────

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ── songs ─────────────────────────────────────────────────────────────────────

drop policy if exists "songs_select_own_or_featured" on public.songs;
create policy "songs_select_own_or_featured" on public.songs
  for select using (auth.uid() = user_id or is_featured = true);

drop policy if exists "songs_insert_own" on public.songs;
create policy "songs_insert_own" on public.songs
  for insert with check (auth.uid() = user_id);

drop policy if exists "songs_update_own" on public.songs;
create policy "songs_update_own" on public.songs
  for update using (auth.uid() = user_id);

drop policy if exists "songs_delete_own" on public.songs;
create policy "songs_delete_own" on public.songs
  for delete using (auth.uid() = user_id);

-- ── stems ─────────────────────────────────────────────────────────────────────

drop policy if exists "stems_select_via_song" on public.stems;
create policy "stems_select_via_song" on public.stems
  for select using (public.user_can_read_song(song_id));

-- Escritura: service_role (Railway worker) — sin políticas INSERT/UPDATE/DELETE para usuarios

-- ── note_sequences ────────────────────────────────────────────────────────────

drop policy if exists "note_sequences_select_via_song" on public.note_sequences;
create policy "note_sequences_select_via_song" on public.note_sequences
  for select using (public.user_can_read_song(song_id));

-- ── processing_jobs ───────────────────────────────────────────────────────────

drop policy if exists "processing_jobs_select_via_song" on public.processing_jobs;
create policy "processing_jobs_select_via_song" on public.processing_jobs
  for select using (public.user_can_read_song(song_id));

-- ── subscriptions ─────────────────────────────────────────────────────────────

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- INSERT/UPDATE: webhooks Stripe vía service_role

-- ── affiliate_products ────────────────────────────────────────────────────────

drop policy if exists "affiliate_products_select_active" on public.affiliate_products;
create policy "affiliate_products_select_active" on public.affiliate_products
  for select using (active = true);

-- Escritura: service_role (panel admin)

-- ── affiliate_clicks ──────────────────────────────────────────────────────────

drop policy if exists "affiliate_clicks_insert_auth" on public.affiliate_clicks;
create policy "affiliate_clicks_insert_auth" on public.affiliate_clicks
  for insert with check (auth.role() = 'authenticated');

-- ── song_cache ────────────────────────────────────────────────────────────────
-- Sin políticas para usuarios; solo service_role (worker dedup)

-- ── band_rooms (copiado de band_rooms.sql — probado con la app) ───────────────

drop policy if exists "band_rooms_host_all" on public.band_rooms;
create policy "band_rooms_host_all" on public.band_rooms
  for all using (auth.uid() = host_id);

drop policy if exists "band_rooms_member_read" on public.band_rooms;
create policy "band_rooms_member_read" on public.band_rooms
  for select using (
    exists (
      select 1 from public.band_members m
      where m.room_id = band_rooms.id and m.user_id = auth.uid()
    )
  );

-- ── band_members ──────────────────────────────────────────────────────────────

drop policy if exists "band_members_room_read" on public.band_members;
create policy "band_members_room_read" on public.band_members
  for select using (
    exists (
      select 1 from public.band_members mine
      where mine.room_id = band_members.room_id and mine.user_id = auth.uid()
    )
  );

drop policy if exists "band_members_own_insert" on public.band_members;
create policy "band_members_own_insert" on public.band_members
  for insert with check (auth.uid() = user_id);

drop policy if exists "band_members_own_update" on public.band_members;
create policy "band_members_own_update" on public.band_members
  for update using (auth.uid() = user_id);

drop policy if exists "band_members_host_insert" on public.band_members;
create policy "band_members_host_insert" on public.band_members
  for insert with check (
    exists (
      select 1 from public.band_rooms r
      where r.id = room_id and r.host_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
--  REALTIME (supabase_realtime publication)
-- ══════════════════════════════════════════════════════════════════════════════

alter publication supabase_realtime add table public.band_rooms;
alter publication supabase_realtime add table public.band_members;
alter publication supabase_realtime add table public.processing_jobs;

-- ══════════════════════════════════════════════════════════════════════════════
--  FIN — Schema v1 completo
-- ══════════════════════════════════════════════════════════════════════════════
