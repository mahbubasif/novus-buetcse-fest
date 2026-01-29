-- Create students table for simple authentication
CREATE TABLE IF NOT EXISTS public.students (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  full_name text,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT students_pkey PRIMARY KEY (id)
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS students_username_idx ON public.students (username);

-- Disable RLS for simplicity (hackathon demo)
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
