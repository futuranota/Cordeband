-- Featured catalog metadata + catalog source type

alter table public.songs
  add column if not exists description text,
  add column if not exists cover_url text,
  add column if not exists is_ai_generated boolean not null default false;

alter table public.songs alter column user_id drop not null;

alter table public.songs drop constraint if exists songs_source_type_check;
alter table public.songs add constraint songs_source_type_check
  check (source_type in ('upload', 'catalog'));

-- Storage: create bucket "featured" in Supabase Dashboard (public read recommended)
-- Paths: audio/{songId}.{ext}  covers/{songId}.{ext}
