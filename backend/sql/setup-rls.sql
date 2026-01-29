-- =====================================================
-- COMPREHENSIVE DATABASE SETUP WITH RLS
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. USER PROFILES TABLE (For role management)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role text CHECK (role IN ('admin', 'student')) DEFAULT 'student',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() = id);

-- Policy: Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 2. MATERIALS TABLE (Already exists, add RLS)
-- =====================================================
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view materials
CREATE POLICY "Anyone can view materials" 
ON public.materials FOR SELECT 
TO authenticated
USING (true);

-- Policy: Admins can insert materials
CREATE POLICY "Admins can insert materials" 
ON public.materials FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins can update materials
CREATE POLICY "Admins can update materials" 
ON public.materials FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins can delete materials
CREATE POLICY "Admins can delete materials" 
ON public.materials FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 3. MATERIAL EMBEDDINGS TABLE (Add RLS)
-- =====================================================
ALTER TABLE public.material_embeddings ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view embeddings
CREATE POLICY "Anyone can view embeddings" 
ON public.material_embeddings FOR SELECT 
TO authenticated
USING (true);

-- Policy: Admins can manage embeddings
CREATE POLICY "Admins can insert embeddings" 
ON public.material_embeddings FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 4. CHAT LOGS TABLE (Add RLS)
-- =====================================================
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own chat logs
CREATE POLICY "Users can view own chat logs" 
ON public.chat_logs FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own chat logs
CREATE POLICY "Users can insert own chat logs" 
ON public.chat_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 5. GENERATED MATERIALS TABLE (Add RLS)
-- =====================================================
ALTER TABLE public.generated_materials ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all generated materials
CREATE POLICY "Admins can view generated materials" 
ON public.generated_materials FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins can insert generated materials
CREATE POLICY "Admins can insert generated materials" 
ON public.generated_materials FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGER TO AUTO-CREATE USER PROFILE
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 8. STORAGE BUCKET POLICIES (CRITICAL FOR FILE UPLOADS)
-- =====================================================

-- NOTE: Run these in the Supabase Dashboard > Storage > Policies
-- Or use the SQL below if you have the storage schema access

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-materials');

-- Allow authenticated users to read files
CREATE POLICY "Anyone can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'course-materials');

-- Allow admins to delete files
CREATE POLICY "Admins can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-materials' AND
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 9. CREATE FIRST ADMIN USER (Update with your email)
-- =====================================================

-- After you sign up with Supabase Auth, update your role to admin:
-- UPDATE public.user_profiles 
-- SET role = 'admin' 
-- WHERE email = 'your-email@example.com';

-- =====================================================
-- 10. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by ON public.materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_id ON public.chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_session_id ON public.chat_logs(session_id);
