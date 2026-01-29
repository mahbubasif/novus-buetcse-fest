/**
 * OpenAI Utility
 * Handles embedding generation using OpenAI API with Gemini fallback
 */

const OpenAI = require('openai');
const { getEmbeddingGemini } = require('./gemini');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout
});

// Model for embeddings - 1536 dimensions
const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Generate embedding vector for given text with timeout and fallback
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - Embedding vector (1536 for OpenAI, 768 for Gemini)
 */
const getEmbedding = async (text) => {
  try {
    // Clean and truncate text if needed (max ~8000 tokens for this model)
    const cleanedText = text
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000); // Safe limit

    if (!cleanedText) {
      throw new Error('Text is empty after cleaning');
    }

    // Try OpenAI with timeout
    const response = await Promise.race([
      openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: cleanedText,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('OpenAI request timeout')), 30000)
      )
    ]);

    return response.data[0].embedding;
  } catch (error) {
    // Handle rate limiting
    if (error.status === 429) {
      console.warn('⚠️ OpenAI rate limit hit, waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return getEmbedding(text); // Retry once
    }

    // Fallback to Gemini on timeout or error
    console.warn('⚠️ OpenAI failed, falling back to Gemini:', error.message);
    try {
      const geminiEmbedding = await getEmbeddingGemini(text);
      console.log('✅ Successfully generated embedding using Gemini');
      return geminiEmbedding;
    } catch (geminiError) {
      console.error('❌ Both OpenAI and Gemini failed');
      throw new Error(`Failed to generate embedding with both providers: ${geminiError.message}`);
    }
  }
};

/**
 * Generate embeddings for multiple texts (batch processing)
 * @param {string[]} texts - Array of texts
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
const getEmbeddings = async (texts) => {
  try {
    const cleanedTexts = texts.map(text =>
      text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 8000)
    ).filter(t => t.length > 0);

    if (cleanedTexts.length === 0) {
      return [];
    }

    const response = await Promise.race([
      openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: cleanedTexts,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('OpenAI batch request timeout')), 45000)
      )
    ]);

    return response.data.map(d => d.embedding);
  } catch (error) {
    if (error.status === 429) {
      console.warn('⚠️ OpenAI rate limit hit, waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return getEmbeddings(texts);
    }

    console.warn('⚠️ OpenAI batch failed, falling back to individual Gemini calls:', error.message);
    // Fallback to Gemini with individual calls
    const embeddings = [];
    for (const text of cleanedTexts) {
      try {
        const embedding = await getEmbeddingGemini(text);
        embeddings.push(embedding);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.error('❌ Failed to embed text chunk:', e.message);
        throw e;
      }
    }
    return embeddings;
  }
};

module.exports = {
  getEmbedding,
  getEmbeddings,
  EMBEDDING_MODEL,
};
