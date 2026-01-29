/**
 * Handwritten Notes OCR and Digitization
 * Uses Gemini Vision API to convert handwritten notes to structured text
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Models for vision processing - using available 2.5 flash model
const VISION_MODEL = 'gemini-2.5-flash';

/**
 * Check if a file is an image (handwritten note)
 * @param {string} mimetype - File MIME type
 * @param {string} originalname - Original filename
 * @returns {boolean} - True if file is an image
 */
const isImageFile = (mimetype, originalname) => {
  const imageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ];

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
  const extension = originalname.substring(originalname.lastIndexOf('.')).toLowerCase();

  return imageTypes.includes(mimetype) || imageExtensions.includes(extension);
};

/**
 * Check if a file could be scanned/handwritten based on MIME type
 * @param {string} mimetype - File MIME type
 * @returns {boolean} - True if file could be scanned
 */
const isScannableFile = (mimetype) => {
  return mimetype === 'application/pdf' || isImageFile(mimetype, '');
};

/**
 * Convert handwritten notes to structured academic text using Gemini Vision
 * @param {Buffer} imageBuffer - Image buffer containing handwritten notes
 * @param {string} mimetype - Image MIME type
 * @param {string} category - Material category (Theory or Lab)
 * @returns {Promise<object>} - OCR result with formatted text
 */
const digitizeHandwrittenNotes = async (imageBuffer, mimetype, category) => {
  try {
    console.log('📸 Processing handwritten notes with Gemini Vision...');

    const model = genAI.getGenerativeModel({ model: VISION_MODEL });

    // Prepare the prompt based on category
    const systemPrompt = category === 'Theory'
      ? `You are an expert academic transcription assistant. Your task is to convert handwritten lecture notes into well-structured, organized text.

CRITICAL INSTRUCTIONS:
1. **Accurate Transcription**: Transcribe ALL handwritten text exactly as written, preserving technical terms, formulas, and diagrams
2. **Structured Format**: Organize the content with proper headings, subheadings, and hierarchical structure
3. **LaTeX Integration**: 
   - Use LaTeX for all mathematical formulas: $inline$ for inline math, $$display$$ for equations
   - Use \\textbf{} for bold text, \\textit{} for italics
   - Format code blocks with proper markdown code fences
4. **Academic Quality**: 
   - Correct obvious spelling errors while preserving technical terminology
   - Add proper punctuation where missing
   - Organize bullet points and numbered lists properly
5. **Diagrams & Visuals**: 
   - Describe any diagrams, charts, or visual elements in detail
   - Use mermaid diagram syntax when applicable
   - Add [DIAGRAM: description] placeholders for complex visuals

OUTPUT FORMAT (Markdown with LaTeX):
# [Main Topic from Notes]

## [Section 1 Heading]

[Organized content with proper paragraphs]

### Key Concepts
- Concept 1: explanation
- Concept 2: explanation

### Mathematical Formulas
$$
[LaTeX formula if present]
$$

### Code Examples
\`\`\`language
[code if present]
\`\`\`

## [Section 2 Heading]

[Continue organizing content...]

## Diagrams and Visual Elements
[Descriptions of any diagrams, flowcharts, or visuals]

IMPORTANT: Maintain academic rigor and clarity. This is for educational use.`
      : `You are an expert academic transcription assistant. Your task is to convert handwritten lab notes, code snippets, and exercises into well-structured, executable documentation.

CRITICAL INSTRUCTIONS:
1. **Accurate Transcription**: Transcribe ALL handwritten text, code, and algorithms exactly
2. **Code Quality**: 
   - Preserve indentation and syntax
   - Add proper syntax highlighting with language specification
   - Correct obvious typos in code
3. **LaTeX Integration**: 
   - Use LaTeX for algorithms: \\textbf{} for keywords, $$math$$ for formulas
   - Format pseudocode properly
4. **Lab Structure**:
   - Objective/Purpose section
   - Requirements/Prerequisites
   - Step-by-step procedure
   - Code implementation
   - Expected output
   - Observations/Results
5. **Diagrams**: Describe flowcharts and visual elements

OUTPUT FORMAT (Markdown with LaTeX and Code):
# Lab Exercise: [Topic from Notes]

## Objective
[Purpose of the lab]

## Prerequisites
- Prerequisite 1
- Prerequisite 2

## Procedure

### Step 1: [Title]
[Instructions]

\`\`\`python
# Code from handwritten notes
[transcribed code]
\`\`\`

### Step 2: [Title]
[Instructions and code]

## Complete Implementation

\`\`\`language
[Full working code]
\`\`\`

## Expected Output
\`\`\`
[Output description]
\`\`\`

## Flowcharts and Diagrams
[Descriptions or mermaid diagrams]

IMPORTANT: Ensure all code is syntactically correct and executable.`;

    // Prepare the image data
    const imageData = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimetype,
      },
    };

    // Call Gemini Vision API
    const result = await model.generateContent([
      systemPrompt,
      '\n\nTranscribe and digitize the following handwritten notes into structured academic text:',
      imageData,
    ]);

    const response = await result.response;
    const digitalizedText = response.text();

    if (!digitalizedText || digitalizedText.trim().length === 0) {
      throw new Error('No text could be extracted from the image');
    }

    console.log(`✅ Handwritten notes digitized (${digitalizedText.length} characters)`);

    return {
      success: true,
      text: digitalizedText,
      format: 'markdown-latex',
      sourceType: 'handwritten',
      length: digitalizedText.length,
      metadata: {
        processedBy: 'gemini-vision',
        model: VISION_MODEL,
        category: category,
        timestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    console.error('❌ Handwritten OCR Error:', error.message);
    throw new Error(`Failed to digitize handwritten notes: ${error.message}`);
  }
};

/**
 * Process handwritten notes with quality assessment
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} mimetype - Image MIME type
 * @param {string} category - Material category
 * @returns {Promise<object>} - Processed result with quality metrics
 */
const processHandwrittenNotes = async (imageBuffer, mimetype, category) => {
  try {
    // Digitize the notes
    const result = await digitizeHandwrittenNotes(imageBuffer, mimetype, category);

    // Basic quality assessment
    const hasFormulas = result.text.includes('$$') || result.text.includes('$');
    const hasCode = result.text.includes('```');
    const hasSections = result.text.includes('##');
    const wordCount = result.text.split(/\s+/).length;

    const qualityMetrics = {
      hasFormulas,
      hasCode,
      hasStructure: hasSections,
      wordCount,
      confidence: wordCount > 50 ? 'high' : wordCount > 20 ? 'medium' : 'low',
    };

    return {
      ...result,
      quality: qualityMetrics,
    };

  } catch (error) {
    console.error('❌ Processing Error:', error.message);
    throw error;
  }
};

module.exports = {
  isImageFile,
  isScannableFile,
  digitizeHandwrittenNotes,
  processHandwrittenNotes,
};
