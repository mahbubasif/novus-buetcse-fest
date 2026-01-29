/**
 * External Context Fetcher (MCP Tool Wrapper)
 * Fetches information from Wikipedia as external knowledge source
 * Using direct Wikipedia REST API instead of the wikipedia npm package
 * to properly handle User-Agent requirements and avoid 403 errors
 */

const axios = require('axios');

// Wikipedia REST API base URL
const WIKI_API_BASE = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_SEARCH_API = 'https://en.wikipedia.org/w/api.php';

// Proper User-Agent to comply with Wikipedia's API policy
const USER_AGENT = 'NOVUS-AI-Learning-Platform/1.0 (https://github.com/mahbubasif/novus-buetcse-fest; educational-use)';

/**
 * Search Wikipedia for a topic and get the best matching page title
 * @param {string} query - Search query
 * @returns {Promise<string|null>} - Best matching page title or null
 */
const searchWikipedia = async (query) => {
  try {
    const response = await axios.get(WIKI_SEARCH_API, {
      params: {
        action: 'opensearch',
        search: query,
        limit: 10, // Get more results to find better matches
        namespace: 0,
        format: 'json',
      },
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    // OpenSearch returns [query, [titles], [descriptions], [urls]]
    const titles = response.data[1];
    const descriptions = response.data[2];

    if (!titles || titles.length === 0) {
      return null;
    }

    // Try to find a programming/computing related result first
    const programmingKeywords = ['programming', 'computer', 'software', 'algorithm', 'data structure', 'javascript', 'python', 'function', 'method', 'library', 'framework'];
    const queryLower = query.toLowerCase();

    // First, check if any result's title closely matches the query
    for (let i = 0; i < titles.length; i++) {
      const titleLower = titles[i].toLowerCase();
      const descLower = (descriptions[i] || '').toLowerCase();

      // Exact or close match with programming context
      if (titleLower.includes(queryLower) || queryLower.includes(titleLower)) {
        if (programmingKeywords.some(kw => descLower.includes(kw) || titleLower.includes(kw))) {
          return titles[i];
        }
      }
    }

    // If no programming-specific match, check descriptions for computing context
    for (let i = 0; i < titles.length; i++) {
      const descLower = (descriptions[i] || '').toLowerCase();
      if (programmingKeywords.some(kw => descLower.includes(kw))) {
        return titles[i];
      }
    }

    // Fall back to first result
    return titles[0];
  } catch (error) {
    console.error('Wikipedia search error:', error.message);
    return null;
  }
};

/**
 * Fetch Wikipedia summary for a given topic
 * @param {string} topic - The topic to search for
 * @returns {Promise<Object>} - { success, summary, url, title }
 */
const fetchWikipediaSummary = async (topic) => {
  try {
    console.log(`\n🌐 Fetching Wikipedia context for: "${topic}"`);

    // First, search for the topic to get the exact page title
    let pageTitle = await searchWikipedia(topic);

    // If no good result, try with "programming" or "computer science" suffix
    if (!pageTitle) {
      console.log('⚠️ Trying with programming context...');
      pageTitle = await searchWikipedia(`${topic} programming`);
    }

    if (!pageTitle) {
      console.log('⚠️ Trying with computer science context...');
      pageTitle = await searchWikipedia(`${topic} computer science`);
    }

    if (!pageTitle) {
      console.log('⚠️ No Wikipedia results found');
      return {
        success: false,
        summary: 'No Wikipedia article found for this topic.',
        url: null,
        title: null,
      };
    }

    console.log(`📖 Found article: "${pageTitle}"`);

    // Fetch the page summary using the REST API
    const encodedTitle = encodeURIComponent(pageTitle.replace(/ /g, '_'));
    const response = await axios.get(`${WIKI_API_BASE}/page/summary/${encodedTitle}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    const data = response.data;
    const summary = data.extract || '';

    console.log(`✅ Wikipedia summary retrieved (${summary.length} chars)`);

    return {
      success: true,
      summary: summary,
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedTitle}`,
      title: data.title,
    };

  } catch (error) {
    console.error('❌ Wikipedia fetch error:', error.message);
    return {
      success: false,
      summary: `Failed to fetch Wikipedia data: ${error.message}`,
      url: null,
      title: null,
      error: error.message,
    };
  }
};

/**
 * Fetch multiple Wikipedia summaries for related topics
 * @param {Array<string>} topics - Array of topics to search
 * @returns {Promise<Array>} - Array of Wikipedia results
 */
const fetchMultipleWikipediaSummaries = async (topics) => {
  try {
    const results = await Promise.all(
      topics.map(topic => fetchWikipediaSummary(topic))
    );
    return results.filter(r => r.success);
  } catch (error) {
    console.error('❌ Multiple Wikipedia fetch error:', error.message);
    return [];
  }
};

module.exports = {
  fetchWikipediaSummary,
  fetchMultipleWikipediaSummaries,
};
