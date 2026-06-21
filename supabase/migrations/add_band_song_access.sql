-- Allow band room members to read the host's song (stems, score, metadata)
-- Required for guest join flow in live band sessions.

create or replace function public.user_can_read_song(p_song_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.songs s
    where s.id = p_song_id
      and (s.user_id = auth.uid() or s.is_featured = true)
  )
  or exists (
    select 1 from public.band_members bm
    join public.band_rooms br on br.id = bm.room_id
    where bm.user_id = auth.uid()
      and br.song_id = p_song_id
      and br.status != 'ended'
  );
$$;

drop policy if exists "songs_select_own_or_featured" on public.songs;
create policy "songs_select_own_or_featured" on public.songs
  for select using (public.user_can_read_song(id));
