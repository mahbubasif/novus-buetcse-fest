/**
 * OpenAI Utility
 * Handles embedding generation using OpenAI API
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model for embeddings - 1536 dimensions
const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Generate embedding vector for given text
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - 1536-dimensional embedding vector
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

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: cleanedText,
    });

    return response.data[0].embedding;
  } catch (error) {
    // Handle rate limiting
    if (error.status === 429) {
      console.warn('⚠️ OpenAI rate limit hit, waiting 1 second...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getEmbedding(text); // Retry once
    }

    console.error('❌ OpenAI Embedding Error:', error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
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

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: cleanedTexts,
    });

    return response.data.map(d => d.embedding);
  } catch (error) {
    if (error.status === 429) {
      console.warn('⚠️ OpenAI rate limit hit, waiting 1 second...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getEmbeddings(texts);
    }

    console.error('❌ OpenAI Batch Embedding Error:', error.message);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
};

module.exports = {
  getEmbedding,
  getEmbeddings,
  EMBEDDING_MODEL,
};
