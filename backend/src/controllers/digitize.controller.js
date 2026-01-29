/**
 * Handwritten Notes Digitization Controller
 * Converts handwritten class notes into structured digital formats using Gemini Vision API
 */

const multer = require('multer');
const supabase = require('../lib/supabase');
const { digitizeHandwrittenNotes, analyzeNotesContent } = require('../utils/gemini');

// Configure multer for memory storage (we'll process the buffer directly)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
    }
  },
});

/**
 * Digitize handwritten notes from an uploaded image
 * POST /api/digitize
 */
const digitizeNotes = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
        details: 'Please upload an image file containing handwritten notes',
      });
    }

    const { format = 'markdown', subject = 'general', preserveStructure = 'true' } = req.body;

    console.log(`\n📝 Digitizing handwritten notes:`);
    console.log(`   - File: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);
    console.log(`   - Format: ${format}`);
    console.log(`   - Subject: ${subject}`);

    // Validate format option
    const validFormats = ['markdown', 'latex', 'plain'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid format',
        details: `Format must be one of: ${validFormats.join(', ')}`,
      });
    }

    // Digitize the notes using Gemini Vision API
    const result = await digitizeHandwrittenNotes(
      req.file.buffer,
      req.file.mimetype,
      {
        format,
        subject,
        preserveStructure: preserveStructure === 'true',
      }
    );

    // Save to database
    const { data: savedRecord, error: saveError } = await supabase
      .from('digitized_notes')
      .insert({
        original_filename: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        output_format: format,
        subject: subject,
        digitized_content: result.content,
        character_count: result.characterCount,
      })
      .select()
      .single();

    if (saveError) {
      console.warn('⚠️ Failed to save to database:', saveError.message);
      // Still return the result even if saving fails
    }

    return res.status(200).json({
      success: true,
      message: 'Notes digitized successfully',
      data: {
        id: savedRecord?.id || null,
        content: result.content,
        format: result.format,
        subject: result.subject,
        characterCount: result.characterCount,
        originalFile: {
          name: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
        },
        savedToDatabase: !saveError,
        createdAt: savedRecord?.created_at || new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Digitization error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to digitize notes',
      details: error.message,
    });
  }
};

/**
 * Analyze handwritten notes image before digitization
 * POST /api/digitize/analyze
 */
const analyzeNotes = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    console.log(`\n🔍 Analyzing handwritten notes: ${req.file.originalname}`);

    const result = await analyzeNotesContent(req.file.buffer, req.file.mimetype);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to analyze notes',
        details: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notes analyzed successfully',
      data: {
        analysis: result.analysis,
        file: {
          name: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
        },
      },
    });

  } catch (error) {
    console.error('❌ Analysis error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze notes',
      details: error.message,
    });
  }
};

/**
 * Get all digitized notes history
 * GET /api/digitize/history
 */
const getDigitizedHistory = async (req, res) => {
  try {
    const { format, limit = 20 } = req.query;

    let query = supabase
      .from('digitized_notes')
      .select('id, original_filename, output_format, subject, character_count, created_at')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (format && ['markdown', 'latex', 'plain'].includes(format)) {
      query = query.eq('output_format', format);
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
    console.error('❌ Error fetching digitized notes history:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch history',
      details: error.message,
    });
  }
};

/**
 * Get a specific digitized note by ID
 * GET /api/digitize/:id
 */
const getDigitizedNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('digitized_notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Digitized note not found',
        });
      }
      throw new Error(error.message);
    }

    return res.status(200).json({
      success: true,
      data: data,
    });

  } catch (error) {
    console.error('❌ Error fetching digitized note:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch digitized note',
      details: error.message,
    });
  }
};

/**
 * Delete a digitized note by ID
 * DELETE /api/digitize/:id
 */
const deleteDigitizedNote = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('digitized_notes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Digitized note deleted successfully',
    });

  } catch (error) {
    console.error('❌ Error deleting digitized note:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete digitized note',
      details: error.message,
    });
  }
};

module.exports = {
  upload,
  digitizeNotes,
  analyzeNotes,
  getDigitizedHistory,
  getDigitizedNoteById,
  deleteDigitizedNote,
};
