alter table songs
  add column if not exists pending_midi_path text,
  add column if not exists pending_midi_instrument text;
