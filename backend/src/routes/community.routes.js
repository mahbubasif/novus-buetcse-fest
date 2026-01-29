/**
 * Community Routes
 * Handles forum posts and comments endpoints
 */

const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community.controller');

// GET /api/community/students - Get all students for mentions
router.get('/students', communityController.getStudents);

// GET /api/community/posts - Get all forum posts
router.get('/posts', communityController.getPosts);

// GET /api/community/posts/:id - Get a single post with comments
router.get('/posts/:id', communityController.getPostWithComments);

// POST /api/community/posts - Create a new post
router.post('/posts', communityController.createPost);

// POST /api/community/posts/:id/comments - Add a comment to a post
router.post('/posts/:id/comments', communityController.addComment);

// POST /api/community/posts/:id/ai-reply - Generate AI reply
router.post('/posts/:id/ai-reply', communityController.generateAIReply);

// DELETE /api/community/posts/:id - Delete a post
router.delete('/posts/:id', communityController.deletePost);

// DELETE /api/community/comments/:id - Delete a comment
router.delete('/comments/:id', communityController.deleteComment);

module.exports = router;
