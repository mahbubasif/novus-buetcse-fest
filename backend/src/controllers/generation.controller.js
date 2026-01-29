/**
 * AI Material Generation Controller
 * Combines Internal (RAG) + External (Wikipedia) context to generate learning materials
 */

const supabase = require('../lib/supabase');
const { getEmbedding } = require('../utils/openai');
const { fetchWikipediaSummary } = require('../utils/externalContext');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate AI learning material (Theory or Lab)
 * POST /api/generate
 */
const generateMaterial = async (req, res) => {
  const { topic, type } = req.body;

  try {
    // ============================================
    // STEP 1: Validation
    // ============================================
    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required',
      });
    }

    if (!type || !['Theory', 'Lab'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be either "Theory" or "Lab"',
      });
    }

    console.log(`\n🎨 Generating ${type} material for topic: "${topic}"`);

    // ============================================
    // STEP 2: Fetch Internal Context (RAG Search)
    // ============================================
    let internalContext = '';
    try {
      console.log('📚 Fetching internal context from RAG...');
      const queryEmbedding = await getEmbedding(topic);

      const { data: ragResults, error: ragError } = await supabase
        .rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: 0.5, // Lower threshold for broader context
          match_count: 5,
        });

      if (ragError) {
        console.warn('⚠️ RAG search failed:', ragError.message);
      } else if (ragResults && ragResults.length > 0) {
        internalContext = ragResults
          .map((result, idx) => `[Internal Source ${idx + 1}]: ${result.chunk_text}`)
          .join('\n\n');
        console.log(`✅ Retrieved ${ragResults.length} internal chunks`);
      } else {
        console.log('ℹ️ No internal context found');
        internalContext = 'No relevant internal materials found.';
      }
    } catch (ragErr) {
      console.warn('⚠️ RAG context fetch failed:', ragErr.message);
      internalContext = 'Internal context unavailable.';
    }

    // ============================================
    // STEP 3: Fetch External Context (Wikipedia)
    // ============================================
    console.log('🌐 Fetching external context from Wikipedia...');
    const wikiData = await fetchWikipediaSummary(topic);
    const externalContext = wikiData.success
      ? `[External Source - Wikipedia]: ${wikiData.summary}\nSource URL: ${wikiData.url}`
      : 'No external Wikipedia context available.';

    // ============================================
    // STEP 4: Build AI Prompt based on Type
    // ============================================
    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'Theory') {
      systemPrompt = `You are an expert Professor specializing in creating comprehensive, structured lecture notes.

Your task is to synthesize information from both internal course materials and external knowledge sources (Wikipedia) to create high-quality educational content.

IMPORTANT CITATION RULES:
- When using information from Internal Sources, cite as [Internal: Source X]
- When using information from External Sources, cite as [External: Wikipedia]
- Combine both sources intelligently to create comprehensive content
- Clearly indicate which facts come from which source
- If sources conflict, present both perspectives

OUTPUT FORMAT (Markdown):
# ${topic}

## Overview
[Brief introduction - cite sources]

## Key Concepts
[Main concepts with citations]

## Detailed Explanation
[In-depth content with proper citations]

## Examples
[Practical examples if applicable]

## Summary
[Key takeaways]

## Sources Used
[List which sources (Internal/External) were most helpful]`;

      userPrompt = `Create comprehensive lecture notes on the topic: "${topic}"

**Internal Context (from our course materials):**
${internalContext}

**External Context (from Wikipedia):**
${externalContext}

Generate well-structured, educational content that synthesizes both sources. Use proper citations throughout.`;

    } else {
      // Lab type
      systemPrompt = `You are an expert Lab Instructor specializing in creating hands-on coding exercises.

Your task is to create practical, executable code exercises with solutions based on the topic.

IMPORTANT REQUIREMENTS:
- Generate WORKING, executable code (Python preferred, but adapt to topic)
- Include detailed comments explaining each step
- Cite which concepts come from [Internal: Source X] or [External: Wikipedia]
- Ensure strict syntax correctness - code must run without errors
- Include both the exercise (with TODOs) and complete solution

OUTPUT FORMAT (Markdown):
# Lab Exercise: ${topic}

## Objective
[What students will learn - cite sources]

## Prerequisites
[Required knowledge]

## Exercise Instructions
[Step-by-step instructions]

## Starter Code
\`\`\`python
# TODO: Students complete this
# Concept from [Internal/External]: ...
\`\`\`

## Complete Solution
\`\`\`python
# Fully working code with citations in comments
\`\`\`

## Expected Output
\`\`\`
[Show what the program should output]
\`\`\`

## Learning Points
[Key concepts learned - cite sources]`;

      userPrompt = `Create a hands-on coding lab exercise for: "${topic}"

**Internal Context (from our course materials):**
${internalContext}

**External Context (from Wikipedia):**
${externalContext}

Generate a complete lab exercise with starter code and solution. Ensure all code is syntactically correct and executable. Use proper citations in comments.`;
    }

    // ============================================
    // STEP 5: Call OpenAI to Generate Content
    // ============================================
    console.log('🤖 Calling OpenAI to generate content...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // or 'gpt-4o' for better quality
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const generatedContent = completion.choices[0].message.content;
    console.log(`✅ Content generated (${generatedContent.length} characters)`);

    // ============================================
    // STEP 6: Save to Database
    // ============================================
    const fullPrompt = `SYSTEM:\n${systemPrompt}\n\nUSER:\n${userPrompt}`;

    const { data: savedRecord, error: saveError } = await supabase
      .from('generated_materials')
      .insert({
        prompt: fullPrompt,
        output_content: generatedContent,
        type: type,
        is_validated: false,
      })
      .select()
      .single();

    if (saveError) {
      console.error('❌ Database save error:', saveError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save generated material',
        details: saveError.message,
        content: generatedContent, // Still return content even if save fails
      });
    }

    console.log(`✅ Material saved with ID: ${savedRecord.id}`);

    // ============================================
    // STEP 7: Return Response
    // ============================================
    return res.status(201).json({
      success: true,
      message: `${type} material generated successfully`,
      data: {
        id: savedRecord.id,
        topic: topic,
        type: type,
        content: generatedContent,
        created_at: savedRecord.created_at,
        sources_used: {
          internal: internalContext !== 'No relevant internal materials found.',
          external: wikiData.success,
          wikipedia_url: wikiData.url,
        },
      },
    });

  } catch (error) {
    console.error('❌ Generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate material',
      details: error.message,
    });
  }
};

/**
 * Get all generated materials
 * GET /api/generate/history
 */
const getGeneratedMaterials = async (req, res) => {
  try {
    const { type, limit = 20 } = req.query;

    let query = supabase
      .from('generated_materials')
      .select('id, type, is_validated, created_at, output_content')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (type && ['Theory', 'Lab'].includes(type)) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      data: data.map(item => ({
        ...item,
        content_preview: item.output_content?.substring(0, 200) + '...',
      })),
    });

  } catch (error) {
    console.error('❌ Error fetching generated materials:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch generated materials',
      details: error.message,
    });
  }
};

/**
 * Get a single generated material by ID
 * GET /api/generate/:id
 */
const getGeneratedMaterialById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('generated_materials')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Generated material not found',
        });
      }
      throw new Error(error.message);
    }

    return res.status(200).json({
      success: true,
      data: data,
    });

  } catch (error) {
    console.error('❌ Error fetching generated material:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch generated material',
      details: error.message,
    });
  }
};

module.exports = {
  generateMaterial,
  getGeneratedMaterials,
  getGeneratedMaterialById,
};
