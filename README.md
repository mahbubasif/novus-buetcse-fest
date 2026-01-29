# Novus - AI Learning Platform

A full-stack AI-powered learning platform built for hackathon.

## 🚀 Tech Stack

### Backend

- **Framework:** Node.js with Express
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **File Handling:** Multer (Memory Storage)
- **Text Extraction:** pdf-parse (for PDFs), native Node.js (for code files)

### Frontend

- **Framework:** React (Vite)
- **Styling:** Tailwind CSS
- **Icons:** lucide-react
- **HTTP Client:** Axios

## 📁 Project Structure

```
/novus-buetcse-fest
├── /backend                 # Node.js Express Server
│   ├── /src
│   │   ├── /config          # Supabase & OpenAI configs
│   │   ├── /controllers     # Logic for Search, Upload, Chat
│   │   ├── /routes          # API Routes (/api/upload, /api/chat)
│   │   ├── /services        # AI Service (OpenAI calls), RAG Logic
│   │   ├── /utils           # PDF parser, Code linter
│   │   ├── /lib             # Supabase client
│   │   └── server.js        # Entry point
│   ├── package.json
│   └── .env.example
│
├── /frontend                # React (Vite) + Tailwind
│   ├── /src
│   │   ├── /components      # Reusable UI (ChatBox, PDFViewer)
│   │   ├── /pages           # Dashboard, LabView, TheoryView
│   │   ├── /hooks           # useChat, useMaterials
│   │   ├── /lib             # Supabase Client setup
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── README.md
```

## ⚙️ Setup & Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account with project setup

### Backend Setup

1. Navigate to backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.example .env
```

4. Update `.env` with your credentials:

```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

5. Create Supabase Storage Bucket:
   - Go to your Supabase dashboard
   - Navigate to Storage
   - Create a new bucket named `course-materials`
   - Make it public if you want direct access to files

6. Run the server:

```bash
npm run dev
```

Backend will be running on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

Frontend will be running on `http://localhost:3000`

## 📡 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Endpoints

#### 1. Health Check

```http
GET /
GET /health
```

**Response:**

```json
{
  "success": true,
  "message": "Hello World from Backend!",
  "version": "1.0.0"
}
```

---

#### 2. Upload Course Material

Upload a PDF or code file with automatic text extraction.

```http
POST /api/cms/upload
```

**Headers:**

- `Content-Type: multipart/form-data`

**Body (Form Data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | PDF or code file (max 50MB) |
| `title` | String | Yes | Material title |
| `category` | String | Yes | Either "Theory" or "Lab" |
| `metadata` | JSON String | No | Additional metadata (tags, etc.) |

**Supported File Types:**

- **PDFs:** `.pdf`
- **Code Files:** `.js`, `.jsx`, `.ts`, `.tsx`, `.py`, `.java`, `.c`, `.cpp`, `.h`, `.hpp`
- **Text Files:** `.txt`, `.md`, `.json`, `.xml`, `.html`, `.css`, `.sql`, `.sh`, `.yaml`, `.yml`

**Example Request (cURL):**

```bash
curl -X POST http://localhost:5000/api/cms/upload \
  -F "file=@document.pdf" \
  -F "title=Introduction to AI" \
  -F "category=Theory" \
  -F 'metadata={"tags":["ai","intro","machine-learning"]}'
```

**Example Request (JavaScript):**

```javascript
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("title", "Introduction to AI");
formData.append("category", "Theory");
formData.append("metadata", JSON.stringify({ tags: ["ai", "intro"] }));

const response = await fetch("http://localhost:5000/api/cms/upload", {
  method: "POST",
  body: formData,
});

const data = await response.json();
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Material uploaded successfully!",
  "data": {
    "id": 1,
    "title": "Introduction to AI",
    "category": "Theory",
    "file_url": "https://your-project.supabase.co/storage/v1/object/public/course-materials/1706511234567_document.pdf",
    "content_text_length": 15432,
    "content_text_preview": "Introduction to Artificial Intelligence\n\nChapter 1: What is AI?\n\nArtificial Intelligence (AI) is...",
    "metadata": {
      "tags": ["ai", "intro"],
      "originalFilename": "document.pdf",
      "mimetype": "application/pdf",
      "size": 524288,
      "uploadedAt": "2026-01-29T09:30:45.123Z"
    },
    "created_at": "2026-01-29T09:30:45.123Z"
  }
}
```

**Error Responses:**

_400 Bad Request - No file:_

```json
{
  "success": false,
  "error": "No file uploaded. Please provide a file."
}
```

_400 Bad Request - Invalid category:_

```json
{
  "success": false,
  "error": "Category must be either \"Theory\" or \"Lab\"."
}
```

_400 Bad Request - File too large:_

```json
{
  "success": false,
  "error": "File size too large. Maximum allowed size is 50MB."
}
```

---

#### 3. Get All Materials

Retrieve a list of all uploaded materials with optional filtering.

```http
GET /api/cms/materials
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | String | No | Filter by category: "Theory" or "Lab" |
| `search` | String | No | Search in material titles (case-insensitive) |

**Example Requests:**

```bash
# Get all materials
GET /api/cms/materials

# Get only Theory materials
GET /api/cms/materials?category=Theory

# Search for materials with "AI" in title
GET /api/cms/materials?search=AI

# Combine filters
GET /api/cms/materials?category=Lab&search=Python
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 2,
      "title": "Advanced Python Programming",
      "category": "Lab",
      "file_url": "https://your-project.supabase.co/storage/v1/object/public/course-materials/1706511345678_python.pdf",
      "metadata": {
        "tags": ["python", "programming"],
        "originalFilename": "python.pdf",
        "mimetype": "application/pdf",
        "size": 1048576
      },
      "created_at": "2026-01-29T10:15:30.123Z"
    },
    {
      "id": 1,
      "title": "Introduction to AI",
      "category": "Theory",
      "file_url": "https://your-project.supabase.co/storage/v1/object/public/course-materials/1706511234567_document.pdf",
      "metadata": {
        "tags": ["ai", "intro"]
      },
      "created_at": "2026-01-29T09:30:45.123Z"
    }
  ]
}
```

---

#### 4. Get Material by ID

Retrieve a single material with full content text.

```http
GET /api/cms/materials/:id
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | Material ID |

