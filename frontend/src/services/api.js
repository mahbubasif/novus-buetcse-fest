import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ==================== CMS Endpoints ====================

/**
 * Upload a new material
 * @param {FormData} formData - Form data containing file, title, category, and optional metadata
 * @returns {Promise} API response
 */
export const uploadMaterial = async (formData) => {
  const response = await api.post('/cms/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Get all materials with optional filtering
 * @param {Object} params - Query parameters (category, search)
 * @returns {Promise} API response with materials list
 */
export const getMaterials = async (params = {}) => {
  const response = await api.get('/cms/materials', { params });
  return response.data;
};

/**
 * Get a single material by ID
 * @param {number|string} id - Material ID
 * @returns {Promise} API response with material details
 */
export const getMaterialById = async (id) => {
  const response = await api.get(`/cms/materials/${id}`);
  return response.data;
};

/**
 * Delete a material by ID
 * @param {number|string} id - Material ID
 * @returns {Promise} API response
 */
export const deleteMaterial = async (id) => {
  const response = await api.delete(`/cms/materials/${id}`);
  return response.data;
};

// ==================== Health Check ====================

/**
 * Check API health
 * @returns {Promise} API response
 */
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

// ==================== RAG Endpoints ====================

/**
 * Semantic search materials using RAG
 * @param {string} query - Search query
 * @param {number} threshold - Similarity threshold (0-1)
 * @param {number} limit - Maximum number of results
 * @param {boolean} enhance - Whether to enhance results with AI summaries
 * @returns {Promise} API response with search results
 */
export const ragSearch = async (query, threshold = 0.5, limit = 10, enhance = false) => {
  const response = await api.post('/rag/search', { query, threshold, limit, enhance });
  return response.data;
};

// ==================== Generation Endpoints (Part 3) ====================

/**
 * Generate AI learning material (Theory or Lab)
 * @param {string} topic - The topic to generate material for
 * @param {string} type - 'Theory' or 'Lab'
 * @returns {Promise} API response with generated content
 */
export const generateMaterial = async (topic, type) => {
  const response = await api.post('/generate', { topic, type });
  return response.data;
};

/**
 * Get all generated materials history
 * @param {Object} params - Query parameters (type, limit)
 * @returns {Promise} API response with generated materials list
 */
export const getGeneratedHistory = async (params = {}) => {
  const response = await api.get('/generate/history', { params });
  return response.data;
};

/**
 * Get a single generated material by ID
 * @param {number|string} id - Generated material ID
 * @returns {Promise} API response with generated material details
 */
export const getGeneratedById = async (id) => {
  const response = await api.get(`/generate/${id}`);
  return response.data;
};

/**
 * Export generated material as PDF
 * @param {number|string} id - Generated material ID
 * @returns {Promise} Blob response for PDF download
 */
export const exportGeneratedAsPDF = async (id) => {
  const response = await api.get(`/generate/${id}/pdf`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Re-validate a generated material
 * @param {number|string} id - Generated material ID
 * @returns {Promise} API response with new validation results
 */
export const revalidateMaterial = async (id) => {
  const response = await api.post(`/generate/${id}/validate`);
  return response.data;
};

/**
 * Generate video summary for a generated material
 * @param {number|string} id - Generated material ID
 * @returns {Promise} Blob response for video
 */
export const generateVideoSummary = async (id) => {
  const response = await api.post(`/generate/${id}/video`, {}, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Get YouTube recommendations for a generated material topic
 * @param {number|string} id - Generated material ID
 * @returns {Promise} API response with YouTube search links
 */
export const getYoutubeRecommendations = async (id) => {
  const response = await api.get(`/generate/${id}/youtube`);
  return response.data;
};

/**
 * Process a material to generate embeddings
 * @param {number} materialId - Material ID to process
 * @returns {Promise} API response
 */
export const processMaterial = async (materialId) => {
  const response = await api.post(`/rag/process/${materialId}`);
  return response.data;
};

/**
 * Process all unprocessed materials
 * @returns {Promise} API response
 */
export const processAllMaterials = async () => {
  const response = await api.post('/rag/process-all');
  return response.data;
};

/**
 * Get processing status for a material
 * @param {number} materialId - Material ID
 * @returns {Promise} API response
 */
export const getMaterialStatus = async (materialId) => {
  const response = await api.get(`/rag/status/${materialId}`);
  return response.data;
};

// ==================== Future Endpoints ====================

/**
 * Semantic search materials (Legacy - use ragSearch instead)
 * @param {string} query - Search query
 * @returns {Promise} API response with search results
 */
export const searchMaterials = async (query) => {
  const response = await api.post('/search', { query });
  return response.data;
};

// ==================== Chat Endpoints (Part 5) ====================

/**
 * Send a chat message and get AI response
 * @param {string} message - User message
 * @param {string} conversationId - Optional conversation ID for context
 * @returns {Promise} API response with AI reply
 */
export const sendChatMessage = async (message, conversationId = null) => {
  const response = await api.post('/chat', { message, conversationId });
  return response.data;
};

/**
 * Start a new conversation
 * @returns {Promise} API response with new conversation ID
 */
export const startNewConversation = async () => {
  const response = await api.post('/chat/new');
  return response.data;
};

/**
 * Get conversation history
 * @param {string} conversationId - Conversation ID
 * @returns {Promise} API response with conversation history
 */
export const getChatHistory = async (conversationId) => {
  const response = await api.get(`/chat/history/${conversationId}`);
  return response.data;
};

/**
 * Clear/delete a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise} API response
 */
export const clearChatHistory = async (conversationId) => {
  const response = await api.delete(`/chat/history/${conversationId}`);
  return response.data;
};

/**
 * Quick search course materials via chat
 * @param {string} query - Search query
 * @param {number} limit - Maximum results
 * @returns {Promise} API response with search results
 */
export const chatSearch = async (query, limit = 5) => {
  const response = await api.post('/chat/search', { query, limit });
  return response.data;
};

/**
 * Generate material through chat interface
 * @param {string} topic - Topic to generate
 * @param {string} type - 'Theory' or 'Lab'
 * @param {string} conversationId - Optional conversation ID
 * @returns {Promise} API response with generated content
 */
export const chatGenerate = async (topic, type, conversationId = null) => {
  const response = await api.post('/chat/generate', { topic, type, conversationId });
  return response.data;
};

/**
 * Summarize a material or topic via chat
 * @param {Object} params - { materialId?: number, query?: string }
 * @returns {Promise} API response with summary
 */
export const chatSummarize = async (params) => {
  const response = await api.post('/chat/summarize', params);
  return response.data;
};

/**
 * Download chat response as PDF
 * @param {string} content - Content to convert to PDF
 * @returns {Promise} Blob response for PDF download
 */
export const downloadChatAsPDF = async (content) => {
  const response = await api.post('/chat/download-pdf', { content }, {
    responseType: 'blob',
  });
  return response.data;
};

// ==================== Auth Endpoints ====================

/**
 * Login user (student or admin)
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Promise} API response with user data
 */
export const loginUser = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

/**
 * Register new student
 * @param {Object} userData - { username, password, fullName?, email? }
 * @returns {Promise} API response with user data
 */
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

/**
 * Get current user info
 * @returns {Promise} API response with user data
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export default api;
