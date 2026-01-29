/**
 * Chat Controller
 * Part 5: Conversational Chat Interface
 * Provides a chat-based interface for accessing core system features
 */

const supabase = require('../lib/supabase');
const { getEmbedding } = require('../utils/openai');
const { fetchWikipediaSummary } = require('../utils/externalContext');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory conversation storage (for production, use Redis or database)
const conversations = new Map();

// Conversation expiry time (30 minutes)
const CONVERSATION_EXPIRY = 30 * 60 * 1000;

/**
 * Detect user intent from the message
 * @param {string} message - User message
 * @returns {string} - Intent type
 */
const detectIntent = (message) => {
  const lowerMessage = message.toLowerCase();

  // Generate intent - creating new content
  if (
    lowerMessage.includes('generate') ||
    lowerMessage.includes('create') ||
    lowerMessage.includes('write me') ||
    lowerMessage.includes('make a') ||
    lowerMessage.includes('produce') ||
    (lowerMessage.includes('lab') && (lowerMessage.includes('exercise') || lowerMessage.includes('tutorial'))) ||
    (lowerMessage.includes('theory') && lowerMessage.includes('notes'))
  ) {
    if (lowerMessage.includes('lab') || lowerMessage.includes('exercise') || lowerMessage.includes('practical') || lowerMessage.includes('code')) {
      return 'generate_lab';
    }
    if (lowerMessage.includes('theory') || lowerMessage.includes('lecture') || lowerMessage.includes('notes')) {
      return 'generate_theory';
    }
    return 'generate';
  }

  // Search intent
  if (
    lowerMessage.includes('search') ||
    lowerMessage.includes('find') ||
    lowerMessage.includes('look for') ||
    lowerMessage.includes('what materials') ||
    lowerMessage.includes('do we have')
  ) {
    return 'search';
  }

  // Summarize intent
  if (
    lowerMessage.includes('summarize') ||
    lowerMessage.includes('summary') ||
    lowerMessage.includes('brief') ||
    lowerMessage.includes('overview') ||
    lowerMessage.includes('tldr') ||
    lowerMessage.includes('key points')
  ) {
    return 'summarize';
  }

  // Explain intent
  if (
    lowerMessage.includes('explain') ||
    lowerMessage.includes('what is') ||
    lowerMessage.includes('what are') ||
    lowerMessage.includes('how does') ||
    lowerMessage.includes('how do') ||
    lowerMessage.includes('tell me about') ||
    lowerMessage.includes('describe') ||
    lowerMessage.includes('help me understand')
  ) {
    return 'explain';
  }

  // Default to general question (will use RAG for context)
  return 'question';
};

/**
 * Extract topic from user message
 * @param {string} message - User message
 * @param {string} intent - Detected intent
 * @returns {string} - Extracted topic
 */
const extractTopic = (message, intent) => {
  let topic = message;

  // Remove common prefixes based on intent
  const prefixes = [
    'generate', 'create', 'write', 'make', 'produce',
    'search for', 'search', 'find', 'look for',
    'summarize', 'summary of', 'give me a summary of',
    'explain', 'what is', 'what are', 'how does', 'how do',
    'tell me about', 'describe', 'help me understand',
    'can you', 'could you', 'please', 'i want', 'i need',
    'a', 'an', 'the', 'me', 'some'
  ];

  let cleaned = message.toLowerCase();
  prefixes.forEach(prefix => {
    if (cleaned.startsWith(prefix + ' ')) {
      cleaned = cleaned.slice(prefix.length + 1);
    }
  });

  // Remove trailing words like "for me", "please", etc.
  const suffixes = ['for me', 'please', 'thanks', 'thank you'];
  suffixes.forEach(suffix => {
    if (cleaned.endsWith(' ' + suffix)) {
      cleaned = cleaned.slice(0, -(suffix.length + 1));
    }
  });

  // Capitalize first letter and return
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

/**
 * Fetch relevant context from RAG system
 * @param {string} query - Search query
 * @param {number} limit - Max results
 * @returns {Promise<Object>} - Context and sources
 */
const fetchRAGContext = async (query, limit = 5) => {
  try {
    const queryEmbedding = await getEmbedding(query);

    const { data: results, error } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: limit,
      });

    if (error || !results || results.length === 0) {
      return { context: '', sources: [], hasContext: false };
    }

    // Get material details
    const materialIds = [...new Set(results.map(r => r.material_id))];
    const { data: materials } = await supabase
      .from('materials')
      .select('id, title, category')
      .in('id', materialIds);

    const materialMap = {};
    materials?.forEach(m => { materialMap[m.id] = m; });

    const contextChunks = results.map(result => {
      const material = materialMap[result.material_id];
      return {
        text: result.chunk_text,
        source: material ? `${material.title} (${material.category})` : 'Unknown Source',
        similarity: result.similarity,
        materialId: result.material_id,
      };
    });

    const context = contextChunks
      .map(c => `[Source: ${c.source}]\n${c.text}`)
      .join('\n\n---\n\n');

    return {
      context,
      sources: contextChunks.map(c => ({
        title: c.source,
        similarity: Math.round(c.similarity * 100),
        materialId: c.materialId,
      })),
      hasContext: true,
    };
  } catch (error) {
    console.error('RAG context fetch error:', error.message);
    return { context: '', sources: [], hasContext: false };
  }
};

