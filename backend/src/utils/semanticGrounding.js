/**
 * Semantic Grounding Utility
 * Extracts claims from generated content and matches them against source materials
 * Provides transparency by showing what was generated vs. what facts support it
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract factual claims from generated content
 * @param {string} content - Generated markdown content
 * @param {string} topic - Topic of the content
 * @returns {Promise<Array>} Array of extracted claims
 */
const extractClaims = async (content) => {
  try {
    console.log('📝 Extracting factual claims from generated content...');

    const extractionPrompt = `Analyze the following educational content and extract all factual claims, definitions, and technical statements that can be verified.

**Content to Analyze:**
${content.substring(0, 4000)}${content.length > 4000 ? '\n... (truncated)' : ''}

**Instructions:**
1. Extract ONLY verifiable factual claims (not opinions or general statements)
2. Focus on: definitions, technical facts, code explanations, algorithm descriptions
3. Keep each claim concise (1-2 sentences max)
4. Include the approximate location (beginning/middle/end of content)

**OUTPUT FORMAT (JSON only, no markdown):**
{
  "claims": [
    {
      "id": 1,
      "claim": "<the factual claim>",
      "type": "<definition|technical_fact|algorithm|code_explanation|example>",
      "importance": "<high|medium|low>",
      "location": "<beginning|middle|end>"
    }
  ],
  "totalClaims": <number>
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a fact extraction expert. Return ONLY valid JSON, no markdown formatting.',
        },
        { role: 'user', content: extractionPrompt },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    let responseText = completion.choices[0].message.content.trim();
    responseText = responseText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    const result = JSON.parse(responseText);
    console.log(`✅ Extracted ${result.claims.length} claims from content`);

    return result.claims;
  } catch (error) {
    console.error('❌ Claim extraction error:', error);
    return [];
  }
};

/**
 * Find matching facts from source materials for a given claim
 * @param {string} claim - The claim to verify
 * @param {Array} materialSources - Array of source materials with content
 * @param {string} ragContext - RAG context used during generation
 * @returns {Promise<Object>} Matching facts and confidence
 */
const findMatchingFacts = async (claim, materialSources, ragContext) => {
  try {
    // Combine all source material into searchable context
    const sourceContext = ragContext || materialSources.map(m => 
      `[${m.title}]: ${m.content || m.summary || ''}`
    ).join('\n\n');

    if (!sourceContext || sourceContext.trim().length < 50) {
      return {
        found: false,
        matchedFact: null,
        source: null,
        confidence: 0,
        verificationStatus: 'no_sources',
        explanation: 'No source materials available for verification',
      };
    }

    const verificationPrompt = `You are a fact-checking expert. Verify if the following claim is supported by the source materials.

**CLAIM TO VERIFY:**
"${claim}"

**SOURCE MATERIALS:**
${sourceContext.substring(0, 3000)}${sourceContext.length > 3000 ? '\n... (truncated)' : ''}

**Instructions:**
1. Search for facts in the source materials that support, contradict, or relate to the claim
2. If found, quote the relevant fact EXACTLY as it appears in the source
3. Assess confidence level based on how well the source supports the claim

**OUTPUT FORMAT (JSON only):**
{
  "found": <true|false>,
  "matchedFact": "<exact quote from source or null>",
  "source": "<source title/name or null>",
  "confidence": <0-100>,
  "verificationStatus": "<verified|partially_verified|not_found|contradicted>",
  "explanation": "<brief explanation of the match or mismatch>",
  "discrepancy": "<any difference between claim and fact, or null>"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a meticulous fact-checker. Return ONLY valid JSON, no markdown.',
        },
        { role: 'user', content: verificationPrompt },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    let responseText = completion.choices[0].message.content.trim();
    responseText = responseText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    return JSON.parse(responseText);
  } catch (error) {
    console.error('❌ Fact matching error:', error);
    return {
      found: false,
      matchedFact: null,
      source: null,
      confidence: 0,
      verificationStatus: 'error',
      explanation: `Verification failed: ${error.message}`,
    };
  }
};

/**
 * Perform comprehensive semantic grounding analysis
 * Shows side-by-side comparison of generated claims vs. source facts
 * @param {Object} params - Analysis parameters
 * @returns {Promise<Object>} Complete grounding analysis with comparisons
 */
