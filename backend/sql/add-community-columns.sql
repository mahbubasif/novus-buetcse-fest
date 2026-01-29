-- Add new columns to forum_posts table for tagged student and AI reply feature
ALTER TABLE public.forum_posts 
ADD COLUMN IF NOT EXISTS tagged_student jsonb DEFAULT NULL;

ALTER TABLE public.forum_posts 
ADD COLUMN IF NOT EXISTS ai_reply_generated boolean DEFAULT false;

-- Add new columns to forum_comments table for AI-generated comments
ALTER TABLE public.forum_comments 
ADD COLUMN IF NOT EXISTS is_ai_generated boolean DEFAULT false;

ALTER TABLE public.forum_comments 
ADD COLUMN IF NOT EXISTS ai_sources jsonb DEFAULT NULL;
