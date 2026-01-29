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
  const { query, threshold = 0.3, limit = 10, enhance = false } = req.body;

  try {
    // Validate query
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    console.log(`\n🔍 Searching for: "${query}"`);
    console.log(`   Threshold: ${threshold}, Limit: ${limit}, Enhance: ${enhance}`);

    // First, check if we have any embeddings at all
    const { count: embeddingCount } = await supabase
      .from('material_embeddings')
      .select('*', { count: 'exact', head: true });

    if (!embeddingCount || embeddingCount === 0) {
      console.log('⚠️ No embeddings found in database. Materials need to be processed first.');
      return res.status(200).json({
        success: true,
        query: query,
        count: 0,
        results: [],
        message: 'No processed materials found. Please process materials first using POST /api/rag/process-all',
        needsProcessing: true,
      });
    }

    console.log(`📊 Total embeddings in database: ${embeddingCount}`);

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
        .select('id, title, category, file_url')
        .in('id', materialIds);

      const materialMap = {};
      materials?.forEach(m => {
        materialMap[m.id] = m;
      });

      const enrichedResults = results
        .map(result => ({
          ...result,
          material_title: materialMap[result.material_id]?.title || 'Unknown',
          material_category: materialMap[result.material_id]?.category || 'Unknown',
          file_name: materialMap[result.material_id]?.file_url ? materialMap[result.material_id].file_url.split('/').pop() : null,
          similarity_percent: Math.round(result.similarity * 100),
        }))
        .filter(result => result.material_title !== 'Unknown' && result.material_category !== 'Unknown');

      // Optional: Enhance results with LLM-generated context-aware snippets
      let finalResults = enrichedResults;
      if (enhance && enrichedResults.length > 0) {
        try {
          const OpenAI = require('openai');
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

          console.log('🤖 Enhancing results with AI summaries...');

          const enhancePromises = enrichedResults.slice(0, 5).map(async (result) => {
            try {
              const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{
                  role: 'system',
                  content: 'You are a helpful assistant that creates concise, relevant summaries of search results. Generate a 1-2 sentence summary that highlights why this content is relevant to the user\'s query.'
                }, {
                  role: 'user',
                  content: `Query: "${query}"\n\nContent from "${result.material_title}":\n${result.chunk_text.substring(0, 500)}...\n\nCreate a brief, relevant summary:`
                }],
                temperature: 0.7,
                max_tokens: 100,
              });

              return {
                ...result,
                ai_summary: completion.choices[0].message.content.trim()
              };
            } catch (err) {
              console.warn('Failed to enhance result:', err.message);
              return result;
            }
          });

          const enhanced = await Promise.all(enhancePromises);
          // Merge enhanced results with remaining unenhanced results
          finalResults = [...enhanced, ...enrichedResults.slice(5)];
          console.log('✅ Enhanced first 5 results with AI summaries');
        } catch (enhanceError) {
          console.warn('⚠️ Enhancement failed, returning standard results:', enhanceError.message);
        }
      }

      return res.status(200).json({
        success: true,
        query: query,
        count: finalResults.length,
        results: finalResults,
        enhanced: enhance,
      });
    }

    return res.status(200).json({
      success: true,
      query: query,
      count: 0,
      results: [],
      message: 'No matching documents found. Try a different query or lower the threshold.',
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

    if (!materials || materials.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No materials with content found to process',
        results: [],
      });
    }

    // Get materials that already have embeddings
    const { data: processed } = await supabase
      .from('material_embeddings')
      .select('material_id');

    const processedIds = new Set(processed?.map(p => p.material_id) || []);

    // Filter to unprocessed materials
    const unprocessed = materials?.filter(m => !processedIds.has(m.id)) || [];

    console.log(`📊 Found ${unprocessed.length} unprocessed materials out of ${materials.length} total`);

    if (unprocessed.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All materials are already processed',
        total_materials: materials.length,
        results: [],
      });
    }

    const results = [];

    for (const material of unprocessed) {
      try {
        // Fetch full content
        const { data: fullMaterial } = await supabase
          .from('materials')
          .select('content_text')
          .eq('id', material.id)
          .single();

        if (!fullMaterial?.content_text) {
          console.log(`⚠️ Skipping ${material.title} - no content`);
          continue;
        }

        console.log(`\n🔄 Processing: ${material.title}`);
        const chunks = splitIntoChunks(fullMaterial.content_text, 1000, 100);
        console.log(`   📝 ${fullMaterial.content_text.length} chars -> ${chunks.length} chunks`);

        const records = [];

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          console.log(`   🧠 Embedding chunk ${i + 1}/${chunks.length}...`);
          const embedding = await getEmbedding(chunk);
          records.push({
            material_id: material.id,
            chunk_text: chunk,
            embedding: embedding,
          });
          // Rate limit protection
          await new Promise(resolve => setTimeout(resolve, 150));
        }

        if (records.length > 0) {
          const { error: insertError } = await supabase
            .from('material_embeddings')
            .insert(records);

          if (insertError) {
            throw new Error(insertError.message);
          }

          results.push({ id: material.id, title: material.title, chunks: records.length, status: 'success' });
          console.log(`   ✅ Stored ${records.length} embeddings`);
        }
      } catch (error) {
        console.error(`❌ Failed to process ${material.title}:`, error.message);
        results.push({ id: material.id, title: material.title, error: error.message, status: 'failed' });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const totalChunks = results.filter(r => r.status === 'success').reduce((sum, r) => sum + r.chunks, 0);

    return res.status(200).json({
      success: true,
      message: `Processed ${successCount}/${unprocessed.length} materials, created ${totalChunks} embeddings`,
      total_materials: materials.length,
      processed_count: successCount,
      total_chunks: totalChunks,
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

/**
 * Get global embedding status
 * GET /api/rag/status
 */
const getGlobalStatus = async (req, res) => {
  try {
    // Count total materials with content
    const { data: materials, error: mErr } = await supabase
      .from('materials')
      .select('id, title, category')
      .not('content_text', 'is', null);

    if (mErr) throw mErr;

    // Count total embeddings
    const { count: embeddingCount, error: eErr } = await supabase
      .from('material_embeddings')
      .select('*', { count: 'exact', head: true });

    if (eErr) throw eErr;

    // Get materials with embeddings
    const { data: processedMaterials } = await supabase
      .from('material_embeddings')
      .select('material_id');

    const processedIds = new Set(processedMaterials?.map(p => p.material_id) || []);

    // Categorize materials
    const processed = materials?.filter(m => processedIds.has(m.id)) || [];
    const unprocessed = materials?.filter(m => !processedIds.has(m.id)) || [];

    return res.status(200).json({
      success: true,
      data: {
        total_materials: materials?.length || 0,
        processed_materials: processed.length,
        unprocessed_materials: unprocessed.length,
        total_embeddings: embeddingCount || 0,
        is_ready: unprocessed.length === 0 && (embeddingCount || 0) > 0,
        unprocessed_list: unprocessed.map(m => ({ id: m.id, title: m.title, category: m.category })),
      },
    });

  } catch (error) {
    console.error('❌ Global status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get status',
      details: error.message,
    });
  }
};

module.exports = {
  processMaterial,
  search,
  getStatus,
  processAllMaterials,
  getGlobalStatus,
};
