# Part 3: AI Material Generation - Implementation Guide

## ✅ Enhanced Features (Latest Update)

### 🎯 Major Enhancements

#### 1. **Context-Aware Generation (Prioritizes Uploaded Materials)**

- **Primary Source: Uploaded Course Materials** - Generation now heavily prioritizes RAG search results from uploaded PDFs
- **Increased Context Window**: Retrieves 10 chunks (up from 5) with lower threshold (0.3) for broader coverage
- **Material Tracking**: Shows exactly which uploaded materials were used as sources
- **Secondary Wikipedia**: External sources only fill gaps when internal materials are insufficient
- **Source Attribution**: Every fact cites its source (Internal Material or External Wikipedia)

#### 2. **Rich Content Generation with Images & Diagrams**

- **Image Support**: Generated content can include markdown image syntax `![description](url)`
- **Diagram Placeholders**: AI suggests relevant diagrams and flowcharts
- **Mermaid Diagram Support**: Content can include mermaid syntax for:
  - Flowcharts for code logic
  - Concept diagrams for theory
  - Architecture diagrams
- **Visual Learning**: Enhanced educational value with visual aids

#### 3. **Professional PDF Export**

- **One-Click Download**: Export generated materials as beautifully formatted PDF
- **Rich Styling**:
  - Professional typography with proper heading hierarchy
  - Syntax-highlighted code blocks
  - Styled blockquotes and tables
  - Responsive images with shadows
- **Branded PDFs**: Includes document header, type badges, generation timestamp
- **Print-Ready**: Optimized for printing with page break handling

#### 4. **Enhanced UI/UX**

- **Material Source Display**: Shows uploaded materials used in generation
- **Primary vs Supplementary**: Clear distinction between internal and external sources
- **Download Button**: Prominent PDF download with loading states
- **Improved Layout**: Gradient backgrounds and better visual hierarchy
- **Source Citations**: Visual indicators for material sources

## 🔧 Technical Details

### Backend Enhancements

**Updated Generation Controller** (`backend/src/controllers/generation.controller.js`):

- ✅ **Enhanced RAG Search**:
  - Retrieves 10 chunks (increased from 5) with 0.3 threshold (lowered from 0.5)
  - Fetches material metadata (title, category, filename) for proper citations
  - Tracks which uploaded materials contributed to generation
- ✅ **Updated AI Prompts**:
  - Explicit instructions to prioritize uploaded materials
  - Mandatory source citation requirements
  - Support for images/diagrams in output
  - Increased token limit to 4000 for richer content
- ✅ **Material Source Tracking**:
  - Returns list of materials used in `sources_used.materials`
  - Each material includes title, category, and filename
- ✅ **PDF Export Endpoint**: `GET /api/generate/:id/pdf`
  - Exports generated material as formatted PDF
  - Automatic filename generation
  - Streaming PDF response

**New PDF Generator Utility** (`backend/src/utils/pdfGenerator.js`):

- ✅ **Markdown to HTML Conversion** using `marked` library
- ✅ **Professional PDF Styling**:
  - Document header with type badge and title
  - Color-coded by material type (blue for Theory, green for Lab)
  - Syntax-highlighted code blocks
  - Responsive images with shadow effects
  - Print-optimized layouts
- ✅ **PDF Generation** using `html-pdf-node`
  - A4 format with proper margins
  - Background graphics enabled
  - Page break handling

**Updated Routes** (`backend/src/routes/generation.routes.js`):

- ✅ POST `/api/generate` - Generate new material
- ✅ GET `/api/generate/history` - Get all generated materials
- ✅ GET `/api/generate/:id/pdf` - **NEW** Export as PDF
- ✅ GET `/api/generate/:id` - Get material by ID

**Dependencies Added**:

```bash
npm install marked html-pdf-node
```

### Frontend Enhancements

**Updated Lab Generator Page** (`frontend/src/pages/LabGenerator.jsx`):

