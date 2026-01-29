-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.chat_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  session_id uuid,
  role text CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_logs_pkey PRIMARY KEY (id),
  CONSTRAINT chat_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.community_messages (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  message text NOT NULL,
  mentions jsonb DEFAULT '[]'::jsonb,
  user_id bigint NOT NULL,
  username text NOT NULL,
  full_name text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_messages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.forum_comments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  post_id bigint NOT NULL,
  content text NOT NULL,
  user_id bigint NOT NULL,
  username text NOT NULL,
  full_name text,
  mentions jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  is_ai_generated boolean DEFAULT false,
  ai_sources jsonb,
  CONSTRAINT forum_comments_pkey PRIMARY KEY (id),
  CONSTRAINT forum_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.forum_posts(id)
);
CREATE TABLE public.forum_posts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  user_id bigint NOT NULL,
  username text NOT NULL,
  full_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  tagged_student jsonb,
  ai_reply_generated boolean DEFAULT false,
  CONSTRAINT forum_posts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.generated_materials (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  prompt text,
  output_content text,
  type text CHECK (type = ANY (ARRAY['Theory'::text, 'Lab'::text])),
  is_validated boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  validation_score integer CHECK (validation_score IS NULL OR validation_score >= 0 AND validation_score <= 100),
  validation_results jsonb,
  CONSTRAINT generated_materials_pkey PRIMARY KEY (id)
);
CREATE TABLE public.material_embeddings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  material_id bigint,
  chunk_text text,
  embedding USER-DEFINED,
  CONSTRAINT material_embeddings_pkey PRIMARY KEY (id),
  CONSTRAINT material_embeddings_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id)
);
CREATE TABLE public.materials (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category = ANY (ARRAY['Theory'::text, 'Lab'::text])),
  file_url text,
  content_text text,
  metadata jsonb,
  uploaded_by uuid,
  CONSTRAINT materials_pkey PRIMARY KEY (id),
  CONSTRAINT materials_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id)
);
CREATE TABLE public.students (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  full_name text,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT students_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  email text,
  full_name text,
  role text DEFAULT 'student'::text CHECK (role = ANY (ARRAY['admin'::text, 'student'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);