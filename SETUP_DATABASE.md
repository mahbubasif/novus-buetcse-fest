# Database Setup Guide

## 🚨 IMPORTANT: Run This SQL in Supabase

The intelligent search feature requires a PostgreSQL function that doesn't exist yet in your database. Follow these steps:

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `yskgwzxpgqaalemvhiov`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Vector Search SQL

Copy and paste the entire contents of `backend/sql/vector-search.sql` into the SQL editor and click **Run**.

**Or copy this SQL directly:**

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create material_embeddings table
CREATE TABLE IF NOT EXISTS material_embeddings (
  id BIGSERIAL PRIMARY KEY,
  material_id BIGINT REFERENCES materials(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster search
CREATE INDEX IF NOT EXISTS idx_material_embeddings_embedding
ON material_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_material_embeddings_material_id
ON material_embeddings(material_id);

-- Create the match_documents function (CRITICAL!)
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
```

### Step 3: Verify Setup

Run this query to verify the function was created:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'match_documents';
```

You should see `match_documents` in the results.

### Step 4: Test the Search

1. Start your backend: `cd backend && npm run dev`
2. Start your frontend: `cd frontend && npm run dev`
3. Upload a material (if you haven't already)
4. Go to the Search page
5. Try searching for relevant terms!

## Troubleshooting

**Error: "pgvector extension not found"**

- The extension is not enabled. Run: `CREATE EXTENSION vector;`
- Contact Supabase support if this fails

**Error: "table material_embeddings does not exist"**

- Run the complete `vector-search.sql` file
- Check if the materials table exists first

**No search results found**

- Materials need to be processed first
- Go to Dashboard, upload a material
- The backend will automatically process it on upload
- Or manually process via: `POST /api/rag/process/:id`

## Next Steps

Once the SQL is executed:

1. ✅ Search functionality will work
2. ✅ Embeddings will be generated on material upload
3. ✅ Semantic search will return relevant results
