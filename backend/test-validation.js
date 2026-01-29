/**
 * Test Content Validation System
 * Run this to verify Part 4 validation is working
 */

const { validateContent } = require('./src/utils/contentValidator');

// Sample generated content with code
const sampleContent = `# Binary Search Tree Implementation

## Overview
Binary Search Trees (BSTs) are fundamental data structures in computer science. [Source: Data Structures - Lecture Notes]

## Implementation

Here's a Python implementation:

\`\`\`python
class TreeNode:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None
    
    def insert(self, value):
        """Insert a value into the BST"""
        if self.root is None:
            self.root = TreeNode(value)
        else:
            self._insert_recursive(self.root, value)
    
    def _insert_recursive(self, node, value):
        if value < node.value:
            if node.left is None:
                node.left = TreeNode(value)
            else:
                self._insert_recursive(node.left, value)
        else:
            if node.right is None:
                node.right = TreeNode(value)
            else:
                self._insert_recursive(node.right, value)
    
    def search(self, value):
        """Search for a value in the BST"""
        return self._search_recursive(self.root, value)
    
    def _search_recursive(self, node, value):
        if node is None:
            return False
        if value == node.value:
            return True
        elif value < node.value:
            return self._search_recursive(node.left, value)
        else:
            return self._search_recursive(node.right, value)
\`\`\`

## Time Complexity
- Insert: O(log n) average, O(n) worst case [Source: Algorithms - Theory]
- Search: O(log n) average, O(n) worst case [Source: Algorithms - Theory]

## References
### Primary Sources (Uploaded Materials)
- Data Structures - Lecture Notes
- Algorithms - Theory
`;

// Sample material sources
const materialSources = [
  { id: 1, title: 'Data Structures', category: 'Lecture Notes', file_name: 'ds-lecture.pdf' },
  { id: 2, title: 'Algorithms', category: 'Theory', file_name: 'algo-theory.pdf' },
];

async function testValidation() {
  console.log('🧪 Testing Content Validation System...\n');

  try {
    const result = await validateContent({
      content: sampleContent,
      topic: 'Binary Search Tree Implementation',
      type: 'Lab',
      materialSources: materialSources,
      internalContext: 'Mock RAG context from uploaded materials',
    });

    console.log('✅ Validation completed!\n');
    console.log('='.repeat(60));
    console.log('VALIDATION RESULTS');
    console.log('='.repeat(60));

    // Overall Score
    console.log('\n📊 OVERALL SCORE');
    console.log(`   Score: ${result.overall.overallScore}%`);
    console.log(`   Status: ${result.overall.status}`);
    console.log(`   Passes: ${result.overall.passesValidation ? '✓ YES' : '✗ NO'}`);

    // Breakdown
    console.log('\n📈 SCORE BREAKDOWN');
    console.log(`   Code Syntax:      ${result.overall.breakdown.syntax}%`);
    console.log(`   Content Grounding: ${result.overall.breakdown.grounding}%`);
    console.log(`   Overall Quality:   ${result.overall.breakdown.quality}%`);

    // Syntax Results
    console.log('\n💻 CODE SYNTAX VALIDATION');
    if (result.syntax.hasCode) {
      console.log(`   Blocks Checked: ${result.syntax.blocksChecked}`);
      console.log(`   Valid Blocks:   ${result.syntax.validBlocks}`);
      console.log(`   Invalid Blocks: ${result.syntax.invalidBlocks}`);
      console.log(`   All Valid:      ${result.syntax.allValid ? '✓' : '✗'}`);
    } else {
      console.log('   No code blocks found');
    }

    // Grounding Results
    console.log('\n🎯 CONTENT GROUNDING');
    console.log(`   Grounding Score:    ${result.grounding.groundingScore}%`);
    console.log(`   Grounding Level:    ${result.grounding.groundingLevel}`);
    console.log(`   Total Citations:    ${result.grounding.totalCitations}`);
    console.log(`   Internal Citations: ${result.grounding.internalCitations}`);
    console.log(`   Materials Used:     ${result.grounding.materialsUsed}`);

    // Quality Results
    console.log('\n⭐ QUALITY EVALUATION');
    if (result.quality.success) {
      console.log(`   Overall Score: ${result.quality.overallScore}/10`);
      console.log(`   Grade:         ${result.quality.grade}`);
      console.log('\n   Category Scores:');
      Object.entries(result.quality.scores).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        console.log(`     ${label}: ${value}/10`);
      });

      if (result.quality.strengths?.length > 0) {
        console.log('\n   ✓ Strengths:');
        result.quality.strengths.forEach(s => console.log(`     - ${s}`));
      }

      if (result.quality.weaknesses?.length > 0) {
        console.log('\n   ⚠ Weaknesses:');
        result.quality.weaknesses.forEach(w => console.log(`     - ${w}`));
      }

      if (result.quality.recommendations?.length > 0) {
        console.log('\n   💡 Recommendations:');
        result.quality.recommendations.forEach(r => console.log(`     - ${r}`));
      }
    } else {
      console.log('   Quality evaluation failed');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testValidation();
