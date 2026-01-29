-- Add validation columns to generated_materials table
-- Part 4: Content Validation & Evaluation System

-- Add validation_score column (0-100)
ALTER TABLE generated_materials 
ADD COLUMN IF NOT EXISTS validation_score INTEGER;

-- Add validation_results column (JSONB for detailed results)
ALTER TABLE generated_materials 
ADD COLUMN IF NOT EXISTS validation_results JSONB;

-- Add comment explaining the columns
COMMENT ON COLUMN generated_materials.validation_score IS 'Overall validation score (0-100) from content validation';
COMMENT ON COLUMN generated_materials.validation_results IS 'Detailed validation results including syntax, grounding, and quality checks';

-- Create index on validation_score for faster queries
CREATE INDEX IF NOT EXISTS idx_generated_materials_validation_score 
ON generated_materials(validation_score);

-- Create index on is_validated for filtering
CREATE INDEX IF NOT EXISTS idx_generated_materials_is_validated 
ON generated_materials(is_validated);

-- Add constraint to ensure validation_score is between 0 and 100
ALTER TABLE generated_materials 
ADD CONSTRAINT validation_score_range 
CHECK (validation_score IS NULL OR (validation_score >= 0 AND validation_score <= 100));

COMMENT ON TABLE generated_materials IS 'Stores AI-generated educational materials with validation results';
