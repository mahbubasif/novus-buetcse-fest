/**
 * CMS Routes
 * Handles all Content Management System endpoints
 */

const express = require('express');
const multer = require('multer');
const cmsController = require('../controllers/cms.controller');

const router = express.Router();

// Configure Multer with memory storage
// We need the buffer for both Supabase upload and text parsing
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allowed MIME types
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/x-python',
      'text/javascript',
      'application/javascript',
      'text/x-c',
      'text/x-c++',
      'text/x-java',
      'application/json',
      'text/html',
      'text/css',
      'text/x-sql',
      'application/x-sh',
      'text/yaml',
      'application/xml',
      'text/xml',
      // Image types for handwritten notes
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ];

    // Also check by extension for better compatibility
    const allowedExtensions = [
      '.pdf', '.txt', '.md', '.py', '.js', '.jsx', '.ts', '.tsx',
      '.c', '.cpp', '.h', '.hpp', '.java', '.json', '.html', '.css',
      '.sql', '.sh', '.yaml', '.yml', '.xml',
      // Image extensions for handwritten notes
      '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'
    ];

    const extension = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype} (${extension})`), false);
    }
  },
});

// Error handling middleware for Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum allowed size is 50MB.',
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  next();
};

/**
 * @route   POST /api/cms/upload
 * @desc    Upload a new course material
 * @access  Public (add auth middleware in production)
 * @body    title (required), category (required: 'Theory' | 'Lab'), metadata (optional JSON)
 * @file    file (required) - PDF or code/text file
 */
router.post('/upload', upload.single('file'), handleMulterError, cmsController.uploadMaterial);

/**
 * @route   GET /api/cms/materials
 * @desc    Get all materials with optional filtering
 * @access  Public
 * @query   category (optional: 'Theory' | 'Lab'), search (optional: search in title)
 */
router.get('/materials', cmsController.getMaterials);

/**
 * @route   GET /api/cms/materials/:id
 * @desc    Get a single material by ID (includes full content_text)
 * @access  Public
 */
router.get('/materials/:id', cmsController.getMaterialById);

/**
 * @route   DELETE /api/cms/materials/:id
 * @desc    Delete a material by ID
 * @access  Public (add auth middleware in production)
 */
router.delete('/materials/:id', cmsController.deleteMaterial);

module.exports = router;
