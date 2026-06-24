-- Add midi_filename column to songs table to store the original MIDI filename
ALTER TABLE songs ADD COLUMN midi_filename text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN songs.midi_filename IS 'Original MIDI filename when uploaded by user (source=user_upload)';
