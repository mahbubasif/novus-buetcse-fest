/**
 * Auth Routes
 * Handles authentication endpoints
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// POST /api/auth/register - Register new student
router.post('/register', authController.register);

// POST /api/auth/login - Login for students and admin
router.post('/login', authController.login);

// GET /api/auth/me - Get current user
router.get('/me', authController.getCurrentUser);

module.exports = router;