**Example Request:**

```bash
GET /api/cms/materials/1
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Introduction to AI",
    "category": "Theory",
    "file_url": "https://your-project.supabase.co/storage/v1/object/public/course-materials/1706511234567_document.pdf",
    "content_text": "Full extracted text content from the PDF or code file...",
    "metadata": {
      "tags": ["ai", "intro"],
      "originalFilename": "document.pdf",
      "mimetype": "application/pdf",
      "size": 524288,
      "uploadedAt": "2026-01-29T09:30:45.123Z"
    },
    "created_at": "2026-01-29T09:30:45.123Z"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "error": "Material not found."
}
```

---

#### 5. Delete Material

Delete a material by ID (removes both database record and file from storage).

```http
DELETE /api/cms/materials/:id
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | Material ID |

**Example Request:**

```bash
DELETE /api/cms/materials/1
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Material deleted successfully."
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "error": "Material not found."
}
```

---

## 🗄️ Database Schema

### Table: `materials`

| Column         | Type      | Constraints   | Description                            |
| -------------- | --------- | ------------- | -------------------------------------- |
| `id`           | int8      | PRIMARY KEY   | Auto-incrementing ID                   |
| `title`        | text      | NOT NULL      | Material title                         |
| `category`     | text      | NOT NULL      | "Theory" or "Lab"                      |
| `file_url`     | text      | NOT NULL      | Public URL to file in Supabase Storage |
| `content_text` | text      |               | Extracted text content from file       |
| `metadata`     | jsonb     |               | Additional metadata (tags, file info)  |
| `created_at`   | timestamp | DEFAULT now() | Creation timestamp                     |

**Create Table SQL:**

```sql
CREATE TABLE materials (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Theory', 'Lab')),
  file_url TEXT NOT NULL,
  content_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for category filtering
CREATE INDEX idx_materials_category ON materials(category);

-- Create index for full-text search on title
CREATE INDEX idx_materials_title ON materials USING gin(to_tsvector('english', title));
```

---

## 🔑 Key Features

### ✅ Content Management System (CMS)

- ✅ Upload PDF and code files
- ✅ Automatic text extraction from PDFs using `pdf-parse`
- ✅ Automatic text extraction from code/text files
- ✅ File storage in Supabase Storage
- ✅ Metadata management with JSONB
- ✅ Category-based organization (Theory/Lab)
- ✅ Full-text search capabilities
- ✅ Robust error handling

### 🔮 Upcoming Features

- RAG (Retrieval-Augmented Generation) for intelligent search
- OpenAI embeddings for semantic search
- Chat interface with AI tutor
- Code linting and analysis
- Interactive labs

---

## 🧪 Testing

### Test Upload Endpoint

Create a test file:

```bash
echo "console.log('Hello World');" > test.js
```

Upload it:

```bash
curl -X POST http://localhost:5000/api/cms/upload \
  -F "file=@test.js" \
  -F "title=Test JavaScript File" \
  -F "category=Lab"
```

### Test Get Materials

```bash
curl http://localhost:5000/api/cms/materials
```

### Test Get Single Material

```bash
curl http://localhost:5000/api/cms/materials/1
```

---

## 📝 Development Notes

### Text Extraction

- **PDFs:** Uses `pdf-parse` library for robust text extraction
- **Code Files:** Converts buffer to UTF-8 string
- **Sanitization:** Removes null bytes, normalizes line endings, reduces excessive whitespace

### File Validation

- Maximum file size: 50MB
- Allowed types: PDFs, code files, text files
- MIME type and extension validation

### Error Handling

- All endpoints use try/catch blocks
- Detailed error messages in development mode
- Graceful degradation (e.g., upload succeeds even if text extraction fails)

---

## 📄 License

MIT

---

## 👥 Contributors

Built for BUET CSE Fest Hackathon
