-- Cordeband — Studio: composiciones de usuario + notas musicales por instrumento
--
-- Mapea el flujo de /studio (StudioSong en src/types/studio.ts).
-- Las notas siguen el mismo JSON que note_sequences (ScoreNote / pipeline v2):
--   beat, dur, midi, s, tab?, startTime?, endTime?, confidence?, source?, quality?

-- ── Composiciones ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.studio_compositions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  title           TEXT NOT NULL,
  genre           TEXT,
  genre_name      TEXT,
  stems           TEXT[] NOT NULL DEFAULT '{}'
    CHECK (
      stems <@ ARRAY['guitar', 'piano', 'bass', 'drums']::TEXT[]
      AND cardinality(stems) <= 4
    ),
  prompt          TEXT NOT NULL DEFAULT '',

  bpm             INTEGER NOT NULL DEFAULT 108
    CHECK (bpm >= 40 AND bpm <= 240),
  key_signature   TEXT NOT NULL DEFAULT 'Am',
  instrumental    BOOLEAN NOT NULL DEFAULT FALSE,

  structure       JSONB NOT NULL DEFAULT '[]',
  lyrics_text     TEXT NOT NULL DEFAULT '',
  suno_prompt     TEXT NOT NULL DEFAULT '',

  -- Enlace opcional cuando la composición se sube al pipeline principal (songs + stems)
  song_id         UUID REFERENCES public.songs(id) ON DELETE SET NULL,

  status          TEXT NOT NULL DEFAULT 'composed'
    CHECK (status IN ('composed', 'upload_pending', 'processing', 'ready', 'failed')),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studio_compositions_user_id
  ON public.studio_compositions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_studio_compositions_song_id
  ON public.studio_compositions(song_id)
  WHERE song_id IS NOT NULL;

COMMENT ON TABLE public.studio_compositions IS
  'Proyectos creados en Studio: metadatos de composición IA (letra, estructura, Suno).';
COMMENT ON COLUMN public.studio_compositions.structure IS
  'Array JSON: [{ "tag": "Verso", "cls": "st-verso", "desc": "..." }]';
COMMENT ON COLUMN public.studio_compositions.stems IS
  'Instrumentos seleccionados en el flujo Studio (subset de guitar|piano|bass|drums).';

-- ── Notas por instrumento ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.studio_note_sequences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  composition_id    UUID NOT NULL REFERENCES public.studio_compositions(id) ON DELETE CASCADE,
  instrument_type   TEXT NOT NULL
    CHECK (instrument_type IN ('guitar', 'piano', 'bass', 'drums')),
  notes             JSONB NOT NULL DEFAULT '[]',
  tab_data          JSONB,
  time_signature    TEXT NOT NULL DEFAULT '4/4',
  key_signature     TEXT,
  source            TEXT NOT NULL DEFAULT 'ai_basic_pitch'
    CHECK (source IN (
      'ai_basic_pitch', 'ai_mt3', 'ai_klang',
      'user_upload', 'licensed', 'human_verified'
    )),
  confidence_avg    NUMERIC,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (composition_id, instrument_type)
);

CREATE INDEX IF NOT EXISTS idx_studio_note_sequences_composition_id
  ON public.studio_note_sequences(composition_id);

COMMENT ON TABLE public.studio_note_sequences IS
  'Notas musicales de una composición Studio, una fila por instrumento/stem.';
COMMENT ON COLUMN public.studio_note_sequences.notes IS
  'Array JSON de notas: beat, dur, midi, s, tab, startTime, endTime, confidence, source, quality.';

-- ── updated_at automático ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS studio_compositions_updated_at ON public.studio_compositions;
CREATE TRIGGER studio_compositions_updated_at
  BEFORE UPDATE ON public.studio_compositions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS studio_note_sequences_updated_at ON public.studio_note_sequences;
CREATE TRIGGER studio_note_sequences_updated_at
  BEFORE UPDATE ON public.studio_note_sequences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.studio_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_note_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "studio_compositions_select_own" ON public.studio_compositions;
CREATE POLICY "studio_compositions_select_own" ON public.studio_compositions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "studio_compositions_insert_own" ON public.studio_compositions;
CREATE POLICY "studio_compositions_insert_own" ON public.studio_compositions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "studio_compositions_update_own" ON public.studio_compositions;
CREATE POLICY "studio_compositions_update_own" ON public.studio_compositions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "studio_compositions_delete_own" ON public.studio_compositions;
CREATE POLICY "studio_compositions_delete_own" ON public.studio_compositions
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "studio_note_sequences_select_via_composition" ON public.studio_note_sequences;
CREATE POLICY "studio_note_sequences_select_via_composition" ON public.studio_note_sequences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.studio_compositions c
      WHERE c.id = studio_note_sequences.composition_id
        AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "studio_note_sequences_insert_via_composition" ON public.studio_note_sequences;
CREATE POLICY "studio_note_sequences_insert_via_composition" ON public.studio_note_sequences
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.studio_compositions c
      WHERE c.id = studio_note_sequences.composition_id
        AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "studio_note_sequences_update_via_composition" ON public.studio_note_sequences;
CREATE POLICY "studio_note_sequences_update_via_composition" ON public.studio_note_sequences
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.studio_compositions c
      WHERE c.id = studio_note_sequences.composition_id
        AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "studio_note_sequences_delete_via_composition" ON public.studio_note_sequences;
CREATE POLICY "studio_note_sequences_delete_via_composition" ON public.studio_note_sequences
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.studio_compositions c
      WHERE c.id = studio_note_sequences.composition_id
        AND c.user_id = auth.uid()
    )
  );

-- Escritura del worker (audio-processor): usar service_role, sin políticas extra.
