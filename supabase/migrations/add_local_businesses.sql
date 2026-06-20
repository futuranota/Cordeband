-- Local businesses for city/postal-based recommendations in the player

create table if not exists public.local_businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  address text not null,
  city text not null,
  postal_code text,
  maps_url text,
  banner_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists local_businesses_city_idx on public.local_businesses (lower(city));
create index if not exists local_businesses_postal_idx on public.local_businesses (postal_code)
  where postal_code is not null;
create index if not exists local_businesses_active_idx on public.local_businesses (active)
  where active = true;

alter table public.local_businesses enable row level security;

drop policy if exists "local_businesses_select_active" on public.local_businesses;
create policy "local_businesses_select_active" on public.local_businesses
  for select using (active = true);

-- Writes via service_role (admin API)
