/**
 * RAG Controller
 * Handles embedding generation and semantic search
 */

const supabase = require('../lib/supabase');
const { getEmbedding } = require('../utils/openai');
const { splitIntoChunks } = require('../utils/chunker');

/**
 * Process a material and generate embeddings for its content
 * POST /api/rag/process/:id
 */
const processMaterial = async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`\n🔄 Processing material ID: ${id}`);

    // Step 1: Fetch the material
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('id, title, content_text')
      .eq('id', id)
      .single();

    if (fetchError || !material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found',
      });
    }

    if (!material.content_text || material.content_text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Material has no text content to process',
      });
    }

    console.log(`📄 Material: "${material.title}"`);
    console.log(`📝 Content length: ${material.content_text.length} characters`);

    // Step 2: Delete existing embeddings for this material (re-processing)
    const { error: deleteError } = await supabase
      .from('material_embeddings')
      .delete()
      .eq('material_id', id);

    if (deleteError) {
      console.warn('⚠️ Could not delete existing embeddings:', deleteError.message);
    }

    // Step 3: Split text into chunks
    const chunks = splitIntoChunks(material.content_text, 1000, 100);
    console.log(`✂️ Split into ${chunks.length} chunks`);

    if (chunks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract any chunks from content',
      });
    }

    // Step 4: Generate embeddings and prepare records
    const records = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`🧠 Generating embedding for chunk ${i + 1}/${chunks.length}...`);

      try {
        const embedding = await getEmbedding(chunk);

        records.push({
          material_id: parseInt(id),
          chunk_text: chunk,
          embedding: embedding,
        });

        // Small delay to avoid rate limits
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (embeddingError) {
        console.error(`❌ Failed to embed chunk ${i + 1}:`, embeddingError.message);
        // Continue with other chunks
      }
    }

    if (records.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate any embeddings',
      });
    }

    // Step 5: Batch insert embeddings
    console.log(`💾 Storing ${records.length} embeddings...`);

    const { data: insertedData, error: insertError } = await supabase
      .from('material_embeddings')
      .insert(records)
      .select('id');

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to store embeddings',
        details: insertError.message,
      });
    }

    console.log(`✅ Successfully processed material ID: ${id}`);

    return res.status(200).json({
      success: true,
      message: 'Material processed successfully',
      data: {
        material_id: parseInt(id),
        material_title: material.title,
        chunks_created: records.length,
        total_characters: material.content_text.length,
      },
    });

  } catch (error) {
    console.error('❌ Process material error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process material',
      details: error.message,
    });
  }
};

/**
 * Search for relevant content using semantic search
 * POST /api/rag/search
 */
const search = async (req, res) => {
  const { query, threshold = 0.7, limit = 5 } = req.body;

  try {
    // Validate query
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    console.log(`\n🔍 Searching for: "${query}"`);

    // Step 1: Generate embedding for the query
    const queryEmbedding = await getEmbedding(query);
    console.log('🧠 Query embedding generated');

    // Step 2: Call the match_documents function
    const { data: results, error: searchError } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
      });

    if (searchError) {
      console.error('❌ Search error:', searchError);
      return res.status(500).json({
        success: false,
        error: 'Search failed',
        details: searchError.message,
      });
    }

    console.log(`✅ Found ${results?.length || 0} results`);

    // Step 3: Enrich results with material info
    if (results && results.length > 0) {
      const materialIds = [...new Set(results.map(r => r.material_id))];

      const { data: materials } = await supabase
        .from('materials')
        .select('id, title, category')
        .in('id', materialIds);

      const materialMap = {};
      materials?.forEach(m => {
        materialMap[m.id] = m;
      });

      const enrichedResults = results.map(result => ({
        ...result,
        material_title: materialMap[result.material_id]?.title || 'Unknown',
        material_category: materialMap[result.material_id]?.category || 'Unknown',
      }));

      return res.status(200).json({
        success: true,
        query: query,
        count: enrichedResults.length,
        results: enrichedResults,
      });
    }

    return res.status(200).json({
      success: true,
      query: query,
      count: 0,
      results: [],
      message: 'No matching documents found. Try adjusting your query or lowering the threshold.',
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Search failed',
      details: error.message,
    });
  }
};

/**
 * Get processing status for a material
 * GET /api/rag/status/:id
 */
const getStatus = async (req, res) => {
  const { id } = req.params;

  try {
    // Get material info
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .select('id, title, content_text')
      .eq('id', id)
      .single();

    if (materialError || !material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found',
      });
    }

    // Get embedding count
    const { count, error: countError } = await supabase
      .from('material_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('material_id', id);

    return res.status(200).json({
      success: true,
      data: {
        material_id: parseInt(id),
        material_title: material.title,
        content_length: material.content_text?.length || 0,
        embeddings_count: count || 0,
        is_processed: (count || 0) > 0,
      },
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get status',
      details: error.message,
    });
  }
};

/**
 * Process all unprocessed materials
 * POST /api/rag/process-all
 */
const processAllMaterials = async (req, res) => {
  try {
    // Get all materials that have content
    const { data: materials, error: fetchError } = await supabase
      .from('materials')
      .select('id, title')
      .not('content_text', 'is', null);

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    // Get materials that already have embeddings
    const { data: processed } = await supabase
      .from('material_embeddings')
      .select('material_id')
      .limit(1000);

    const processedIds = new Set(processed?.map(p => p.material_id) || []);

    // Filter to unprocessed materials
    const unprocessed = materials?.filter(m => !processedIds.has(m.id)) || [];

    console.log(`📊 Found ${unprocessed.length} unprocessed materials`);

    const results = [];

    for (const material of unprocessed) {
      try {
        // Fetch full content
        const { data: fullMaterial } = await supabase
          .from('materials')
          .select('content_text')
          .eq('id', material.id)
          .single();

        if (!fullMaterial?.content_text) continue;

        const chunks = splitIntoChunks(fullMaterial.content_text, 1000, 100);
        const records = [];

        for (const chunk of chunks) {
          const embedding = await getEmbedding(chunk);
          records.push({
            material_id: material.id,
            chunk_text: chunk,
            embedding: embedding,
          });
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (records.length > 0) {
          await supabase.from('material_embeddings').insert(records);
          results.push({ id: material.id, title: material.title, chunks: records.length });
          console.log(`✅ Processed: ${material.title}`);
        }
      } catch (error) {
        console.error(`❌ Failed to process ${material.title}:`, error.message);
        results.push({ id: material.id, title: material.title, error: error.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${results.filter(r => !r.error).length} materials`,
      results: results,
    });

  } catch (error) {
    console.error('❌ Process all error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process materials',
      details: error.message,
    });
  }
};

module.exports = {
  processMaterial,
  search,
  getStatus,
  processAllMaterials,
};
