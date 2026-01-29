/**
 * Role Switcher Component
 * Dropdown to switch between Admin and Student roles
 */

import React from 'react';
import { ChevronDown, UserCog, GraduationCap } from 'lucide-react';
import { useRole } from '../contexts/RoleContext';

export function RoleSwitcher() {
  const { role, setRole, ROLES, isAdmin } = useRole();
  const [isOpen, setIsOpen] = React.useState(false);

  const roles = [
    { value: ROLES.ADMIN, label: 'Admin Panel', icon: UserCog, color: 'text-purple-600', bg: 'bg-purple-100' },
    { value: ROLES.STUDENT, label: 'Student View', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-100' },
  ];

  const currentRole = roles.find(r => r.value === role);
  const CurrentIcon = currentRole.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
          isAdmin 
            ? 'bg-purple-50 border-purple-200 hover:bg-purple-100' 
            : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
        }`}
      >
        <div className={`p-1.5 rounded-md ${currentRole.bg}`}>
          <CurrentIcon className={`w-4 h-4 ${currentRole.color}`} />
        </div>
        <div className="text-left">
          <p className="text-xs text-gray-500 font-medium">View as</p>
          <p className={`text-sm font-semibold ${currentRole.color}`}>{currentRole.label}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg border border-gray-200 py-1 z-20">
            {roles.map((roleOption) => {
              const Icon = roleOption.icon;
              const isSelected = role === roleOption.value;
              
              return (
                <button
                  key={roleOption.value}
                  onClick={() => {
                    setRole(roleOption.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className={`p-2 rounded-md ${roleOption.bg}`}>
                    <Icon className={`w-4 h-4 ${roleOption.color}`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`text-sm font-semibold ${isSelected ? roleOption.color : 'text-gray-700'}`}>
                      {roleOption.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {roleOption.value === ROLES.ADMIN ? 'Manage content & system' : 'Learn & explore materials'}
                    </p>
                  </div>
                  {isSelected && (
                    <div className={`w-2 h-2 rounded-full ${roleOption.bg}`} />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
