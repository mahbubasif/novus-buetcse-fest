/**
 * Auth Context
 * Manages user authentication state
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (username, password) => {
    const response = await loginUser(username, password);
    if (response.success) {
      setUser(response.user);
      // Also update the role in RoleContext compatible localStorage
      localStorage.setItem('userRole', response.user.role);
    }
    return response;
  };

  const register = async (userData) => {
    const response = await registerUser(userData);
    if (response.success) {
      setUser(response.user);
      localStorage.setItem('userRole', 'student');
    }
    return response;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.setItem('userRole', 'student');
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin,
    isStudent,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