- ✅ **Enhanced Source Display**:
  - Gradient background for sources section
  - Separate display for uploaded materials (primary sources)
  - Shows material title, category for each source
  - Wikipedia marked as "Supplementary" when used
- ✅ **PDF Download Feature**:
  - Download button with loading state
  - Automatic PDF download with proper filename
  - Error handling for failed downloads
- ✅ **Improved UI**:
  - Better visual hierarchy with icons
  - Material source badges with checkmarks
  - Action buttons grouped (Copy + Download PDF)

**Updated API Service** (`frontend/src/services/api.js`):

- ✅ `exportGeneratedAsPDF(id)` - New function for PDF export
  - Handles blob response type
  - Returns PDF binary data

## 🎯 How to Use

### Access the Feature

1. Navigate to **Lab Generator** in the sidebar
2. Or visit: `http://localhost:3000/lab-generator`

### Generate Context-Aware Theory Material

1. **First, Upload Course Materials**:
   - Go to Dashboard and upload PDF course materials
   - Wait for processing to complete
2. Enter a topic related to your uploaded materials (e.g., "Binary Search Trees")
3. Select "📚 Theory (Lecture Notes)"
4. Click "Generate Material"
5. Wait 10-20 seconds for AI generation
6. View comprehensive lecture notes with:
   - **Content based primarily on YOUR uploaded materials**
   - Overview with source citations
   - Detailed explanations from your course content
   - Possible diagrams and visual aids
   - Examples from uploaded materials
   - **Source Attribution**: See which uploaded materials were used
7. **Download PDF**: Click "Download PDF" button to get professional PDF version
8. Copy content to clipboard if needed

### Generate Context-Aware Lab Exercise

1. **First, Upload Code Examples/Materials**:
   - Upload programming-related PDFs or code examples
   - Wait for processing
2. Enter a topic (e.g., "Python List Comprehensions")
3. Select "💻 Lab (Code Exercise)"
4. Click "Generate Material"
5. Wait 10-20 seconds for AI generation
6. View complete coding exercise with:
   - **Exercise based on YOUR uploaded materials**
   - Learning objectives from your content
   - Starter code with TODOs
   - Complete solution with source citations in comments
   - Expected output
   - Syntax-highlighted code
   - Possible flowcharts/diagrams
7. **Download PDF**: Get printable lab exercise in PDF format
8. Copy code to your IDE

### View Uploaded Material Sources

1. After generation, check the **"Sources Used"** section
2. **Primary Sources**: Shows your uploaded materials that were used
   - Material title and category displayed
   - Multiple materials may contribute to one generation
3. **Supplementary Sources**: Wikipedia link if external knowledge was used
4. Sources are color-coded:
   - 📚 Uploaded Materials (Primary) - Indigo/Purple badges
   - 🌐 Wikipedia (Supplementary) - Blue badges

### Download Professional PDF

1. After viewing generated content, click **"Download PDF"** button
2. Wait for PDF generation (2-3 seconds)
3. PDF automatically downloads with descriptive filename
4. PDF Features:
   - Professional header with material type badge
   - Formatted content with proper typography
   - Syntax-highlighted code blocks (for Lab materials)
   - Images and diagrams rendered properly
   - Source citations preserved
   - Footer with generation timestamp
   - Print-ready format (A4 size)

### View History

1. Click "Show" in the History section
2. Filter by type (All Types, Theory Only, Lab Only)
3. Browse previously generated materials
4. See creation timestamps and previews
5. Click any item to regenerate or download as PDF

## 🌟 Key Improvements from Original

### Priority Changes

