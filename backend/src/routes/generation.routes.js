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
 * @route   GET /api/generate/:id
 * @desc    Get a specific generated material by ID
 * @access  Public
 * @param   id - Generated material ID
 */
router.get('/:id', generationController.getGeneratedMaterialById);

module.exports = router;