/**
 * Build system prompt based on intent and context
 * @param {string} intent - User intent
 * @param {boolean} hasContext - Whether RAG context is available
 * @returns {string} - System prompt
 */
const buildSystemPrompt = (intent, hasContext) => {
  const basePrompt = `You are an AI teaching assistant for a learning platform. You help students and instructors with course materials.

IMPORTANT RULES:
1. Always be helpful, accurate, and educational
2. When course materials are provided, PRIORITIZE them over general knowledge
3. Always cite sources when using provided materials: [Source: Material Name]
4. If you don't have relevant materials, be honest about it
5. Keep responses concise but comprehensive
6. Use markdown formatting for better readability`;

  const intentPrompts = {
    generate_theory: `${basePrompt}

You are creating THEORY/LECTURE content. Include:
- Clear explanations with citations from provided materials
- Key concepts and definitions
- Examples where appropriate
- Well-structured markdown with headers`,

    generate_lab: `${basePrompt}

You are creating LAB/PRACTICAL content. Include:
- Clear objectives
- Step-by-step instructions
- Code examples with comments
- Expected outputs
- Cite sources in comments`,

    generate: `${basePrompt}

You are generating educational content. Determine whether theory or practical content is more appropriate based on the topic and create comprehensive material with proper citations.`,

    search: `${basePrompt}

You are helping the user find relevant course materials. Summarize what you found and explain how it relates to their query.`,

    summarize: `${basePrompt}

You are summarizing content from course materials. Provide:
- A concise summary
- Key takeaways
- Important points
- Citations for each point`,

    explain: `${basePrompt}

You are explaining a concept. Provide:
- Clear, step-by-step explanation
- Examples from course materials when available
- Analogies to aid understanding
- Citations for information from materials`,

    question: `${basePrompt}

You are answering a question. Use the provided course materials to give an accurate, well-cited response. If the materials don't contain relevant information, provide general knowledge but note that it's not from course materials.`,
  };

  let prompt = intentPrompts[intent] || intentPrompts.question;

  if (!hasContext) {
    prompt += `\n\nNote: No relevant course materials were found for this query. Provide helpful information from your general knowledge, but clearly indicate that this is not from the course materials.`;
  }

  return prompt;
};

/**
 * Process chat message and generate response
 * POST /api/chat
 */
const chat = async (req, res) => {
  const { message, conversationId } = req.body;

  try {
    // Validate input
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    console.log(`\n💬 Chat message: "${message.substring(0, 50)}..."`);

    // Get or create conversation
    let conversation = conversationId ? conversations.get(conversationId) : null;
    const newConversationId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!conversation) {
      conversation = {
        id: newConversationId,
        messages: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      conversations.set(newConversationId, conversation);
    }

    // Update last activity
    conversation.lastActivity = Date.now();

    // Detect intent
    const intent = detectIntent(message);
    const topic = extractTopic(message, intent);
    console.log(`🎯 Intent: ${intent}, Topic: "${topic}"`);

    // Fetch RAG context
    console.log('📚 Fetching relevant course materials...');
    const ragData = await fetchRAGContext(message, 5);

    // Build messages for OpenAI
    const systemPrompt = buildSystemPrompt(intent, ragData.hasContext);

    // Include conversation history (last 10 messages for context)
    const historyMessages = conversation.messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Build current user message with context
    let userContent = message;
    if (ragData.hasContext) {
      userContent = `User Question: ${message}

Relevant Course Materials:
${ragData.context}

Please answer based primarily on the above course materials. Cite sources using [Source: Material Name].`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: userContent },
    ];

    // Call OpenAI
    console.log('🤖 Generating response...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const assistantResponse = completion.choices[0].message.content;
    console.log(`✅ Response generated (${assistantResponse.length} chars)`);

    // Store messages in conversation
    conversation.messages.push(
      { role: 'user', content: message, timestamp: Date.now() },
      { role: 'assistant', content: assistantResponse, timestamp: Date.now() }
    );

    // Clean up old conversations
    cleanupConversations();

    // Build response
    const response = {
      success: true,
      conversationId: newConversationId,
      message: assistantResponse,
      intent: intent,
      sources: ragData.sources,
      hasContext: ragData.hasContext,
    };

    // Add generation info if applicable
    if (intent.startsWith('generate')) {
      response.generationType = intent === 'generate_lab' ? 'Lab' : 'Theory';
      response.topic = topic;
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Chat error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      details: error.message,
    });
  }
};

