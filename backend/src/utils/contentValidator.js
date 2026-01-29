/**
 * Content Validation Utility
 * Validates AI-generated content for correctness, relevance, and reliability
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');

const execAsync = promisify(exec);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract code blocks from markdown content
 * @param {string} content - Markdown content
 * @returns {Array} Array  of code blocks with language info
 */
const extractCodeBlocks = (content) => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || 'plaintext',
      code: match[2].trim(),
      startIndex: match.index,
    });
  }

  return blocks;
};

/**
 * Validate Python syntax
 * @param {string} code - Python code
 * @returns {Promise<Object>} Validation result
 */
const validatePythonSyntax = async (code) => {
  try {
    const tempFile = path.join('/tmp', `validate_${Date.now()}.py`);
    await fs.writeFile(tempFile, code);

    // Use python3 -m py_compile for syntax checking
    await execAsync(`python3 -m py_compile ${tempFile}`);

    // Clean up
    await fs.unlink(tempFile).catch(() => { });
    await fs.unlink(`${tempFile}c`).catch(() => { }); // .pyc file

    return {
      valid: true,
      language: 'python',
      message: 'Python syntax is valid',
    };
  } catch (error) {
    return {
      valid: false,
      language: 'python',
      message: 'Python syntax error',
      error: error.stderr || error.message,
    };
  }
};

/**
 * Validate JavaScript syntax
 * @param {string} code - JavaScript code
 * @returns {Promise<Object>} Validation result
 */
const validateJavaScriptSyntax = async (code) => {
  try {
    const tempFile = path.join('/tmp', `validate_${Date.now()}.js`);
    await fs.writeFile(tempFile, code);

    // Use node --check for syntax validation
    await execAsync(`node --check ${tempFile}`);

    // Clean up
    await fs.unlink(tempFile).catch(() => { });

    return {
      valid: true,
      language: 'javascript',
      message: 'JavaScript syntax is valid',
    };
  } catch (error) {
    return {
      valid: false,
      language: 'javascript',
      message: 'JavaScript syntax error',
      error: error.stderr || error.message,
    };
  }
};

/**
 * Validate Java syntax
 * @param {string} code - Java code
 * @returns {Promise<Object>} Validation result
 */
const validateJavaSyntax = async (code) => {
  try {
    // Extract class name from code
    const classMatch = code.match(/class\s+(\w+)/);
    const className = classMatch ? classMatch[1] : 'TempClass';

    const tempFile = path.join('/tmp', `${className}.java`);
    await fs.writeFile(tempFile, code);

    // Use javac for compilation check
    await execAsync(`javac -Xlint:all ${tempFile}`);

    // Clean up
    await fs.unlink(tempFile).catch(() => { });
    await fs.unlink(path.join('/tmp', `${className}.class`)).catch(() => { });

    return {
      valid: true,
      language: 'java',
      message: 'Java syntax is valid',
    };
  } catch (error) {
    return {
      valid: false,
      language: 'java',
      message: 'Java compilation error',
      error: error.stderr || error.message,
    };
  }
};

/**
 * Validate C/C++ syntax
 * @param {string} code - C/C++ code
 * @param {string} language - 'c' or 'cpp'
 * @returns {Promise<Object>} Validation result
 */
const validateCSyntax = async (code, language = 'c') => {
  try {
    const ext = language === 'cpp' ? '.cpp' : '.c';
    const compiler = language === 'cpp' ? 'g++' : 'gcc';
    const tempFile = path.join('/tmp', `validate_${Date.now()}${ext}`);
    const outFile = path.join('/tmp', `validate_${Date.now()}.out`);

    await fs.writeFile(tempFile, code);

    // Compile with syntax check only
    await execAsync(`${compiler} -fsyntax-only -Wall ${tempFile}`);

    // Clean up
    await fs.unlink(tempFile).catch(() => { });

    return {
      valid: true,
      language: language,
      message: `${language.toUpperCase()} syntax is valid`,
    };
  } catch (error) {
    return {
      valid: false,
      language: language,
      message: `${language.toUpperCase()} compilation error`,
      error: error.stderr || error.message,
    };
  }
};

/**
 * Validate syntax for all code blocks in content
 * @param {string} content - Markdown content with code blocks
 * @returns {Promise<Object>} Validation results
 */
