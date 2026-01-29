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
 * @returns {Promise} API response with search results
 */
export const ragSearch = async (query, threshold = 0.5, limit = 10) => {
  const response = await api.post('/rag/search', { query, threshold, limit });
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

/**
 * Send a chat message
 * @param {string} message - User message
 * @param {Array} history - Chat history
 * @returns {Promise} API response with AI reply
 */
export const sendChatMessage = async (message, history = []) => {
  const response = await api.post('/chat', { message, history });
  return response.data;
};

export default api;
