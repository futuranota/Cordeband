-- Supabase Storage bucket for user uploads and processed stems (48h TTL on objects)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'stems',
  'stems',
  false,
  52428800,
  array[
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/flac',
    'audio/x-flac'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Users read their own uploads via signed URLs; service role handles writes.