const validateCodeSyntax = async (content) => {
  const codeBlocks = extractCodeBlocks(content);

  if (codeBlocks.length === 0) {
    return {
      hasCode: false,
      blocksChecked: 0,
      results: [],
      allValid: true,
      message: 'No code blocks found',
    };
  }

  const results = [];

  for (const block of codeBlocks) {
    const { language, code } = block;
    let validationResult;

    switch (language.toLowerCase()) {
      case 'python':
      case 'py':
        validationResult = await validatePythonSyntax(code);
        break;
      case 'javascript':
      case 'js':
        validationResult = await validateJavaScriptSyntax(code);
        break;
      case 'java':
        validationResult = await validateJavaSyntax(code);
        break;
      case 'c':
        validationResult = await validateCSyntax(code, 'c');
        break;
      case 'cpp':
      case 'c++':
        validationResult = await validateCSyntax(code, 'cpp');
        break;
      default:
        validationResult = {
          valid: null,
          language: language,
          message: `Syntax validation not supported for ${language}`,
          skipped: true,
        };
    }

    results.push(validationResult);
  }

  const validBlocks = results.filter(r => r.valid === true).length;
  const invalidBlocks = results.filter(r => r.valid === false).length;
  const skippedBlocks = results.filter(r => r.skipped).length;

  return {
    hasCode: true,
    blocksChecked: codeBlocks.length,
    validBlocks,
    invalidBlocks,
    skippedBlocks,
    results,
    allValid: invalidBlocks === 0,
    message: invalidBlocks === 0
      ? `All ${validBlocks} code block(s) have valid syntax`
      : `${invalidBlocks} code block(s) have syntax errors`,
  };
};

/**
 * Check content grounding against source materials
 * @param {string} content - Generated content
 * @param {Array} materialSources - Array of material metadata
 * @param {string} internalContext - RAG context used
 * @returns {Promise<Object>} Grounding check result
 */
const checkContentGrounding = async (content, materialSources, internalContext) => {
  try {
    // Extract citations from content
    const citationRegex = /\[Source:\s*([^\]]+)\]/gi;
    const citations = [];
    let match;

    while ((match = citationRegex.exec(content)) !== null) {
      citations.push(match[1].trim());
    }

    // Check if content references uploaded materials
    const hasInternalCitations = citations.some(citation =>
      materialSources.some(material =>
        citation.toLowerCase().includes(material.title.toLowerCase()) ||
        citation.toLowerCase().includes(material.category.toLowerCase())
      )
    );

    // Calculate grounding score
    const totalCitations = citations.length;
    const internalCitationCount = citations.filter(citation =>
      materialSources.some(material =>
        citation.toLowerCase().includes(material.title.toLowerCase()) ||
        citation.toLowerCase().includes(material.category.toLowerCase())
      )
    ).length;

    const groundingScore = totalCitations > 0
      ? (internalCitationCount / totalCitations) * 100
      : (materialSources.length > 0 ? 50 : 100); // Partial score if no citations but materials available

    let groundingLevel = 'Poor';
    if (groundingScore >= 80) groundingLevel = 'Excellent';
    else if (groundingScore >= 60) groundingLevel = 'Good';
    else if (groundingScore >= 40) groundingLevel = 'Fair';

    return {
      grounded: hasInternalCitations || materialSources.length === 0,
      groundingScore: Math.round(groundingScore),
      groundingLevel,
      totalCitations,
      internalCitations: internalCitationCount,
      externalCitations: totalCitations - internalCitationCount,
      materialsUsed: materialSources.length,
      message: hasInternalCitations
        ? `Content is well-grounded in uploaded materials (${groundingScore.toFixed(0)}% internal citations)`
        : materialSources.length > 0
          ? 'Content lacks proper citations to uploaded materials'
          : 'No uploaded materials available for grounding',
      recommendations: groundingScore < 60 ? [
        'Add more citations to uploaded materials',
        'Ensure facts are backed by course content',
        'Review if external sources are necessary'
      ] : [],
    };
  } catch (error) {
    console.error('Grounding check error:', error);
    return {
      grounded: null,
      error: error.message,
      message: 'Grounding check failed',
    };
  }
};

/**
 * AI-assisted quality evaluation with rubric
 * @param {string} content - Generated content
 * @param {string} topic - Topic requested
 * @param {string} type - Material type (Theory/Lab)
 * @param {Object} syntaxResults - Syntax validation results
 * @param {Object} groundingResults - Grounding check results
 * @returns {Promise<Object>} Quality evaluation
 */