const analyzeSemanticGrounding = async ({
  content,
  topic,
  materialSources = [],
  ragContext = '',
}) => {
  try {
    console.log('\n🔍 Starting semantic grounding analysis...');
    console.log(`   Topic: ${topic}`);
    console.log(`   Sources available: ${materialSources.length}`);

    // Step 1: Extract claims from generated content
    const claims = await extractClaims(content);

    if (claims.length === 0) {
      return {
        success: true,
        totalClaims: 0,
        comparisons: [],
        summary: {
          verified: 0,
          partiallyVerified: 0,
          notFound: 0,
          contradicted: 0,
          overallGroundingScore: 100,
          message: 'No verifiable claims found in content',
        },
      };
    }

    // Step 2: Verify each claim against source materials
    console.log(`🔎 Verifying ${claims.length} claims against source materials...`);

    const comparisons = [];
    let verified = 0;
    let partiallyVerified = 0;
    let notFound = 0;
    let contradicted = 0;

    // Process claims (limit to top 10 for performance)
    const claimsToProcess = claims
      .filter(c => c.importance === 'high' || c.importance === 'medium')
      .slice(0, 10);

    for (const claim of claimsToProcess) {
      const matchResult = await findMatchingFacts(
        claim.claim,
        materialSources,
        ragContext
      );

      comparisons.push({
        id: claim.id,
        generatedClaim: claim.claim,
        claimType: claim.type,
        importance: claim.importance,
        location: claim.location,
        verification: {
          status: matchResult.verificationStatus,
          confidence: matchResult.confidence,
          matchedFact: matchResult.matchedFact,
          source: matchResult.source,
          explanation: matchResult.explanation,
          discrepancy: matchResult.discrepancy,
        },
      });

      // Update counters
      switch (matchResult.verificationStatus) {
        case 'verified':
          verified++;
          break;
        case 'partially_verified':
          partiallyVerified++;
          break;
        case 'not_found':
        case 'no_sources':
          notFound++;
          break;
        case 'contradicted':
          contradicted++;
          break;
      }
    }

    // Calculate overall grounding score
    const totalProcessed = comparisons.length;
    const groundingScore = totalProcessed > 0
      ? Math.round(
          ((verified * 100 + partiallyVerified * 60 + notFound * 30) / 
          (totalProcessed * 100)) * 100
        )
      : (materialSources.length === 0 ? 50 : 0);

    // Determine grounding level
    let groundingLevel = 'Poor';
    if (groundingScore >= 80) groundingLevel = 'Excellent';
    else if (groundingScore >= 60) groundingLevel = 'Good';
    else if (groundingScore >= 40) groundingLevel = 'Fair';

    const result = {
      success: true,
      totalClaims: claims.length,
      claimsAnalyzed: totalProcessed,
      comparisons,
      summary: {
        verified,
        partiallyVerified,
        notFound,
        contradicted,
        overallGroundingScore: groundingScore,
        groundingLevel,
        message: generateSummaryMessage(verified, partiallyVerified, notFound, contradicted, totalProcessed),
      },
      recommendations: generateRecommendations(comparisons),
      analyzedAt: new Date().toISOString(),
    };

    console.log(`✅ Semantic grounding complete - Score: ${groundingScore}% (${groundingLevel})`);
    return result;

  } catch (error) {
    console.error('❌ Semantic grounding analysis error:', error);
    return {
      success: false,
      error: error.message,
      comparisons: [],
      summary: {
        overallGroundingScore: 0,
        message: 'Semantic grounding analysis failed',
      },
    };
  }
};

/**
 * Generate human-readable summary message
 */
const generateSummaryMessage = (verified, partial, notFound, contradicted, total) => {
  if (total === 0) return 'No claims to verify';
  
  const verifiedPct = Math.round((verified / total) * 100);
  
  if (contradicted > 0) {
    return `⚠️ ${contradicted} claim(s) contradict source materials. Review needed.`;
  }
  if (verifiedPct >= 80) {
    return `✅ ${verified}/${total} claims verified against source materials. Content is well-grounded.`;
  }
  if (verifiedPct >= 50) {
    return `ℹ️ ${verified}/${total} claims verified. ${notFound} claims lack source backing.`;
  }
  return `⚠️ Only ${verified}/${total} claims verified. Content may contain unsupported statements.`;
};

/**
 * Generate actionable recommendations based on grounding analysis
 */
const generateRecommendations = (comparisons) => {
  const recommendations = [];

  const notFoundClaims = comparisons.filter(c => 
    c.verification.status === 'not_found' || c.verification.status === 'no_sources'
  );
  const contradictedClaims = comparisons.filter(c => 
    c.verification.status === 'contradicted'
  );

  if (contradictedClaims.length > 0) {
    recommendations.push({
      priority: 'high',
      action: 'Review contradicted claims',
      details: `${contradictedClaims.length} claim(s) may contain inaccuracies that contradict source materials.`,
    });
  }

  if (notFoundClaims.length > 2) {
    recommendations.push({
      priority: 'medium',
      action: 'Add source citations',
      details: `${notFoundClaims.length} claims lack backing in uploaded materials. Consider adding supporting documents.`,
    });
  }

  if (comparisons.length > 0 && comparisons.every(c => c.verification.status === 'verified')) {
    recommendations.push({
      priority: 'low',
      action: 'Content well-grounded',
      details: 'All analyzed claims are supported by source materials.',
    });
  }

  return recommendations;
};

module.exports = {
  extractClaims,
  findMatchingFacts,
  analyzeSemanticGrounding,
};