| Aspect              | Before                          | After                                        |
| ------------------- | ------------------------------- | -------------------------------------------- |
| **Context Source**  | Equal weight to RAG + Wikipedia | **Prioritizes uploaded materials**           |
| **RAG Chunks**      | 5 chunks, 0.5 threshold         | **10 chunks, 0.3 threshold** (more coverage) |
| **Source Tracking** | Generic "Internal" label        | **Shows exact material names & categories**  |
| **Citations**       | Generic source mentions         | **Mandatory citations for every fact**       |
| **Visual Content**  | Text-only                       | **Supports images, diagrams, flowcharts**    |
| **PDF Export**      | Not available                   | **✅ Professional PDF download**             |
| **Token Limit**     | 3000 tokens                     | **4000 tokens (richer content)**             |

### AI Prompt Enhancements

- Explicit instruction: "Build content PRIMARILY from uploaded materials"
- External sources marked as "Use ONLY if needed"
- Required citation format: `[Source: Material Name - Category]`
- Support for mermaid diagrams in output
- Image placeholder suggestions

### User Experience Improvements

- See exactly which of your uploaded files contributed
- Distinguish between your content vs external knowledge
- Download beautiful PDFs for offline use/printing
- Better visual hierarchy and modern UI
- Source badges with icons and colors

## 📊 AI Generation Pipeline (Enhanced)

```
User Input (Topic + Type)
    ↓
1. Validation
   - Topic required
   - Type: Theory or Lab
    ↓
2. RAG Search (PRIORITIZED - Internal Context)
   - Query embedding via OpenAI
   - Semantic search in material_embeddings
   - Top 10 relevant chunks (threshold 0.3) ⬅️ INCREASED
   - Fetch material metadata (title, category, filename)
   - Build context with source attribution
    ↓
3. Wikipedia Search (SUPPLEMENTARY - External Context)
   - Search Wikipedia for topic
   - Extract summary (max 2000 chars)
   - Only used to fill gaps
    ↓
4. AI Prompt Construction
   Theory:
   - System: Expert Professor role
   - Priority: Use uploaded materials FIRST
   - Format: Markdown with images/diagrams
   - Citations: Mandatory for every fact

   Lab:
   - System: Expert Lab Instructor role
   - Priority: Base on uploaded code examples
   - Format: Markdown with mermaid flowcharts
   - Code: Must be executable with citations
    ↓
5. OpenAI Generation
   - Model: gpt-4o-mini
   - Temperature: 0.7
   - Max Tokens: 4000 ⬅️ INCREASED
   - Context: Uploaded materials + Wikipedia
    ↓
6. Save to Database
   - Table: generated_materials
   - Store: prompt + output + type
   - Track validation status
    ↓
7. Return Response with Sources
   - Generated content
   - Source tracking:
     * Internal: TRUE/FALSE
     * External: TRUE/FALSE
     * Materials: [{title, category, filename}] ⬅️ NEW
     * Wikipedia URL (if used)
```

## 🔍 Example Generation Workflow

### Scenario: Generate Theory on "Sorting Algorithms"

**Step 1**: User uploads course materials

- `algorithms_lecture.pdf` (Lecture notes on sorting)
- `data_structures.pdf` (General DS concepts)
- Processing completes, embeddings stored

**Step 2**: User requests generation

- Topic: "Sorting Algorithms"
- Type: Theory

**Step 3**: RAG Search

```
Query Embedding: [0.123, -0.456, ...] (1536 dims)
Threshold: 0.3
Results Found: 8 chunks from 2 materials

Chunk 1 (Similarity: 0.89):
  Material: "algorithms_lecture.pdf" - Lecture Notes
  Text: "Bubble sort is a simple sorting algorithm..."

Chunk 2 (Similarity: 0.85):
  Material: "algorithms_lecture.pdf" - Lecture Notes
  Text: "Quicksort uses divide-and-conquer..."

... (6 more chunks)
```

**Step 4**: Wikipedia Search (Supplementary)

```
Found: "Sorting algorithm" article
Summary: "A sorting algorithm is an algorithm that puts elements..."
URL: https://en.wikipedia.org/wiki/Sorting_algorithm
```

**Step 5**: AI Generates Content

