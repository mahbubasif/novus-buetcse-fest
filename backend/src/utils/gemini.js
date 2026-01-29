/**
 * Gemini AI Utility
 * Handles embedding generation and text-to-speech using Google's Gemini API
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model for embeddings
const EMBEDDING_MODEL = 'text-embedding-004';

// Model for text-to-speech
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// Model for video generation (Veo)
// NOTE: Veo models (veo-2.0-generate, veo-3.1-generate) require Vertex AI's
// specialized video generation endpoint (Predict method), NOT generateContent.
// The standard @google/generative-ai SDK does not support Veo video generation.
const VIDEO_MODEL = 'veo-2.0-generate-001';

/**
 * Generate video from text using Gemini (Veo)
 * 
 * IMPORTANT: Veo video generation is NOT supported via the standard generateContent API.
 * It requires Google Cloud Vertex AI with the specialized video generation endpoint.
 * This function will throw to trigger FFmpeg fallback.
 * 
 * For production Veo integration, use:
 * - Vertex AI Video Generation API (aiplatform.googleapis.com)
 * - Model: publishers/google/models/veo-2.0-generate-001
 * - Method: predict (not generateContent)
 * 
 * @param {string} prompt - Prompt for video generation
 * @param {string} outputPath - Path to save the video
 * @returns {Promise<string>} - Path to the generated video
 */
const generateVideoGemini = async (prompt, outputPath) => {
  // Veo video generation requires Vertex AI's specialized endpoint
  // The @google/generative-ai SDK's generateContent does NOT support Veo models
  // Throwing to trigger FFmpeg fallback in videoGenerator.js
  console.log('🎥 Veo video generation requires Vertex AI (not supported via generateContent)');
  console.log('📋 To enable Veo: Use Vertex AI SDK with aiplatform.googleapis.com/v1beta endpoint');
  throw new Error('Veo requires Vertex AI - falling back to FFmpeg');
};

/**
 * Generate text content using Gemini
 * @param {string} prompt - Prompt for generation
 * @returns {Promise<string>} - Generated text
 */
const generateTextGemini = async (prompt) => {
  try {
    // Use gemini-2.0-flash (gemini-pro is deprecated)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Gemini Generation Error:', error.message);
    throw error;
  }
};

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

/**
 * Generate audio from text using Gemini TTS
 * @param {string} text - Text to convert to speech
 * @param {string} outputPath - Path to save the audio file
 * @returns {Promise<string>} - Path to the generated audio file
 */
const generateAudioFromText = async (text, outputPath) => {
  try {
    console.log('🎙️ Generating audio using Gemini TTS...');

    // Clean and prepare text for TTS
    const cleanedText = text
      .replace(/[#*`]/g, '') // Remove markdown formatting
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .slice(0, 5000); // Limit text length for reasonable audio duration

    if (!cleanedText) {
      throw new Error('Text is empty after cleaning');
    }

    const model = genAI.getGenerativeModel({ model: TTS_MODEL });

    const result = await model.generateContent({
      contents: [
        {
          parts: [
            {
              text: cleanedText,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Aoede', // Professional, clear voice
            },
          },
        },
      },
    });

    // Get the audio data from the response
    const audioData = result.response.candidates[0].content.parts[0].inlineData;

    if (!audioData || !audioData.data) {
      throw new Error('No audio data received from Gemini TTS');
    }

    // Convert base64 audio to buffer and save
    const audioBuffer = Buffer.from(audioData.data, 'base64');

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, audioBuffer);

    console.log(`✅ Audio generated: ${outputPath} (${(audioBuffer.length / 1024).toFixed(2)} KB)`);
    return outputPath;

  } catch (error) {
    console.error('❌ Gemini TTS Error:', error.message);
    throw new Error(`Failed to generate audio: ${error.message}`);
  }
};


module.exports = {
  getEmbeddingGemini,
  getEmbeddingsGemini,
  generateAudioFromText,
  generateTextGemini,
  generateVideoGemini,
  EMBEDDING_MODEL,
  TTS_MODEL,
};
