/**
 * Gemini AI Utility
 * Handles embedding generation using Google's Gemini API
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model for embeddings
const EMBEDDING_MODEL = 'text-embedding-004';

/**
 * Generate embedding vector for given text using Gemini
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - 768-dimensional embedding vector
 */
const getEmbeddingGemini = async (text) => {
  try {
    // Clean and truncate text if needed
    const cleanedText = text
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000); // Gemini can handle more

    if (!cleanedText) {
      throw new Error('Text is empty after cleaning');
    }

    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

    const result = await model.embedContent(cleanedText);
    const embedding = result.embedding;

    return embedding.values;
  } catch (error) {
    console.error('❌ Gemini Embedding Error:', error.message);
    throw new Error(`Failed to generate Gemini embedding: ${error.message}`);
  }
};

/**
 * Generate embeddings for multiple texts (batch processing)
 * @param {string[]} texts - Array of texts
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
const getEmbeddingsGemini = async (texts) => {
  try {
    const cleanedTexts = texts.map(text =>
      text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 10000)
    ).filter(t => t.length > 0);

    if (cleanedTexts.length === 0) {
      return [];
    }

    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

    const embeddings = [];
    for (const text of cleanedTexts) {
      const result = await model.embedContent(text);
      embeddings.push(result.embedding.values);
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return embeddings;
  } catch (error) {
    console.error('❌ Gemini Batch Embedding Error:', error.message);
    throw new Error(`Failed to generate Gemini embeddings: ${error.message}`);
  }
};

module.exports = {
  getEmbeddingGemini,
  getEmbeddingsGemini,
  EMBEDDING_MODEL,
};
