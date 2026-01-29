/**
 * Role Context
 * Manages user role state (Admin/Student) for the application
 * No authentication - just UI role switching for hackathon demo
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export const ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
};

export function RoleProvider({ children }) {
  // Load role from localStorage or default to student
  const [role, setRole] = useState(() => {
    const saved = localStorage.getItem('userRole');
    return saved || ROLES.STUDENT;
  });

  // Save role to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('userRole', role);
  }, [role]);

  const switchRole = (newRole) => {
    if (Object.values(ROLES).includes(newRole)) {
      setRole(newRole);
    }
  };

  const isAdmin = role === ROLES.ADMIN;
  const isStudent = role === ROLES.STUDENT;

  const value = {
    role,
    setRole: switchRole,
    isAdmin,
    isStudent,
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
