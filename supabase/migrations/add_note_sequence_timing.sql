-- Per-sequence transcription metadata (note-level startTime/endTime live in notes JSONB).

alter table public.note_sequences
  add column if not exists source text not null default 'ai_basic_pitch'
    check (source in (
      'ai_basic_pitch',
      'ai_mt3',
      'ai_klang',
      'user_upload',
      'licensed',
      'human_verified'
    )),
  add column if not exists confidence_avg numeric;

comment on column public.note_sequences.source is
  'How this sequence was produced (ai_basic_pitch, licensed MusicXML, etc.)';
comment on column public.note_sequences.confidence_avg is
  'Mean confidence of notes in the JSON array when produced by AI transcription';