```markdown
# Sorting Algorithms

## Overview

Sorting algorithms arrange elements in a specific order [Source: algorithms_lecture.pdf - Lecture Notes]...

## Key Algorithms

### Bubble Sort

Simple comparison-based algorithm [Source: algorithms_lecture.pdf - Lecture Notes]...

### Quick Sort

Efficient divide-and-conquer approach [Source: algorithms_lecture.pdf - Lecture Notes]...

## Time Complexity Comparison

[External: Wikipedia provides complexity table as supplementary reference]

## References

### Primary Sources (Uploaded Materials)

- algorithms_lecture.pdf (Lecture Notes)
- data_structures.pdf (Lecture Notes)

### Supplementary Sources

- Wikipedia: Sorting Algorithm
```

**Step 6**: User Interface Shows

- ✅ **Primary Sources**: `algorithms_lecture.pdf`, `data_structures.pdf`
- ✅ **Supplementary**: Wikipedia link
- ✅ **Actions**: Copy content, Download PDF

**Step 7**: Download PDF

- Click "Download PDF"
- Filename: `sorting_algorithms_theory.pdf`
- Opens/downloads professional formatted PDF

## 💡 Best Practices

### For Best Results:

1. **Upload Relevant Materials First**
   - Upload PDFs related to your desired topics
   - More materials = better context
   - Ensure materials are processed before generating

2. **Use Specific Topics**
   - Instead of "Programming", use "Python Object-Oriented Programming"
   - Specific topics get better RAG matches
   - Topic should relate to uploaded materials

3. **Check Sources Used**
   - Verify that your uploaded materials were used
   - If no internal sources, topic might not match uploads
   - Wikipedia-only means no matching materials found

4. **Download PDFs for Archival**
   - Save generated materials as PDFs
   - Share with students/colleagues
   - Print for offline study

5. **Iterate if Needed**
   - If result doesn't match expectations, try:
     - More specific topic
     - Upload more relevant materials
     - Different material type (Theory vs Lab)

## 🐛 Troubleshooting

### "No relevant internal materials found"

- **Cause**: No uploaded materials match the topic
- **Solution**:
  1. Upload materials related to the topic
  2. Wait for processing to complete
  3. Try again with more specific topic

### Generated content uses only Wikipedia

- **Cause**: Uploaded materials not relevant to topic
- **Solution**:
  1. Check if you uploaded materials on this topic
  2. Use more specific topic that matches your uploads
  3. Upload additional materials

### PDF download fails

- **Cause**: Backend error or large content
- **Solution**:
  1. Check backend is running (`npm run dev`)
  2. Check browser console for errors
  3. Try copying content and generating PDF manually

### Missing source attributions

- **Cause**: Old generated content (before update)
- **Solution**: Regenerate the material to get source tracking

## 🚀 API Examples

### Generate Material with Context

```bash
curl -X POST http://localhost:5000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Binary Search Trees",
    "type": "Theory"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Theory material generated successfully",
  "data": {
    "id": 123,
    "topic": "Binary Search Trees",
    "type": "Theory",
    "content": "# Binary Search Trees\n\n...",
    "created_at": "2026-01-29T...",
    "sources_used": {
      "internal": true,
      "external": true,
      "wikipedia_url": "https://...",
      "materials": [
        {
          "title": "Data Structures Lecture",
          "category": "Lecture Notes",
          "filename": "ds_lecture.pdf"
        }
      ]
    }
  }
}
```

### Export as PDF

```bash
curl -X GET http://localhost:5000/api/generate/123/pdf \
  --output material.pdf
```

**Response:** PDF binary stream

## 📦 Database Schema

### `generated_materials` Table

