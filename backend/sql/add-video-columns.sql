-- Add video-related columns to generated_materials table
-- This enables storing video summary metadata

ALTER TABLE generated_materials 
ADD COLUMN IF NOT EXISTS video_path TEXT,
ADD COLUMN IF NOT EXISTS video_generated_at TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN generated_materials.video_path IS 'Path to the generated video summary file';
COMMENT ON COLUMN generated_materials.video_generated_at IS 'Timestamp when video was generated';
