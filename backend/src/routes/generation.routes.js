/**
 * AI Material Generation Routes
 * Endpoints for generating Theory and Lab materials using AI
 */

const express = require('express');
const generationController = require('../controllers/generation.controller');

const router = express.Router();

/**
 * @route   POST /api/generate
 * @desc    Generate AI learning material (Theory or Lab)
 * @access  Public (hackathon setup)
 * @body    { topic: string, type: 'Theory' | 'Lab' }
 * 
 * @example
 * POST /api/generate
 * {
 *   "topic": "Binary Search Trees",
 *   "type": "Theory"
 * }
 */
router.post('/', generationController.generateMaterial);

/**
 * @route   GET /api/generate/history
 * @desc    Get all generated materials
 * @access  Public
 * @query   type (optional) - Filter by 'Theory' or 'Lab'
 * @query   limit (optional) - Number of results (default: 20)
 */
router.get('/history', generationController.getGeneratedMaterials);

/**
 * @route   GET /api/generate/:id/pdf
 * @desc    Export generated material as PDF
 * @access  Public
 * @param   id - Generated material ID
 */
router.get('/:id/pdf', generationController.exportMaterialAsPDF);

/**
 * @route   POST /api/generate/:id/validate
 * @desc    Re-validate a generated material
 * @access  Public
 * @param   id - Generated material ID
 */
router.post('/:id/validate', generationController.revalidateMaterial);

/**
 * @route   POST /api/generate/:id/video
 * @desc    Generate video summary for a generated material
 * @access  Public
 * @param   id - Generated material ID
 * @returns Video file (MP4) with audio narration and visual background
 * 
 * @example
 * POST /api/generate/123/video
 * Returns: video/mp4 stream
 */
router.post('/:id/video', generationController.generateVideoSummary);

/**
 * @route   GET /api/generate/:id
 * @desc    Get a specific generated material by ID
 * @access  Public
 * @param   id - Generated material ID
 */
router.get('/:id', generationController.getGeneratedMaterialById);

module.exports = router;
