/**
 * Server Entry Point
 * AI Learning Platform - Backend API
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// Middleware
// ============================================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// ============================================
// Routes
// ============================================

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hello World from Backend!',
    version: '1.0.0',
    endpoints: {
      cms: '/api/cms',
    },
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// CMS Routes (Content Management System)
const cmsRoutes = require('./routes/cms.routes');
app.use('/api/cms', cmsRoutes);

// ============================================
// Error Handling
// ============================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log('\n🚀 ================================');
  console.log(`   AI Learning Platform - Backend`);
  console.log('🚀 ================================\n');
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\n   Available endpoints:');
  console.log(`   - GET  /            (Health check)`);
  console.log(`   - GET  /health      (Health status)`);
  console.log(`   - POST /api/cms/upload         (Upload material)`);
  console.log(`   - GET  /api/cms/materials      (List materials)`);
  console.log(`   - GET  /api/cms/materials/:id  (Get material)`);
  console.log(`   - DELETE /api/cms/materials/:id (Delete material)`);
  console.log('\n🚀 ================================\n');
});

module.exports = app;
