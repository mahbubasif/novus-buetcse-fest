-- Migration script for Handwritten Notes Digitization feature
-- Run this in your Supabase SQL Editor

-- Create the digitized_notes table
CREATE TABLE IF NOT EXISTS public.digitized_notes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  original_filename text NOT NULL,
  file_size integer,
  mime_type text,
  output_format text CHECK (output_format = ANY (ARRAY['markdown'::text, 'latex'::text, 'plain'::text])),
  subject text DEFAULT 'general',
  digitized_content text NOT NULL,
  character_count integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT digitized_notes_pkey PRIMARY KEY (id)
);

-- Create an index on created_at for faster history queries
CREATE INDEX IF NOT EXISTS idx_digitized_notes_created_at ON public.digitized_notes(created_at DESC);

-- Create an index on output_format for filtering
CREATE INDEX IF NOT EXISTS idx_digitized_notes_format ON public.digitized_notes(output_format);

-- Enable Row Level Security (optional - remove if not needed)
-- ALTER TABLE public.digitized_notes ENABLE ROW LEVEL SECURITY;

-- Allow public access (for hackathon - adjust as needed for production)
-- CREATE POLICY "Allow public read access" ON public.digitized_notes FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert" ON public.digitized_notes FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public delete" ON public.digitized_notes FOR DELETE USING (true);

-- Grant permissions (if using service role)
GRANT ALL ON public.digitized_notes TO anon;
GRANT ALL ON public.digitized_notes TO authenticated;
GRANT ALL ON public.digitized_notes TO service_role;
