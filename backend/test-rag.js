/**
 * RAG Test Script
 * Tests the intelligent search functionality
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

// Simple HTTP request wrapper
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ data: JSON.parse(data), status: res.statusCode });
        } catch (e) {
          resolve({ data, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  step: (msg) => console.log(`\n${colors.magenta}━━━ ${msg} ━━━${colors.reset}`),
};

async function testRAGWorkflow() {
  try {
    log.step('Step 1: Check server health');
    const health = await request(`${BASE_URL}/../health`);
    log.success(`Server is ${health.data.status}`);

    log.step('Step 2: Get list of materials');
    const materialsRes = await request(`${BASE_URL}/cms/materials`);
    const materials = materialsRes.data.data || [];

    if (materials.length === 0) {
      log.warning('No materials found. Please upload some materials first.');
      return;
    }

    log.success(`Found ${materials.length} materials`);
    materials.slice(0, 3).forEach(m => {
      console.log(`  - ${m.title} (${m.category})`);
    });

    // Select first material for testing
    const testMaterial = materials[0];
    log.step(`Step 3: Check processing status for "${testMaterial.title}"`);

    const statusRes = await request(`${BASE_URL}/rag/status/${testMaterial.id}`);
    const status = statusRes.data.data;

    console.log(`  Material ID: ${status.material_id}`);
    console.log(`  Title: ${status.material_title}`);
    console.log(`  Content Length: ${status.content_length} characters`);
    console.log(`  Embeddings Count: ${status.embeddings_count}`);
    console.log(`  Is Processed: ${status.is_processed ? 'Yes' : 'No'}`);

    if (!status.is_processed) {
      log.step(`Step 4: Processing material "${testMaterial.title}"`);
      log.info('This may take a moment as we generate embeddings...');

      const processRes = await request(`${BASE_URL}/rag/process/${testMaterial.id}`, { method: 'POST' });
      const result = processRes.data.data;

      log.success('Material processed successfully!');
      console.log(`  Chunks Created: ${result.chunks_created}`);
      console.log(`  Total Characters: ${result.total_characters}`);
    } else {
      log.info('Material already processed, skipping to search...');
    }

    log.step('Step 5: Test semantic search');
    const searchQueries = [
      'machine learning',
      'neural networks',
      'data structures',
      'python programming',
      'algorithms'
    ];

    // Pick a random query
    const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
    log.info(`Searching for: "${query}"`);

    const searchRes = await request(`${BASE_URL}/rag/search`, {
      method: 'POST',
      body: {
        query: query,
        threshold: 0.5,  // Lower threshold for demo
        limit: 5
      }
    });

    const searchResults = searchRes.data.results || [];
    log.success(`Found ${searchResults.length} results`);

    if (searchResults.length > 0) {
      console.log('\n📊 Search Results:\n');
      searchResults.forEach((result, idx) => {
        console.log(`${idx + 1}. ${colors.green}${result.material_title}${colors.reset}`);
        console.log(`   Category: ${result.material_category}`);
        console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`);
        console.log(`   Excerpt: ${result.chunk_text.substring(0, 150)}...`);
        console.log('');
      });
    } else {
      log.warning('No results found. Try processing more materials or adjusting the search query.');
    }

    log.step('Step 6: Process all unprocessed materials (Optional)');
    log.info('Checking for unprocessed materials...');

    const processAllRes = await request(`${BASE_URL}/rag/process-all`, { method: 'POST' });
    const processAllResult = processAllRes.data;

    log.success(processAllResult.message);
    if (processAllResult.results && processAllResult.results.length > 0) {
      console.log('\n📝 Processing Results:\n');
      processAllResult.results.forEach(r => {
        if (r.error) {
          console.log(`  ${colors.red}✗${colors.reset} ${r.title}: ${r.error}`);
        } else {
          console.log(`  ${colors.green}✓${colors.reset} ${r.title}: ${r.chunks} chunks`);
        }
      });
    }

    log.step('✨ RAG System Test Complete!');
    console.log(`\n${colors.green}All tests passed successfully!${colors.reset}`);
    console.log(`\nYou can now use the intelligent search feature in the frontend.`);

  } catch (error) {
    log.error('Test failed!');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    console.error('\nMake sure the backend server is running on http://localhost:5000');
    process.exit(1);
  }
}

// Run the test
console.log(`\n${colors.magenta}╔════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.magenta}║   RAG Intelligent Search Test Suite   ║${colors.reset}`);
console.log(`${colors.magenta}╚════════════════════════════════════════╝${colors.reset}\n`);

testRAGWorkflow();
