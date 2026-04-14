-- Add image_sequence column to action_timeline_generations table
-- This stores the shuffled image index sequence for each timeline

ALTER TABLE action_timeline_generations
ADD COLUMN IF NOT EXISTS image_sequence JSONB DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN action_timeline_generations.image_sequence IS 'Array of shuffled image indices (0-20) for randomizing affirmation backgrounds. Each timeline gets a unique 63-element sequence.';
