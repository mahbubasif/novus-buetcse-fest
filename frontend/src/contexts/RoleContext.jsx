/**
 * Role Context
 * Manages user role state (Admin/Student) for the application
 * Syncs with AuthContext for authenticated role-based access
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const RoleContext = createContext();

export const ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
};

export function RoleProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  
  // Role is now determined by the authenticated user
  const [role, setRoleState] = useState(ROLES.STUDENT);

  // Sync role with authenticated user
  useEffect(() => {
    if (isAuthenticated && user) {
      setRoleState(user.role || ROLES.STUDENT);
      localStorage.setItem('userRole', user.role || ROLES.STUDENT);
    } else {
      setRoleState(ROLES.STUDENT);
      localStorage.setItem('userRole', ROLES.STUDENT);
    }
  }, [user, isAuthenticated]);

  // Only allow role switching if user is actually an admin
  const switchRole = (newRole) => {
    // Students cannot switch to admin role
    if (user?.role !== ROLES.ADMIN && newRole === ROLES.ADMIN) {
      console.warn('Students cannot access admin view');
      return;
    }
    if (Object.values(ROLES).includes(newRole)) {
      setRoleState(newRole);
      localStorage.setItem('userRole', newRole);
    }
  };

  // Check if user is actually an admin (based on auth, not UI state)
  const isActualAdmin = user?.role === ROLES.ADMIN;
  const isAdmin = role === ROLES.ADMIN && isActualAdmin;
  const isStudent = role === ROLES.STUDENT || !isActualAdmin;

  const value = {
    role,
    setRole: switchRole,
    isAdmin,
    isStudent,
    isActualAdmin, // Can user access admin features at all?
    ROLES,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