/**
 * Get conversation history
 * GET /api/chat/history/:conversationId
 */
const getHistory = async (req, res) => {
  const { conversationId } = req.params;

  try {
    const conversation = conversations.get(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    return res.status(200).json({
      success: true,
      conversationId: conversationId,
      messageCount: conversation.messages.length,
      messages: conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      })),
      createdAt: conversation.createdAt,
      lastActivity: conversation.lastActivity,
    });

  } catch (error) {
    console.error('❌ Get history error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get conversation history',
      details: error.message,
    });
  }
};

/**
 * Clear conversation history
 * DELETE /api/chat/history/:conversationId
 */
const clearHistory = async (req, res) => {
  const { conversationId } = req.params;

  try {
    if (conversations.has(conversationId)) {
      conversations.delete(conversationId);
      return res.status(200).json({
        success: true,
        message: 'Conversation cleared',
      });
    }

    return res.status(404).json({
      success: false,
      error: 'Conversation not found',
    });

  } catch (error) {
    console.error('❌ Clear history error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear conversation',
      details: error.message,
    });
  }
};

/**
 * Start a new conversation
 * POST /api/chat/new
 */
const newConversation = async (req, res) => {
  try {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    conversations.set(conversationId, {
      id: conversationId,
      messages: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });

    return res.status(201).json({
      success: true,
      conversationId: conversationId,
      message: 'New conversation started',
    });

  } catch (error) {
    console.error('❌ New conversation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create new conversation',
      details: error.message,
    });
  }
};

/**
 * Quick search - returns search results without full chat response
 * POST /api/chat/search
 */
const quickSearch = async (req, res) => {
  const { query, limit = 5 } = req.body;

  try {
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    console.log(`🔍 Quick search: "${query}"`);

    const ragData = await fetchRAGContext(query, limit);

    if (!ragData.hasContext) {
      return res.status(200).json({
        success: true,
        query: query,
        count: 0,
        results: [],
        message: 'No matching materials found',
      });
    }

    return res.status(200).json({
      success: true,
      query: query,
      count: ragData.sources.length,
      results: ragData.sources,
    });

  } catch (error) {
    console.error('❌ Quick search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Search failed',
      details: error.message,
    });
  }
};

/**
 * Generate material through chat (saves to database)
 * POST /api/chat/generate
 */
