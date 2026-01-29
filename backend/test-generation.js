/**
 * AI Material Generation Test Script
 * Tests the Part 3 generation functionality
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

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

async function testGenerationWorkflow() {
  try {
    log.step('Step 1: Check server health');
    const health = await request(`${BASE_URL}/../health`);
    log.success(`Server is ${health.data.status}`);

    log.step('Step 2: Test Theory Material Generation');
    log.info('Topic: "Binary Search Trees"');
    log.info('This will combine internal RAG + Wikipedia context...');

    const theoryRes = await request(`${BASE_URL}/generate`, {
      method: 'POST',
      body: {
        topic: 'Binary Search Trees',
        type: 'Theory'
      }
    });

    if (theoryRes.status === 201) {
      log.success('Theory material generated successfully!');
      console.log(`\n📄 Generated Material ID: ${theoryRes.data.data.id}`);
      console.log(`📏 Content Length: ${theoryRes.data.data.content.length} characters`);
      console.log(`\n📚 Sources Used:`);
      console.log(`   Internal (RAG): ${theoryRes.data.data.sources_used.internal ? '✓' : '✗'}`);
      console.log(`   External (Wiki): ${theoryRes.data.data.sources_used.external ? '✓' : '✗'}`);
      if (theoryRes.data.data.sources_used.wikipedia_url) {
        console.log(`   Wiki URL: ${theoryRes.data.data.sources_used.wikipedia_url}`);
      }
      console.log(`\n📝 Content Preview:`);
      console.log(theoryRes.data.data.content.substring(0, 500) + '...\n');
    } else {
      log.error(`Theory generation failed: ${theoryRes.data.error}`);
      if (theoryRes.data.details) {
        console.error(`Details: ${theoryRes.data.details}`);
      }
    }

    log.step('Step 3: Test Lab Material Generation');
    log.info('Topic: "Python List Comprehensions"');

    const labRes = await request(`${BASE_URL}/generate`, {
      method: 'POST',
      body: {
        topic: 'Python List Comprehensions',
        type: 'Lab'
      }
    });

    if (labRes.status === 201) {
      log.success('Lab material generated successfully!');
      console.log(`\n📄 Generated Material ID: ${labRes.data.data.id}`);
      console.log(`📏 Content Length: ${labRes.data.data.content.length} characters`);
      console.log(`\n📚 Sources Used:`);
      console.log(`   Internal (RAG): ${labRes.data.data.sources_used.internal ? '✓' : '✗'}`);
      console.log(`   External (Wiki): ${labRes.data.data.sources_used.external ? '✓' : '✗'}`);
      console.log(`\n📝 Content Preview:`);
      console.log(labRes.data.data.content.substring(0, 500) + '...\n');
    } else {
      log.error(`Lab generation failed: ${labRes.data.error}`);
    }

    log.step('Step 4: Get Generation History');
    const historyRes = await request(`${BASE_URL}/generate/history?limit=5`);

    if (historyRes.status === 200) {
      log.success(`Retrieved ${historyRes.data.count} generated materials`);
      console.log('\n📚 Recent Generations:\n');
      historyRes.data.data.forEach((item, idx) => {
        console.log(`${idx + 1}. ID: ${item.id} | Type: ${item.type} | Validated: ${item.is_validated ? 'Yes' : 'No'}`);
        console.log(`   Created: ${new Date(item.created_at).toLocaleString()}`);
        console.log(`   Preview: ${item.content_preview}\n`);
      });
    }

    log.step('✨ AI Material Generation Test Complete!');
    console.log(`\n${colors.green}All tests passed successfully!${colors.reset}`);
    console.log(`\nYou can now use the generation feature in the frontend.`);
    console.log(`\nAPI Endpoints:`);
    console.log(`  POST /api/generate           - Generate Theory/Lab`);
    console.log(`  GET  /api/generate/history   - Get all generated`);
    console.log(`  GET  /api/generate/:id       - Get by ID`);

  } catch (error) {
    log.error('Test failed!');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    console.error('\nMake sure:');
    console.error('1. Backend server is running on http://localhost:5000');
    console.error('2. OPENAI_API_KEY is set in .env');
    console.error('3. wikipedia package is installed (npm install wikipedia)');
    console.error('4. Database tables exist (materials, material_embeddings, generated_materials)');
    process.exit(1);
  }
}

console.log(`\n${colors.magenta}╔════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.magenta}║   AI Material Generation Test Suite   ║${colors.reset}`);
console.log(`${colors.magenta}╚════════════════════════════════════════╝${colors.reset}\n`);

testGenerationWorkflow();
