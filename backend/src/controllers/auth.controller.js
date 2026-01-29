/**
 * Auth Controller
 * Handles simple authentication for students and admin
 */

const supabase = require('../lib/supabase');
const bcrypt = require('bcryptjs');

// Hardcoded admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

/**
 * Register a new student
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { username, password, fullName, email } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    if (username === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Username not allowed',
      });
    }

    // Check if username already exists
    const { data: existing, error: checkError } = await supabase
      .from('students')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new student
    const { data: student, error } = await supabase
      .from('students')
      .insert({
        username,
        password: hashedPassword,
        full_name: fullName || username,
        email: email || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to register user',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: student.id,
        username: student.username,
        fullName: student.full_name,
        role: 'student',
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Login for students and admin
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    // Check for admin login
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: 'admin',
          username: 'admin',
          fullName: 'Administrator',
          role: 'admin',
        },
      });
    }

    // Student login - check database
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !student) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, student.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: student.id,
        username: student.username,
        fullName: student.full_name,
        role: 'student',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get current user info (simple check)
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  // This is a simple implementation - in production you'd use JWT tokens
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
    });
  }

  if (userRole === 'admin') {
    return res.json({
      success: true,
      user: {
        id: 'admin',
        username: 'admin',
        fullName: 'Administrator',
        role: 'admin',
      },
    });
  }

  // Get student info
  const { data: student, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !student) {
    return res.status(401).json({
      success: false,
      error: 'User not found',
    });
  }

  res.json({
    success: true,
    user: {
      id: student.id,
      username: student.username,
      fullName: student.full_name,
      role: 'student',
    },
  });
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
