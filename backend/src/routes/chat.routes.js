/**
 * Chat Routes
 * Part 5: Conversational Chat Interface API Routes
 */

const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chat.controller');

/**
 * @route   POST /api/chat
 * @desc    Process a chat message and get AI response
 * @body    { message: string, conversationId?: string }
 */
router.post('/', chatController.chat);

/**
 * @route   POST /api/chat/new
 * @desc    Start a new conversation
 */
router.post('/new', chatController.newConversation);

/**
 * @route   GET /api/chat/history/:conversationId
 * @desc    Get conversation history
 */
router.get('/history/:conversationId', chatController.getHistory);

/**
 * @route   DELETE /api/chat/history/:conversationId
 * @desc    Clear/delete a conversation
 */
router.delete('/history/:conversationId', chatController.clearHistory);

/**
 * @route   POST /api/chat/search
 * @desc    Quick search course materials
 * @body    { query: string, limit?: number }
 */
router.post('/search', chatController.quickSearch);

/**
 * @route   POST /api/chat/generate
 * @desc    Generate material through chat interface
 * @body    { topic: string, type: 'Theory'|'Lab', conversationId?: string }
 */
router.post('/generate', chatController.generateFromChat);

/**
 * @route   POST /api/chat/summarize
 * @desc    Summarize a material or topic
 * @body    { materialId?: number, query?: string }
 */
router.post('/summarize', chatController.summarizeMaterial);

/**
 * @route   POST /api/chat/download-pdf
 * @desc    Download chat response as PDF
 * @body    { content: string }
 */
router.post('/download-pdf', chatController.downloadAsPDF);

module.exports = router;
