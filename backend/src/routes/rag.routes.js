/**
 * RAG Routes
 * Endpoints for embedding generation and semantic search
 */

const express = require('express');
const ragController = require('../controllers/rag.controller');

const router = express.Router();

/**
 * @route   POST /api/rag/process/:id
 * @desc    Process a material and generate embeddings
 * @param   id - Material ID to process
 */
router.post('/process/:id', ragController.processMaterial);

/**
 * @route   POST /api/rag/process-all
 * @desc    Process all unprocessed materials
 */
router.post('/process-all', ragController.processAllMaterials);

/**
 * @route   GET /api/rag/status/:id
 * @desc    Get processing status for a material
 * @param   id - Material ID
 */
router.get('/status/:id', ragController.getStatus);

/**
 * @route   POST /api/rag/search
 * @desc    Semantic search across all materials
 * @body    { query: string, threshold?: number, limit?: number }
 */
router.post('/search', ragController.search);

module.exports = router;
