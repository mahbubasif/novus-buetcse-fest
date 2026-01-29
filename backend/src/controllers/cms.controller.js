/**
 * CMS Controller
 * Handles file upload, text extraction, and material management
 */

const supabase = require('../lib/supabase');
const pdfParse = require('pdf-parse');
const { getEmbedding } = require('../utils/openai');
const { splitIntoChunks } = require('../utils/chunker');
const { isImageFile, isScannableFile, processHandwrittenNotes } = require('../utils/handwrittenOCR');

// Supported text/code file extensions for direct text extraction
const TEXT_EXTENSIONS = ['.js', '.py', '.txt', '.md', '.c', '.cpp', '.h', '.hpp', '.java', '.ts', '.jsx', '.tsx', '.json', '.xml', '.html', '.css', '.sql', '.sh', '.yaml', '.yml'];

/**
 * Sanitize extracted text by removing null bytes and excessive whitespace
 * @param {string} text - Raw extracted text
 * @returns {string} - Sanitized text
 */
const sanitizeText = (text) => {
  if (!text) return '';

  return text
    .replace(/\0/g, '')           // Remove null bytes
    .replace(/\r\n/g, '\n')       // Normalize line endings
    .replace(/\r/g, '\n')         // Normalize line endings
    .replace(/\n{3,}/g, '\n\n')   // Reduce multiple newlines to double
    .trim();
};

/**
 * Extract text content from a file buffer based on its mimetype
 * @param {Buffer} buffer - File buffer
 * @param {string} mimetype - File MIME type
 * @param {string} originalname - Original filename
 * @returns {Promise<string>} - Extracted text content
 */
const extractTextFromFile = async (buffer, mimetype, originalname) => {
  try {
    // Handle PDF files
    if (mimetype === 'application/pdf') {
      console.log('📄 Extracting text from PDF...');
      const pdfData = await pdfParse(buffer);
      return sanitizeText(pdfData.text);
    }

    // Handle text/code files
    const extension = originalname.substring(originalname.lastIndexOf('.')).toLowerCase();
    const isTextFile = TEXT_EXTENSIONS.includes(extension) ||
      mimetype.startsWith('text/') ||
      mimetype === 'application/json' ||
      mimetype === 'application/javascript';

    if (isTextFile) {
      console.log(`📝 Extracting text from ${extension} file...`);
      return sanitizeText(buffer.toString('utf-8'));
    }

    // Unsupported file type - return empty string but log warning
    console.warn(`⚠️ Unsupported file type for text extraction: ${mimetype} (${extension})`);
    return '';

  } catch (error) {
    console.error('❌ Text extraction error:', error.message);
    throw new Error(`Failed to extract text from file: ${error.message}`);
  }
};

/**
 * Upload material to Supabase Storage and save metadata to database
 * POST /api/cms/upload
 */
