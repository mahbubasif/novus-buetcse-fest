/**
 * AI Material Generation Controller
 * Combines Internal (RAG) + External (Wikipedia) context to generate learning materials
 */

const supabase = require('../lib/supabase');
const { getEmbedding } = require('../utils/openai');
const { fetchWikipediaSummary } = require('../utils/externalContext');
const { validateContent } = require('../utils/contentValidator');
const { generateAudioFromText } = require('../utils/gemini');
const { createVideoSummary, cleanupTempFiles } = require('../utils/videoGenerator');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

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
    // STEP 2: Fetch Internal Context (RAG Search) - PRIORITIZED
    // ============================================
    let internalContext = '';
    let materialSources = [];
    try {
      console.log('📚 Fetching internal context from RAG...');
      const queryEmbedding = await getEmbedding(topic);

      const { data: ragResults, error: ragError } = await supabase
        .rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: 0.3, // Lower threshold to get more related content
          match_count: 10, // Increased to get more context from uploaded materials
        });

      if (ragError) {
        console.warn('⚠️ RAG search failed:', ragError.message);
      } else if (ragResults && ragResults.length > 0) {
        // Get material details for proper citations
        const materialIds = [...new Set(ragResults.map(r => r.material_id))];
        const { data: materials } = await supabase
          .from('materials')
          .select('id, title, category, file_name')
          .in('id', materialIds);

        materialSources = materials || [];

        internalContext = ragResults
          .map((result, idx) => {
            const material = materials?.find(m => m.id === result.material_id);
            const source = material ? `${material.title} (${material.category})` : `Source ${idx + 1}`;
            return `[Internal Material: ${source}]\n${result.chunk_text}\n[Similarity: ${(result.similarity * 100).toFixed(1)}%]`;
          })
          .join('\n\n');
        console.log(`✅ Retrieved ${ragResults.length} chunks from ${materialSources.length} uploaded materials`);
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

Your PRIMARY task is to create educational content based on UPLOADED COURSE MATERIALS. External sources should only supplement gaps.

CRITICAL PRIORITY RULES:
1. **PRIORITIZE INTERNAL MATERIALS**: Base your content primarily on uploaded course materials
2. **Use Wikipedia ONLY to fill gaps**: Only use external sources when internal materials lack information
3. **MANDATORY SOURCE CITATIONS**: Every fact MUST cite its source
   - Internal materials: [Source: Material Name - Category]
   - External sources: [External: Wikipedia - URL]
4. **Images & Diagrams**: When helpful, include:
   - Markdown image syntax: ![Description](url)
   - Mermaid diagrams for concepts/flows
   - Suggest relevant diagrams with placeholders

OUTPUT FORMAT (Markdown with Rich Content):
# ${topic}

## Overview
[Brief introduction with source citations]
[Include relevant image if helpful: ![diagram](url)]

## Key Concepts
[Main concepts - MUST cite uploaded materials]

## Detailed Explanation
[In-depth content from uploaded materials with citations]
[Include mermaid diagrams for complex concepts]

## Visual Aids
[Diagrams, flowcharts using mermaid syntax]

## Examples
[Practical examples from uploaded materials]

## Summary
[Key takeaways with citations]

## References
### Primary Sources (Uploaded Materials)
[List internal materials used]
### Supplementary Sources
[List external sources only if used]`;

      userPrompt = `Create comprehensive lecture notes on "${topic}" based PRIMARILY on our uploaded course materials.

**PRIMARY SOURCES (Uploaded Course Materials - USE THESE FIRST):**
${internalContext}

**SUPPLEMENTARY SOURCE (Use ONLY if needed):**
${externalContext}

**INSTRUCTIONS:**
- Build content primarily from uploaded materials
- Include diagrams/images where helpful (use mermaid for diagrams)
- Cite every fact with its source
- Only use Wikipedia to fill gaps not covered by uploaded materials
- Make it visually engaging with proper markdown formatting`;

    } else {
      // Lab type
      systemPrompt = `You are an expert Lab Instructor specializing in creating hands-on coding exercises.

Your PRIMARY task is to create exercises based on UPLOADED COURSE MATERIALS and examples.

CRITICAL PRIORITY RULES:
1. **PRIORITIZE INTERNAL MATERIALS**: Base exercises on uploaded course content and code examples
2. **Use Wikipedia ONLY to fill gaps**: External sources only when internal materials are insufficient
3. **MANDATORY CITATIONS**: Cite sources in code comments and documentation
4. **WORKING CODE**: All code must be syntactically correct and executable
5. **Visual Aids**: Include flowcharts/diagrams using mermaid syntax

OUTPUT FORMAT (Markdown with Visuals):
# Lab Exercise: ${topic}

## Objective
[What students will learn - cite uploaded materials]

## Prerequisites
[Required knowledge from uploaded materials]

## Conceptual Diagram
[Mermaid flowchart showing the solution approach]

## Exercise Instructions
[Step-by-step based on uploaded materials]

## Starter Code
\`\`\`python
# TODO: Students complete this
# Based on [Source: Material Name]
\`\`\`

## Complete Solution
\`\`\`python
# Working code with citations
# Concept from [Source: Material Name]
\`\`\`

## Expected Output
\`\`\`
[Program output]
\`\`\`

## Explanation Diagram
[Mermaid diagram explaining the solution]

## References
### Primary Sources (Uploaded Materials)
[Materials used]
### Supplementary Sources
[External sources if any]`;

      userPrompt = `Create a hands-on coding lab for "${topic}" based PRIMARILY on uploaded course materials.

**PRIMARY SOURCES (Uploaded Course Materials - USE THESE FIRST):**
${internalContext}

**SUPPLEMENTARY SOURCE (Use ONLY if needed):**
${externalContext}

**INSTRUCTIONS:**
- Base exercise on uploaded materials and examples
- Include flowcharts/diagrams using mermaid
- Ensure code is executable and well-commented
- Cite sources in comments
- Only use Wikipedia to fill gaps`;
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
      max_tokens: 4000, // Increased for richer content with diagrams
    });

    const generatedContent = completion.choices[0].message.content;
    console.log(`✅ Content generated (${generatedContent.length} characters)`);

    // ============================================
    // STEP 6: Validate Generated Content (Part 4)
    // ============================================
    console.log('🔍 Running comprehensive content validation...');
    const validationResults = await validateContent({
      content: generatedContent,
      topic: topic,
      type: type,
      materialSources: materialSources,
      internalContext: internalContext,
    });

    console.log(`✅ Validation complete - Score: ${validationResults.overall?.overallScore || 'N/A'}%`);

    // ============================================
    // STEP 7: Save to Database
    // ============================================
    const fullPrompt = `SYSTEM:\n${systemPrompt}\n\nUSER:\n${userPrompt}`;

    const { data: savedRecord, error: saveError } = await supabase
      .from('generated_materials')
      .insert({
        prompt: fullPrompt,
        output_content: generatedContent,
        type: type,
        is_validated: validationResults.success && validationResults.overall?.passesValidation,
        validation_score: validationResults.overall?.overallScore || null,
        validation_results: validationResults,
      })
      .select();

    if (saveError) {
      console.error('❌ Database save error:', saveError);
      throw new Error('Failed to save generated material');
    }

    console.log(`✅ Material saved with ID: ${savedRecord[0].id}`);

    // ============================================
    // Step 8: Return Response with Validation
    // ============================================
    return res.status(201).json({
      success: true,
      message: `${type} material generated successfully`,
      data: {
        id: savedRecord[0].id,
        topic: topic,
        type: type,
        content: generatedContent,
        created_at: savedRecord[0].created_at,
        is_validated: validationResults.success && validationResults.overall?.passesValidation,
        validation: validationResults,
        sources_used: {
          internal: internalContext !== 'No relevant internal materials found.',
          external: wikiData.success,
          wikipedia_url: wikiData.url,
          materials: materialSources.map(m => ({
            title: m.title,
            category: m.category,
            filename: m.file_name
          })),
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

/**
 * Export generated material as PDF
 * GET /api/generate/:id/pdf
 */
const exportMaterialAsPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the generated material
    const { data: material, error } = await supabase
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

    // Extract topic from content (first heading or use type)
    const topicMatch = material.output_content.match(/^#\s+(.+)$/m);
    const topic = topicMatch ? topicMatch[1] : `${material.type} Material`;

    // Generate PDF
    const { generatePDF } = require('../utils/pdfGenerator');
    const pdfBuffer = await generatePDF(
      material.output_content,
      topic,
      material.type
    );

    // Set response headers for PDF download
    const filename = `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${material.type.toLowerCase()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    console.log(`✅ PDF exported: ${filename}`);
    return res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Error exporting PDF:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export PDF',
      details: error.message,
    });
  }
};

/**
 * Re-validate a generated material
 * POST /api/generate/:id/validate
 */
const revalidateMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍 Re-validating material ID: ${id}`);

    // Fetch the generated material with original context
    const { data: material, error } = await supabase
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

    // Extract topic from content
    const topicMatch = material.output_content.match(/^#\s+(.+)$/m);
    const topic = topicMatch ? topicMatch[1] : `${material.type} Material`;

    // Get material sources from validation_results if available
    const previousValidation = material.validation_results;
    const materialSources = previousValidation?.grounding?.materialsUsed || [];

    // Run validation
    const validationResults = await validateContent({
      content: material.output_content,
      topic: topic,
      type: material.type,
      materialSources: materialSources,
      internalContext: '', // Not available for re-validation
    });

    // Update database with new validation results
    const { error: updateError } = await supabase
      .from('generated_materials')
      .update({
        is_validated: validationResults.success && validationResults.overall?.passesValidation,
        validation_score: validationResults.overall?.overallScore || null,
        validation_results: validationResults,
      })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    console.log(`✅ Material re-validated - Score: ${validationResults.overall?.overallScore}%`);

    return res.status(200).json({
      success: true,
      message: 'Material re-validated successfully',
      validation: validationResults,
    });

  } catch (error) {
    console.error('❌ Re-validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to re-validate material',
      details: error.message,
    });
  }
};

/**
 * Generate video summary for a generated material
 * POST /api/generate/:id/video
 */
const generateVideoSummary = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`\n🎥 Generating video summary for material ID: ${id}`);

    // Fetch the generated material
    const { data: material, error } = await supabase
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

    // Extract topic from content
    const topicMatch = material.output_content.match(/^#\s+(.+)$/m);
    const topic = topicMatch ? topicMatch[1] : `${material.type} Material`;

    // Prepare content for video (create a summary if too long)
    let videoContent = material.output_content;

    // If content is too long, create a summary for the video
    if (videoContent.length > 3000) {
      console.log('📝 Content is long, creating summary for video...');

      const summaryPrompt = `Create a concise audio-friendly summary (2-3 minutes when spoken) of this educational content. 
Focus on key points and make it engaging for audio narration. Remove markdown formatting and code blocks.

Content:
${material.output_content}

Create a natural, conversational summary suitable for audio narration:`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating concise, engaging audio summaries of educational content.',
          },
          { role: 'user', content: summaryPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      videoContent = completion.choices[0].message.content;
      console.log(`✅ Summary created (${videoContent.length} characters)`);
    }

    // Clean up old temporary files before generating new video
    cleanupTempFiles();

    // Generate video
    const videoResult = await createVideoSummary(
      videoContent,
      topic,
      material.type,
      generateAudioFromText
    );

    if (!videoResult.success) {
      throw new Error('Video generation failed');
    }

    // Update database with video path
    const { error: updateError } = await supabase
      .from('generated_materials')
      .update({
        video_path: videoResult.videoPath,
        video_generated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.warn('⚠️ Failed to update database with video path:', updateError.message);
    }

    console.log(`✅ Video summary generated successfully`);

    // Return the video file
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', videoResult.size);
    res.setHeader('Content-Disposition', `inline; filename="video_summary_${id}.mp4"`);
    res.setHeader('Accept-Ranges', 'bytes');

    const videoStream = fs.createReadStream(videoResult.videoPath);
    videoStream.pipe(res);

    // Clean up the video file after sending (with delay to ensure completion)
    videoStream.on('end', () => {
      setTimeout(() => {
        try {
          if (fs.existsSync(videoResult.videoPath)) {
            fs.unlinkSync(videoResult.videoPath);
            if (videoResult.metadata.audioPath && fs.existsSync(videoResult.metadata.audioPath)) {
              fs.unlinkSync(videoResult.metadata.audioPath);
            }
            console.log('🧹 Temporary files cleaned up');
          }
        } catch (err) {
          console.warn('⚠️ Failed to clean up temporary files:', err.message);
        }
      }, 1000);
    });

  } catch (error) {
    console.error('❌ Video generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate video summary',
      details: error.message,
    });
  }
};

module.exports = {
  generateMaterial,
  getGeneratedMaterials,
  getGeneratedMaterialById,
  exportMaterialAsPDF,
  revalidateMaterial,
  generateVideoSummary,
};
