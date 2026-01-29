/**
 * External Context Fetcher (MCP Tool Wrapper)
 * Fetches information from Wikipedia as external knowledge source
 */

const wiki = require('wikipedia');

/**
 * Fetch Wikipedia summary for a given topic
 * @param {string} topic - The topic to search for
 * @returns {Promise<Object>} - { success, summary, url, title }
 */
const fetchWikipediaSummary = async (topic) => {
  try {
    console.log(`\n🌐 Fetching Wikipedia context for: "${topic}"`);

    // Search Wikipedia for the topic
    const searchResults = await wiki.search(topic, { limit: 1 });

    if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
      console.log('⚠️ No Wikipedia results found');
      return {
        success: false,
        summary: 'No Wikipedia article found for this topic.',
        url: null,
        title: null,
      };
    }

    // Get the top result
    const topResult = searchResults.results[0];
    console.log(`📖 Found article: "${topResult.title}"`);

    // Fetch the full page summary
    const page = await wiki.page(topResult.title);
    const summary = await page.summary();

    console.log(`✅ Wikipedia summary retrieved (${summary.extract.length} chars)`);

    return {
      success: true,
      summary: summary.extract,
      url: summary.content_urls?.desktop?.page || page.fullurl,
      title: summary.title,
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