const uploadMaterial = async (req, res) => {
  try {
    // ============================================
    // STEP 1: File Validation
    // ============================================
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please provide a file.',
      });
    }

    const { title, category, metadata } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title is required.',
      });
    }

    if (!category || !['Theory', 'Lab'].includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Category must be either "Theory" or "Lab".',
      });
    }

    const file = req.file;
    console.log(`\n📁 Processing upload: ${file.originalname}`);
    console.log(`   Type: ${file.mimetype}, Size: ${(file.size / 1024).toFixed(2)} KB`);

    // ============================================
    // STEP 2: Upload to Supabase Storage
    // ============================================
    let fileUrl;
    try {
      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${timestamp}_${sanitizedFilename}`;

      console.log(`☁️  Uploading to Supabase Storage: ${filePath}`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('❌ Supabase Storage Error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath);

      fileUrl = urlData.publicUrl;
      console.log(`✅ File uploaded successfully: ${fileUrl}`);

    } catch (storageError) {
      console.error('❌ Storage operation failed:', storageError);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload file to storage.',
        details: storageError.message,
      });
    }

    // ============================================
    // STEP 3: Text Extraction (The "Brain" part)
    // ============================================
    let contentText = '';
    let isHandwritten = false;
    let digitizationMetadata = null;

    try {
      // Check if file is an image (potentially handwritten notes)
      if (isImageFile(file.mimetype, file.originalname)) {
        console.log('🖼️ Image detected - processing handwritten notes...');

        try {
          // Process handwritten notes with Gemini Vision
          const ocrResult = await processHandwrittenNotes(
            file.buffer,
            file.mimetype,
            category
          );

          if (ocrResult.success && ocrResult.text) {
            contentText = ocrResult.text;
            isHandwritten = true;
            digitizationMetadata = {
              format: ocrResult.format,
              sourceType: ocrResult.sourceType,
              quality: ocrResult.quality,
              processedBy: ocrResult.metadata.processedBy,
              model: ocrResult.metadata.model,
            };

            console.log(`✅ Handwritten notes digitized successfully!`);
            console.log(`   📊 Quality: ${ocrResult.quality.confidence}`);
            console.log(`   📝 Words: ${ocrResult.quality.wordCount}`);
            console.log(`   🔢 Has formulas: ${ocrResult.quality.hasFormulas ? 'Yes' : 'No'}`);
            console.log(`   💻 Has code: ${ocrResult.quality.hasCode ? 'Yes' : 'No'}`);
          } else {
            console.warn('⚠️ No text extracted from image, treating as regular image');
          }
        } catch (ocrError) {
          console.error('⚠️ Handwritten OCR failed, treating as regular image:', ocrError.message);
          // Continue with empty content - image will still be stored
        }
      } else {
        // Regular file processing (PDF, text, code)
        contentText = await extractTextFromFile(
          file.buffer,
          file.mimetype,
          file.originalname
        );
        console.log(`📖 Extracted ${contentText.length} characters of text`);

        // If PDF extraction returned very little/no text, it might be a scanned handwritten PDF
        if (file.mimetype === 'application/pdf' && contentText.trim().length < 100) {
          console.log('📄 PDF appears to be scanned/handwritten (low text extraction)');
          console.log('   Attempting OCR with Gemini Vision...');

          try {
            const ocrResult = await processHandwrittenNotes(
              file.buffer,
              file.mimetype,
              category
            );

            if (ocrResult.success && ocrResult.text && ocrResult.text.length > contentText.length) {
              console.log(`✅ OCR successful! Extracted ${ocrResult.text.length} characters`);
              contentText = ocrResult.text;
              isHandwritten = true;
              digitizationMetadata = {
                format: ocrResult.format,
                sourceType: 'scanned-pdf',
                quality: ocrResult.quality,
                processedBy: ocrResult.metadata.processedBy,
                model: ocrResult.metadata.model,
              };

              console.log(`   📊 Quality: ${ocrResult.quality.confidence}`);
              console.log(`   📝 Words: ${ocrResult.quality.wordCount}`);
              console.log(`   🔢 Has formulas: ${ocrResult.quality.hasFormulas ? 'Yes' : 'No'}`);
              console.log(`   💻 Has code: ${ocrResult.quality.hasCode ? 'Yes' : 'No'}`);
            }
          } catch (ocrError) {
            console.error('⚠️ PDF OCR failed, keeping original extraction:', ocrError.message);
            // Keep the original (potentially empty) contentText
          }
        }
      }

    } catch (extractionError) {
      console.error('⚠️ Text extraction failed:', extractionError);
      // Continue with empty content_text - don't fail the entire upload
      contentText = '';
    }

    // ============================================
    // STEP 4: Database Insert
    // ============================================
    let insertedRecord;
    try {
      // Parse metadata if it's a string
      let parsedMetadata = {};
      if (metadata) {
        try {
          parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
        } catch (parseError) {
          console.warn('⚠️ Failed to parse metadata, using empty object');
          parsedMetadata = {};
        }
      }

      // Add file info to metadata
      parsedMetadata.originalFilename = file.originalname;
      parsedMetadata.mimetype = file.mimetype;
      parsedMetadata.size = file.size;
      parsedMetadata.uploadedAt = new Date().toISOString();

      // Add digitization metadata if handwritten
      if (isHandwritten && digitizationMetadata) {
        parsedMetadata.handwritten = true;
        parsedMetadata.digitization = digitizationMetadata;
      }

      const { data: dbData, error: dbError } = await supabase
        .from('materials')
        .insert({
          title: title.trim(),
          category: category,
          file_url: fileUrl,
          content_text: contentText,
          metadata: parsedMetadata,
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database Error:', dbError);
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      insertedRecord = dbData;
      console.log(`✅ Record inserted with ID: ${insertedRecord.id}`);

    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save material to database.',
        details: dbError.message,
      });
    }

    // ============================================
    // STEP 5: Auto-process embeddings (async, non-blocking)
    // ============================================
    if (contentText && contentText.length > 50) {
      // Process embeddings in the background without blocking the response
      processEmbeddingsAsync(insertedRecord.id, contentText, insertedRecord.title)
        .catch(err => console.error(`❌ Background embedding failed for ID ${insertedRecord.id}:`, err.message));

      console.log(`🚀 Triggered background embedding generation for material ID: ${insertedRecord.id}`);
    }

    // ============================================
    // STEP 6: Success Response
    // ============================================
    return res.status(201).json({
      success: true,
      message: isHandwritten
        ? 'Handwritten notes uploaded and digitized successfully!'
        : 'Material uploaded successfully!',
      data: {
        id: insertedRecord.id,
        title: insertedRecord.title,
        category: insertedRecord.category,
        file_url: insertedRecord.file_url,
        content_text_length: contentText.length,
        content_text_preview: contentText.substring(0, 200) + (contentText.length > 200 ? '...' : ''),
        metadata: insertedRecord.metadata,
        created_at: insertedRecord.created_at,
        embedding_processing: contentText.length > 50 ? 'started' : 'skipped',
        handwritten: isHandwritten,
        digitization: isHandwritten ? digitizationMetadata : undefined,
      },
    });

  } catch (error) {
    console.error('❌ Unexpected error in uploadMaterial:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred.',
      details: error.message,
    });
  }
};

/**
 * Get all materials with optional filtering
 * GET /api/cms/materials
 */
const getMaterials = async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = supabase
      .from('materials')
      .select('id, title, category, file_url, metadata, created_at')
      .order('created_at', { ascending: false });

    // Apply category filter
    if (category && ['Theory', 'Lab'].includes(category)) {
      query = query.eq('category', category);
    }

    // Apply search filter on title
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      data: data,
    });

  } catch (error) {
    console.error('❌ Error fetching materials:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch materials.',
      details: error.message,
    });
  }
};

/**
 * Get a single material by ID (includes full content_text)
 * GET /api/cms/materials/:id
 */
const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Material not found.',
        });
      }
      throw new Error(error.message);
    }

    return res.status(200).json({
      success: true,
      data: data,
    });

  } catch (error) {
    console.error('❌ Error fetching material:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch material.',
      details: error.message,
    });
  }
};

/**
 * Delete a material by ID
 * DELETE /api/cms/materials/:id
 */
const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    // First get the material to find the file URL
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('file_url, metadata')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Material not found.',
        });
      }
      throw new Error(fetchError.message);
    }

    // Delete from storage if file exists
    if (material.file_url) {
      try {
        const urlParts = material.file_url.split('/');
        const fileName = urlParts[urlParts.length - 1];

        await supabase.storage
          .from('course-materials')
          .remove([fileName]);

        console.log(`🗑️ Deleted file from storage: ${fileName}`);
      } catch (storageError) {
        console.warn('⚠️ Failed to delete file from storage:', storageError.message);
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Material deleted successfully.',
    });

  } catch (error) {
    console.error('❌ Error deleting material:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete material.',
      details: error.message,
    });
  }
};

/**
 * Process embeddings asynchronously in the background
 * @param {number} materialId - Material ID
 * @param {string} contentText - Material content
 * @param {string} title - Material title
 */
const processEmbeddingsAsync = async (materialId, contentText, title) => {
  try {
    console.log(`\n🔄 [Background] Processing embeddings for: "${title}" (ID: ${materialId})`);

    // Split into chunks
    const chunks = splitIntoChunks(contentText, 1000, 100);
    console.log(`   ✂️ Split into ${chunks.length} chunks`);

    if (chunks.length === 0) {
      console.log(`   ⚠️ No chunks to process`);
      return;
    }

    const records = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`   🧠 [${i + 1}/${chunks.length}] Generating embedding...`);

      try {
        const embedding = await getEmbedding(chunk);
        records.push({
          material_id: materialId,
          chunk_text: chunk,
          embedding: embedding,
        });

        // Small delay to avoid rate limits
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (embError) {
        console.error(`   ❌ Failed chunk ${i + 1}:`, embError.message);
        // Continue with other chunks
      }
    }

    if (records.length === 0) {
      console.log(`   ⚠️ No embeddings generated successfully`);
      return;
    }

    // Batch insert
    console.log(`   💾 Storing ${records.length} embeddings...`);
    const { error: insertError } = await supabase
      .from('material_embeddings')
      .insert(records);

    if (insertError) {
      throw insertError;
    }

    console.log(`   ✅ [Background] Successfully processed ${records.length} embeddings for "${title}"`);
  } catch (error) {
    console.error(`   ❌ [Background] Failed to process embeddings:`, error.message);
    throw error;
  }
};

module.exports = {
  uploadMaterial,
  getMaterials,
  getMaterialById,
  deleteMaterial,
};
