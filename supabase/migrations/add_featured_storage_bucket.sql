-- Supabase Storage bucket for featured catalog (audio + cover art)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'featured',
  'featured',
  true,
  52428800,
  array[
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/flac',
    'audio/x-flac',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for catalog assets
drop policy if exists "featured_public_read" on storage.objects;
create policy "featured_public_read"
  on storage.objects for select
  using (bucket_id = 'featured');

-- Service role uploads bypass RLS; no extra write policy needed for admin API.
