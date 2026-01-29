-- =====================================================
-- Supabase Vector Search SQL Setup
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create material_embeddings table (if not exists)
CREATE TABLE IF NOT EXISTS material_embeddings (
  id BIGSERIAL PRIMARY KEY,
  material_id BIGINT REFERENCES materials(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster similarity search
CREATE INDEX IF NOT EXISTS idx_material_embeddings_embedding 
ON material_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index on material_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_material_embeddings_material_id 
ON material_embeddings(material_id);

-- =====================================================
-- match_documents function for vector similarity search
-- =====================================================
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  material_id bigint,
  chunk_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    me.id,
    me.material_id,
    me.chunk_text,
    1 - (me.embedding <=> query_embedding) AS similarity
  FROM material_embeddings me
  WHERE 1 - (me.embedding <=> query_embedding) > match_threshold
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =====================================================
-- Optional: Function to get material info with chunks
-- =====================================================
CREATE OR REPLACE FUNCTION search_with_material_info(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  chunk_id bigint,
  material_id bigint,
  material_title text,
  material_category text,
  chunk_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    me.id AS chunk_id,
    me.material_id,
    m.title AS material_title,
    m.category AS material_category,
    me.chunk_text,
    1 - (me.embedding <=> query_embedding) AS similarity
  FROM material_embeddings me
  JOIN materials m ON m.id = me.material_id
  WHERE 1 - (me.embedding <=> query_embedding) > match_threshold
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
