-- Cordeband — Fase C: band_rooms + band_members (sala en tiempo real)
-- Ejecutar en Supabase SQL Editor después de schema.sql
-- Habilitar Realtime: Database → Replication → supabase_realtime → band_rooms, band_members

create table if not exists public.band_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid not null references public.profiles(id) on delete cascade,
  song_id uuid,
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'ended')),
  play_started_at timestamptz,
  tempo real not null default 1 check (tempo >= 0.5 and tempo <= 1.5),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists band_rooms_code_idx on public.band_rooms(code);
create index if not exists band_rooms_host_idx on public.band_rooms(host_id);

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

alter table public.band_rooms enable row level security;
alter table public.band_members enable row level security;

-- Rooms: host manages; members of the room can read
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

-- Members: read everyone in your room; insert/update own row
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

-- Host can insert members when creating room (leader row)
drop policy if exists "band_members_host_insert" on public.band_members;
create policy "band_members_host_insert" on public.band_members
  for insert with check (
    exists (
      select 1 from public.band_rooms r
      where r.id = room_id and r.host_id = auth.uid()
    )
  );

alter publication supabase_realtime add table public.band_rooms;
alter publication supabase_realtime add table public.band_members;