```sql
CREATE TABLE generated_materials (
  id SERIAL PRIMARY KEY,
  prompt TEXT NOT NULL,              -- Full AI prompt used
  output_content TEXT NOT NULL,      -- Generated markdown content
  type VARCHAR(50) NOT NULL,         -- 'Theory' or 'Lab'
  is_validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Note: Material source tracking is included in the response but not stored separately in DB.

## 🎓 Educational Impact

### Benefits of Context-Aware Generation:

1. **Curriculum Alignment**
   - Generated content matches your course materials
   - Students get consistent terminology and concepts
   - Reinforces what's taught in class

2. **Personalized Learning**
   - Content reflects your teaching style and examples
   - Uses familiar code patterns from your materials
   - Maintains pedagogical continuity

3. **Source Transparency**
   - Students know what sources were used
   - Can cross-reference with original materials
   - Builds trust in AI-generated content

4. **Time Savings**
   - Auto-generates supplementary materials
   - Creates practice exercises from your content
   - Produces professional PDFs instantly

5. **Quality Assurance**
   - Content sourced from vetted materials
   - Reduced hallucinations (grounded in your docs)
   - Citations enable verification

---

**Part 3 Enhanced Implementation Complete! ✅**

All features tested and working:

- ✅ Context-aware generation prioritizing uploaded materials
- ✅ Material source tracking and display
- ✅ Image and diagram support in content
- ✅ Professional PDF export
- ✅ Enhanced UI with better source visualization
- ✅ Improved AI prompts with mandatory citations

### View History

1. Click "Show" in the History section
2. Filter by type (All Types, Theory Only, Lab Only)
3. Browse previously generated materials
4. See creation timestamps and previews

## 🔧 Technical Details

### AI Generation Pipeline

```
User Input (Topic + Type)
    ↓
1. RAG Search (Internal Context)
   - Query embedding via OpenAI
   - Semantic search in material_embeddings
   - Top 5 relevant chunks (threshold 0.5)
    ↓
2. Wikipedia Search (External Context)
   - Search for topic
   - Extract summary and URL
    ↓
3. Prompt Engineering
   - Theory: Comprehensive lecture notes format
   - Lab: Executable code exercise format
   - Combine internal + external sources
    ↓
4. OpenAI Generation
   - Model: gpt-4o-mini
   - Temperature: 0.7
   - Max Tokens: 3000
    ↓
5. Database Storage
   - Save to generated_materials table
   - Include prompt, output, type, validation status
    ↓
6. Return to Frontend
   - Display with Markdown rendering
   - Show sources used
   - Enable copy to clipboard
