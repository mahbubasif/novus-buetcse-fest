/**
 * Gemini AI Utility
 * Handles handwritten notes digitization using Google's Gemini Vision API
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use Gemini 2.0 Flash for vision processing (latest available model)
const MODEL_NAME = 'gemini-2.0-flash';

/**
 * Convert image buffer to Gemini-compatible format
 * @param {Buffer} buffer - Image buffer
 * @param {string} mimeType - Image MIME type
 * @returns {Object} - Gemini-compatible image part
 */
const bufferToGenerativePart = (buffer, mimeType) => {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  };
};

/**
 * Digitize handwritten notes from an image
 * @param {Buffer} imageBuffer - The image buffer containing handwritten notes
 * @param {string} mimeType - Image MIME type (image/jpeg, image/png, etc.)
 * @param {Object} options - Additional options
 * @param {string} options.format - Output format: 'markdown', 'latex', 'plain'
 * @param {string} options.subject - Subject context (e.g., 'mathematics', 'physics', 'computer science')
 * @param {boolean} options.preserveStructure - Whether to preserve the original structure/layout
 * @returns {Promise<Object>} - Digitized content with metadata
 */
const digitizeHandwrittenNotes = async (imageBuffer, mimeType, options = {}) => {
  const {
    format = 'markdown',
    subject = 'general',
    preserveStructure = true,
  } = options;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Build the prompt based on format and options
    const systemPrompt = buildDigitizationPrompt(format, subject, preserveStructure);

    const imagePart = bufferToGenerativePart(imageBuffer, mimeType);

    console.log(`🔍 Processing handwritten notes (format: ${format}, subject: ${subject})`);

    const result = await model.generateContent([systemPrompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log(`✅ Successfully digitized notes (${text.length} characters)`);

    return {
      success: true,
      content: text,
      format,
      subject,
      characterCount: text.length,
    };
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    
    // Handle specific error types
    if (error.message?.includes('API key')) {
      throw new Error('Invalid or missing Gemini API key. Please check your GEMINI_API_KEY environment variable.');
    }
    if (error.message?.includes('quota')) {
      throw new Error('Gemini API quota exceeded. Please try again later.');
    }
    if (error.message?.includes('image')) {
      throw new Error('Invalid image format or image processing failed.');
    }
    
    throw new Error(`Failed to digitize notes: ${error.message}`);
  }
};

/**
 * Build the digitization prompt based on options
 * @param {string} format - Output format
 * @param {string} subject - Subject context
 * @param {boolean} preserveStructure - Whether to preserve structure
 * @returns {string} - The constructed prompt
 */
const buildDigitizationPrompt = (format, subject, preserveStructure) => {
  let formatInstructions = '';
  
  switch (format) {
    case 'latex':
      formatInstructions = `
OUTPUT FORMAT: LaTeX
- Use proper LaTeX syntax with appropriate packages
- Wrap mathematical equations in $ for inline and $$ for display mode
- Use \\section{}, \\subsection{} for headings
- Use itemize/enumerate for lists
- Use \\textbf{} for bold and \\textit{} for italics
- For tables, use tabular environment
- Include any necessary packages in comments at the top`;
      break;
    
    case 'plain':
      formatInstructions = `
OUTPUT FORMAT: Plain Text
- Use simple text formatting
- Use dashes (-) or asterisks (*) for bullet points
- Use numbers (1. 2. 3.) for numbered lists
- Clearly separate sections with blank lines
- Write mathematical expressions in a readable text format`;
      break;
    
    default: // markdown
      formatInstructions = `
OUTPUT FORMAT: Markdown
- Use proper Markdown syntax
- Use # for main headings, ## for subheadings, etc.
- Use - or * for bullet points
- Use **bold** and *italics* appropriately
- Use \`code\` for inline code and code blocks with \`\`\`
- Use > for blockquotes
- For mathematical equations, use LaTeX syntax within $ for inline and $$ for block
- Use | for tables with proper header rows`;
  }

  const subjectContext = subject !== 'general' 
    ? `\nSUBJECT CONTEXT: This content is related to ${subject}. Use appropriate terminology and notation standards for this field.`
    : '';

  const structureInstructions = preserveStructure
    ? `\nSTRUCTURE PRESERVATION: Maintain the original layout and organization of the notes as much as possible. Preserve:
- Headings and section divisions
- Bullet points and numbered lists
- Diagrams described as [Diagram: description]
- Tables and their structure
- Any highlighted or emphasized content`
    : '\nREORGANIZATION: Feel free to reorganize the content for better clarity and logical flow.';

  return `You are an expert academic note digitizer. Your task is to convert handwritten notes from the provided image into clean, well-organized digital text.

IMPORTANT INSTRUCTIONS:
1. Accurately transcribe ALL text from the handwritten notes
2. Correct any obvious spelling mistakes while preserving technical terms
3. Interpret mathematical equations, formulas, and symbols correctly
4. Identify and properly format:
   - Headings and titles
   - Bullet points and numbered lists
   - Mathematical equations and formulas
   - Tables and diagrams (describe diagrams if present)
   - Code snippets (if any)
5. Handle unclear handwriting by making reasonable interpretations, noting [unclear] if truly illegible
6. Add proper spacing and paragraph breaks for readability
${formatInstructions}
${subjectContext}
${structureInstructions}

QUALITY STANDARDS:
- Ensure all mathematical notation is syntactically correct
- Maintain academic quality and precision
- Make the output suitable for studying and reference
- If you see diagrams or figures, describe them in [Figure: description] format

Now, please digitize the handwritten notes from the image:`;
};

/**
 * Analyze the type of content in handwritten notes
 * @param {Buffer} imageBuffer - The image buffer
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<Object>} - Analysis results
 */
const analyzeNotesContent = async (imageBuffer, mimeType) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const analysisPrompt = `Analyze this handwritten notes image and provide a JSON response with the following information:
{
  "detectedSubject": "the main subject/topic of the notes",
  "contentTypes": ["list of content types found, e.g., 'text', 'equations', 'diagrams', 'tables', 'code'"],
  "complexity": "simple/moderate/complex",
  "suggestedFormat": "best output format: 'markdown', 'latex', or 'plain'",
  "language": "detected language of the notes",
  "keyTopics": ["list of main topics/concepts covered"],
  "hasEquations": true/false,
  "hasDiagrams": true/false,
  "qualityAssessment": "description of image quality and readability"
}

Respond ONLY with valid JSON, no additional text.`;

    const imagePart = bufferToGenerativePart(imageBuffer, mimeType);
    const result = await model.generateContent([analysisPrompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const analysis = JSON.parse(cleanedText);

    return {
      success: true,
      analysis,
    };
  } catch (error) {
    console.error('❌ Notes analysis error:', error.message);
    return {
      success: false,
      error: error.message,
      analysis: null,
    };
  }
};

module.exports = {
  digitizeHandwrittenNotes,
  analyzeNotesContent,
  MODEL_NAME,
};
