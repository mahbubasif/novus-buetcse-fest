/**
 * Handwritten Notes Digitization Routes
 * Endpoints for converting handwritten notes to digital formats using Gemini Vision API
 */

const express = require('express');
const digitizeController = require('../controllers/digitize.controller');

const router = express.Router();

/**
 * @route   POST /api/digitize
 * @desc    Digitize handwritten notes from an image
 * @access  Public (hackathon setup)
 * @body    FormData with:
 *          - image: File (required) - The handwritten notes image
 *          - format: string (optional) - 'markdown' | 'latex' | 'plain' (default: 'markdown')
 *          - subject: string (optional) - Subject context (default: 'general')
 *          - preserveStructure: string (optional) - 'true' | 'false' (default: 'true')
 * 
 * @example
 * POST /api/digitize
 * Content-Type: multipart/form-data
 * - image: [file]
 * - format: "latex"
 * - subject: "mathematics"
 */
router.post('/', digitizeController.upload.single('image'), digitizeController.digitizeNotes);

/**
 * @route   POST /api/digitize/analyze
 * @desc    Analyze handwritten notes image to detect content type and suggest best format
 * @access  Public
 * @body    FormData with:
 *          - image: File (required) - The handwritten notes image
 * 
 * @returns Analysis including:
 *          - detectedSubject
 *          - contentTypes
 *          - suggestedFormat
 *          - hasEquations
 *          - hasDiagrams
 *          - qualityAssessment
 */
router.post('/analyze', digitizeController.upload.single('image'), digitizeController.analyzeNotes);

/**
 * @route   GET /api/digitize/history
 * @desc    Get all digitized notes history
 * @access  Public
 * @query   format (optional) - Filter by 'markdown', 'latex', or 'plain'
 * @query   limit (optional) - Number of results (default: 20)
 */
router.get('/history', digitizeController.getDigitizedHistory);

/**
 * @route   GET /api/digitize/:id
 * @desc    Get a specific digitized note by ID
 * @access  Public
 * @param   id - Digitized note ID
 */
router.get('/:id', digitizeController.getDigitizedNoteById);

/**
 * @route   DELETE /api/digitize/:id
 * @desc    Delete a digitized note by ID
 * @access  Public
 * @param   id - Digitized note ID
 */
router.delete('/:id', digitizeController.deleteDigitizedNote);

module.exports = router;