```

### Source Citation System

The AI automatically cites sources:

- **[Internal: Source X]** - From uploaded course materials (RAG)
- **[External: Wikipedia]** - From Wikipedia articles
- Links to Wikipedia articles provided when available

### Material Types

**Theory (Lecture Notes)**

- Markdown formatted educational content
- Structured sections (Overview, Concepts, Examples, Summary)
- 500-800 words target
- Combines academic rigor with practical examples

**Lab (Code Exercise)**

- Complete programming exercises
- Starter code with TODOs for students
- Fully working solution code
- Expected output examples
- Syntax-correct and executable

## 📊 Features

### Generation Form

- **Topic Input**: Free-text field for any subject
- **Type Selector**: Theory or Lab dropdown
- **Validation**: Requires topic before generating
- **Loading State**: Shows progress during 10-20s generation
- **Error Handling**: Clear error messages if generation fails

### Content Display

- **Metadata**: Type badge, topic, creation timestamp
- **Sources**: Visual indicators for RAG and Wikipedia usage
- **Markdown Rendering**: Full GitHub Flavored Markdown support
  - Headers, lists, tables, blockquotes
  - Inline code and code blocks
  - Links, images, emphasis
- **Code Highlighting**: VS Code Dark Plus theme
  - Python, JavaScript, Java, C++, etc.
  - Line numbers and syntax colors
- **Copy Button**: One-click content copying

### History View

- **Filtering**: All Types, Theory Only, Lab Only
- **Preview**: First 200 characters of each material
- **Timestamps**: Relative time display
- **Count**: Shows total generated materials
- **Collapsible**: Toggle visibility to save space

## 🎨 UI/UX Features

### Visual Design

- **Gradient Header**: Purple-to-pink gradient icon
- **Type Indicators**: Blue (Theory) and Emerald (Lab) color coding
- **Loading Animation**: Pulsing button with spinner
- **Success Feedback**: Green checkmark confirmation
- **Error Alerts**: Red alert box with icon

### Responsive Layout

- **Mobile Friendly**: Stacked form on small screens
- **Desktop Optimized**: Side-by-side layout on large screens
- **Max Width**: 5xl container for optimal reading

### Accessibility

- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus States**: Clear focus indicators

## 🔍 Example Topics

### Theory Topics

- "Binary Search Trees"
- "Database Normalization"
- "React Hooks"
- "Machine Learning Basics"
- "Object-Oriented Programming"
- "Data Structures and Algorithms"

### Lab Topics

- "Python List Comprehensions"
- "JavaScript Async/Await"
- "SQL JOIN Operations"
- "React useState Hook"
- "Sorting Algorithms Implementation"
- "RESTful API Design"

## 🚀 Next Steps

### Current Status

✅ Backend fully functional and tested
✅ Frontend completely implemented
✅ All features working end-to-end
✅ Part 3 complete!

### Future Enhancements (Optional)

- [ ] Material validation system (mark as reviewed)
- [ ] Export to PDF functionality
- [ ] Share generated materials
- [ ] Edit and regenerate options
- [ ] Save favorites
- [ ] Search within generated content
- [ ] Multi-language support
- [ ] Custom prompt templates

## 📝 API Documentation

### POST /api/generate

Generate new AI learning material.

**Request Body:**

```json
{
  "topic": "Binary Search Trees",
  "type": "Theory"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Theory material generated successfully",
  "data": {
    "id": 1,
    "topic": "Binary Search Trees",
    "type": "Theory",
    "content": "# Binary Search Trees\n\n## Overview\n...",
    "created_at": "2026-01-29T12:00:00Z",
    "sources_used": {
      "internal": true,
      "external": true,
      "wikipedia_url": "https://en.wikipedia.org/wiki/Binary_search_tree"
    }
  }
}
```

### GET /api/generate/history

Fetch generation history with optional filtering.

**Query Parameters:**

- `type` (optional): "Theory" or "Lab"
- `limit` (optional): Number of results (default: 20)

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 2,
      "type": "Lab",
      "is_validated": false,
      "created_at": "2026-01-29T12:05:00Z",
      "content_preview": "# Lab Exercise: Python List Comprehensions\n\n## Objective\nLearn to..."
    },
    {
      "id": 1,
      "type": "Theory",
      "is_validated": false,
      "created_at": "2026-01-29T12:00:00Z",
      "content_preview": "# Binary Search Trees\n\n## Overview\nA binary search tree..."
    }
  ]
}
```

### GET /api/generate/:id

Get a specific generated material by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "prompt": "SYSTEM:\n...\n\nUSER:\n...",
    "output_content": "# Binary Search Trees\n\n...",
    "type": "Theory",
    "is_validated": false,
    "created_at": "2026-01-29T12:00:00Z"
  }
}
```

## 🎉 Summary

Part 3 (AI Material Generation) is **100% complete**! The platform now offers:

1. **Intelligent Content Generation**: RAG + Wikipedia + OpenAI
2. **Dual Material Types**: Theory notes and Lab exercises
3. **Beautiful UI**: Markdown rendering with syntax highlighting
4. **Generation History**: Track and filter past generations
5. **Source Attribution**: Clear citations for transparency
6. **Responsive Design**: Works on all devices

The AI Learning Platform is now fully functional with all three parts:

- ✅ Part 1: Content Management System (CMS)
- ✅ Part 2: Intelligent Search (RAG)
- ✅ Part 3: AI Material Generation

Ready for hackathon demo! 🚀
