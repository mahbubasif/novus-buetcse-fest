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
CREATE TABLE public.generated_materials (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  prompt text,
  output_content text,
  type text CHECK (type = ANY (ARRAY['Theory'::text, 'Lab'::text])),
  is_validated boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
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