const evaluateContentQuality = async (content, topic, type, syntaxResults, groundingResults) => {
  try {
    console.log('🔍 Running AI quality evaluation...');

    const evaluationPrompt = `You are an expert academic content evaluator. Evaluate the following AI-generated educational material using a strict rubric.

**Topic:** ${topic}
**Type:** ${type}
**Content Length:** ${content.length} characters

**Material to Evaluate:**
\`\`\`markdown
${content.substring(0, 3000)}${content.length > 3000 ? '\n... (truncated)' : ''}
\`\`\`

**Syntax Validation Results:**
${JSON.stringify(syntaxResults, null, 2)}

**Content Grounding Results:**
${JSON.stringify(groundingResults, null, 2)}

**EVALUATION RUBRIC** (Score each category 0-10):

1. **Correctness** (0-10)
   - Factual accuracy
   - Technical correctness
   - No misleading information

2. **Relevance** (0-10)
   - Addresses the topic directly
   - Content is on-topic throughout
   - Appropriate depth for ${type}

3. **Completeness** (0-10)
   - Covers key concepts
   - Includes examples
   - Has proper structure

4. **Clarity** (0-10)
   - Well-organized
   - Easy to understand
   - Good explanations

5. **Academic Rigor** (0-10)
   - Proper citations
   - Evidence-based
   - Meets educational standards

6. **Practical Value** (0-10)
   - Useful for learning
   - Actionable content
   - Real-world applicability

**OUTPUT FORMAT (JSON only, no markdown):**
{
  "scores": {
    "correctness": <0-10>,
    "relevance": <0-10>,
    "completeness": <0-10>,
    "clarity": <0-10>,
    "academicRigor": <0-10>,
    "practicalValue": <0-10>
  },
  "overallScore": <average 0-10>,
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"],
  "criticalIssues": ["<issue 1>" or empty array],
  "passesQualityCheck": <true/false>
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert academic evaluator. Return ONLY valid JSON, no markdown formatting.',
        },
        { role: 'user', content: evaluationPrompt },
      ],
      temperature: 0.3, // Lower temperature for consistent evaluation
      max_tokens: 1000,
    });

    let evaluationText = completion.choices[0].message.content.trim();

    // Remove markdown code blocks if present
    evaluationText = evaluationText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    const evaluation = JSON.parse(evaluationText);

    console.log(`✅ Quality evaluation complete - Overall Score: ${evaluation.overallScore}/10 (${evaluation.grade})`);

    return {
      success: true,
      ...evaluation,
      evaluatedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error('❌ Quality evaluation error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Quality evaluation failed',
      overallScore: null,
    };
  }
};

/**
 * Run comprehensive content validation
 * @param {Object} params - Validation parameters
 * @returns {Promise<Object>} Complete validation results
 */
const validateContent = async ({
  content,
  topic,
  type,
  materialSources = [],
  internalContext = '',
}) => {
  try {
    console.log('\n🔎 Starting comprehensive content validation...');

    // 1. Syntax Validation (for Lab materials with code)
    console.log('📝 Step 1: Code syntax validation...');
    const syntaxResults = await validateCodeSyntax(content);

    // 2. Content Grounding Check
    console.log('🎯 Step 2: Content grounding check...');
    const groundingResults = await checkContentGrounding(
      content,
      materialSources,
      internalContext
    );

    // 3. AI Quality Evaluation
    console.log('⭐ Step 3: AI quality evaluation...');
    const qualityResults = await evaluateContentQuality(
      content,
      topic,
      type,
      syntaxResults,
      groundingResults
    );

    // 4. Calculate Overall Validation Score
    const validationScore = calculateOverallScore(
      syntaxResults,
      groundingResults,
      qualityResults
    );

    console.log(`\n✅ Validation complete - Score: ${validationScore.overallScore}%`);

    return {
      success: true,
      validatedAt: new Date().toISOString(),
      topic,
      type,
      syntax: syntaxResults,
      grounding: groundingResults,
      quality: qualityResults,
      overall: validationScore,
    };

  } catch (error) {
    console.error('❌ Validation error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Validation failed',
    };
  }
};

/**
 * Calculate overall validation score
 * @param {Object} syntaxResults - Syntax validation results
 * @param {Object} groundingResults - Grounding check results
 * @param {Object} qualityResults - Quality evaluation results
 * @returns {Object} Overall score and status
 */
const calculateOverallScore = (syntaxResults, groundingResults, qualityResults) => {
  // Weighted scoring
  const weights = {
    syntax: 0.25,      // 25% - Code must be correct
    grounding: 0.25,   // 25% - Must reference uploaded materials
    quality: 0.50,     // 50% - Overall quality is most important
  };

  // Syntax score (0-100)
  let syntaxScore = 100;
  if (syntaxResults.hasCode) {
    syntaxScore = syntaxResults.allValid ? 100 :
      ((syntaxResults.validBlocks / syntaxResults.blocksChecked) * 100);
  }

  // Grounding score (0-100)
  const groundingScore = groundingResults.groundingScore || 50;

  // Quality score (0-100)
  const qualityScore = qualityResults.success
    ? (qualityResults.overallScore / 10) * 100
    : 50;

  // Weighted overall score
  const overallScore = Math.round(
    (syntaxScore * weights.syntax) +
    (groundingScore * weights.grounding) +
    (qualityScore * weights.quality)
  );

  // Determine status
  let status = 'Poor';
  let passesValidation = false;

  if (overallScore >= 85) {
    status = 'Excellent';
    passesValidation = true;
  } else if (overallScore >= 70) {
    status = 'Good';
    passesValidation = true;
  } else if (overallScore >= 55) {
    status = 'Fair';
    passesValidation = false;
  }

  // Critical issues prevent passing
  if (qualityResults.criticalIssues?.length > 0 || !syntaxResults.allValid) {
    passesValidation = false;
  }

  return {
    overallScore,
    status,
    passesValidation,
    breakdown: {
      syntax: Math.round(syntaxScore),
      grounding: Math.round(groundingScore),
      quality: Math.round(qualityScore),
    },
    weights,
  };
};

module.exports = {
  validateContent,
  validateCodeSyntax,
  checkContentGrounding,
  evaluateContentQuality,
  extractCodeBlocks,
};
