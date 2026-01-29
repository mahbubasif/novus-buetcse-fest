-- Create forum_posts table for student discussions
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  user_id bigint NOT NULL,
  username text NOT NULL,
  full_name text,
  tagged_student jsonb DEFAULT NULL,
  ai_reply_generated boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT forum_posts_pkey PRIMARY KEY (id)
);

-- Create forum_comments table for post comments
CREATE TABLE IF NOT EXISTS public.forum_comments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  post_id bigint NOT NULL,
  content text NOT NULL,
  user_id bigint NOT NULL,
  username text NOT NULL,
  full_name text,
  mentions jsonb DEFAULT '[]'::jsonb,
  is_ai_generated boolean DEFAULT false,
  ai_sources jsonb DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT forum_comments_pkey PRIMARY KEY (id),
  CONSTRAINT forum_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS forum_posts_created_at_idx ON public.forum_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS forum_posts_user_id_idx ON public.forum_posts (user_id);
CREATE INDEX IF NOT EXISTS forum_comments_post_id_idx ON public.forum_comments (post_id);
CREATE INDEX IF NOT EXISTS forum_comments_created_at_idx ON public.forum_comments (created_at ASC);

-- Disable RLS for simplicity (hackathon demo)
ALTER TABLE public.forum_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments DISABLE ROW LEVEL SECURITY;
