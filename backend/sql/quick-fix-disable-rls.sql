-- =====================================================
-- QUICK FIX: Disable RLS temporarily for hackathon
-- Use this if you're in a rush and need to test quickly
-- WARNING: NOT SECURE - Only for development/hackathon
-- =====================================================

-- Disable RLS on all tables
ALTER TABLE public.materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_embeddings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_materials DISABLE ROW LEVEL SECURITY;

-- Make storage bucket public (no authentication required)
-- Go to Supabase Dashboard > Storage > course-materials bucket
-- Click "Policies" and add this policy:

CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'course-materials');

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-materials');

CREATE POLICY "Allow public deletes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'course-materials');

-- IMPORTANT: After hackathon, enable RLS and use proper authentication!