const generateFromChat = async (req, res) => {
  const { topic, type, conversationId } = req.body;

  try {
    // Validate input
    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required',
      });
    }

    const materialType = type || 'Theory';
    if (!['Theory', 'Lab'].includes(materialType)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be either "Theory" or "Lab"',
      });
    }

    console.log(`\n🎨 Chat-based generation: ${materialType} for "${topic}"`);

    // Fetch RAG context
    const ragData = await fetchRAGContext(topic, 10);

    // Build prompts similar to generation controller
    let systemPrompt = '';
    let userPrompt = '';

    if (materialType === 'Theory') {
      systemPrompt = `You are an expert Professor creating comprehensive lecture notes.

RULES:
1. Base content PRIMARILY on provided course materials
2. Cite every fact: [Source: Material Name]
3. Use markdown with headers, lists, and code blocks
4. Include examples and explanations
5. Be comprehensive but clear`;

      userPrompt = `Create lecture notes on "${topic}".

${ragData.hasContext ? `Course Materials:\n${ragData.context}` : 'No course materials available - use general knowledge but note this clearly.'}

Include: Overview, Key Concepts, Detailed Explanation, Examples, Summary, and References.`;

    } else {
      systemPrompt = `You are an expert Lab Instructor creating hands-on exercises.

RULES:
1. Base exercises on provided course materials
2. Include working, executable code
3. Cite sources in code comments
4. Provide clear step-by-step instructions
5. Include expected outputs`;

      userPrompt = `Create a lab exercise on "${topic}".

${ragData.hasContext ? `Course Materials:\n${ragData.context}` : 'No course materials available - use general knowledge but note this clearly.'}

Include: Objective, Prerequisites, Instructions, Starter Code, Solution, Expected Output, and References.`;
    }

    // Generate content
    console.log('🤖 Generating content...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const generatedContent = completion.choices[0].message.content;
    console.log(`✅ Content generated (${generatedContent.length} chars)`);

    // Save to database
    const fullPrompt = `SYSTEM:\n${systemPrompt}\n\nUSER:\n${userPrompt}`;

    const { data: savedRecord, error: saveError } = await supabase
      .from('generated_materials')
      .insert({
        prompt: fullPrompt,
        output_content: generatedContent,
        type: materialType,
        is_validated: false,
      })
      .select();

    if (saveError) {
      console.error('❌ Database save error:', saveError);
      throw new Error('Failed to save generated material');
    }

    console.log(`✅ Material saved with ID: ${savedRecord[0].id}`);

    // Update conversation if provided
    if (conversationId && conversations.has(conversationId)) {
      const conversation = conversations.get(conversationId);
      conversation.messages.push(
        { role: 'user', content: `Generate ${materialType} material on: ${topic}`, timestamp: Date.now() },
        { role: 'assistant', content: generatedContent, timestamp: Date.now() }
      );
      conversation.lastActivity = Date.now();
    }

    return res.status(201).json({
      success: true,
      message: `${materialType} material generated successfully`,
      data: {
        id: savedRecord[0].id,
        topic: topic,
        type: materialType,
        content: generatedContent,
        created_at: savedRecord[0].created_at,
        sources: ragData.sources,
      },
    });

  } catch (error) {
    console.error('❌ Generate from chat error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate material',
      details: error.message,
    });
  }
};

/**
 * Summarize a specific material
 * POST /api/chat/summarize
 */
const summarizeMaterial = async (req, res) => {
  const { materialId, query } = req.body;

  try {
    let content = '';
    let sourceInfo = null;

    if (materialId) {
      // Fetch specific material
      const { data: material, error } = await supabase
        .from('materials')
        .select('id, title, category, content_text')
        .eq('id', materialId)
        .single();

      if (error || !material) {
        return res.status(404).json({
          success: false,
          error: 'Material not found',
        });
      }

      content = material.content_text;
      sourceInfo = { id: material.id, title: material.title, category: material.category };

    } else if (query) {
      // Use RAG to find relevant content
      const ragData = await fetchRAGContext(query, 5);
      if (!ragData.hasContext) {
        return res.status(404).json({
          success: false,
          error: 'No relevant materials found for summarization',
        });
      }
      content = ragData.context;
      sourceInfo = ragData.sources;

    } else {
      return res.status(400).json({
        success: false,
        error: 'Either materialId or query is required',
      });
    }

    // Generate summary
    console.log('📝 Generating summary...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating concise, informative summaries of educational content.
Create a well-structured summary with:
- A brief overview (2-3 sentences)
- Key points (bullet points)
- Important takeaways
Use markdown formatting.`,
        },
        {
          role: 'user',
          content: `Summarize the following content:\n\n${content.slice(0, 8000)}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const summary = completion.choices[0].message.content;

    return res.status(200).json({
      success: true,
      summary: summary,
      source: sourceInfo,
    });

  } catch (error) {
    console.error('❌ Summarize error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate summary',
      details: error.message,
    });
  }
};

/**
 * Cleanup expired conversations
 */
const cleanupConversations = () => {
  const now = Date.now();
  for (const [id, conv] of conversations.entries()) {
    if (now - conv.lastActivity > CONVERSATION_EXPIRY) {
      conversations.delete(id);
      console.log(`🗑️ Cleaned up expired conversation: ${id}`);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupConversations, 5 * 60 * 1000);

/**
 * Download chat content as PDF
 * POST /api/chat/download-pdf
 */
const downloadAsPDF = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    console.log('📄 Generating PDF for chat content...');

    // Generate PDF
    const { generatePDF } = require('../utils/pdfGenerator');
    const pdfBuffer = await generatePDF(
      'Chat Response',
      content,
      'Chat'
    );

    // Set response headers for PDF download
    const filename = `chat_response_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    console.log(`✅ PDF exported: ${filename}`);
    return res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate PDF',
      details: error.message,
    });
  }
};

module.exports = {
  chat,
  getHistory,
  clearHistory,
  newConversation,
  quickSearch,
  generateFromChat,
  summarizeMaterial,
  downloadAsPDF,
};
