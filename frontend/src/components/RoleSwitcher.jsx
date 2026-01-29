/**
 * Role Switcher Component
 * Dropdown to switch between Admin and Student roles
 */

import React from 'react';
import { ChevronDown, UserCog, GraduationCap, Check } from 'lucide-react';
import { useRole } from '../contexts/RoleContext';
import { cn } from '../lib/utils';

export function RoleSwitcher() {
  const { role, setRole, ROLES, isAdmin } = useRole();
  const [isOpen, setIsOpen] = React.useState(false);

  const roles = [
    { value: ROLES.ADMIN, label: 'Admin Panel', icon: UserCog, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
    { value: ROLES.STUDENT, label: 'Student View', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
  ];

  const currentRole = roles.find(r => r.value === role);
  const CurrentIcon = currentRole.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all",
          isAdmin 
            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
            : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
        )}
      >
        <div className={cn("p-1.5 rounded-lg", currentRole.bg)}>
          <CurrentIcon className={cn("w-4 h-4", currentRole.color)} />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">View as</p>
          <p className={cn("text-sm font-semibold -mt-0.5", currentRole.color)}>{currentRole.label}</p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-card shadow-xl border border-border py-2 z-20 animate-fade-in">
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-xs font-medium text-muted-foreground">Switch View Mode</p>
            </div>
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
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 hover:bg-muted/50 transition-colors mx-auto",
                    isSelected && "bg-muted/30"
                  )}
                >
                  <div className={cn("p-2 rounded-lg", roleOption.bg, "border", roleOption.border)}>
                    <Icon className={cn("w-4 h-4", roleOption.color)} />
                  </div>
                  <div className="text-left flex-1">
                    <p className={cn("text-sm font-semibold", isSelected ? roleOption.color : 'text-foreground')}>
                      {roleOption.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {roleOption.value === ROLES.ADMIN ? 'Manage content & system' : 'Learn & explore materials'}
                    </p>
                  </div>
                  {isSelected && (
                    <div className={cn("p-1 rounded-full", roleOption.bg)}>
                      <Check className={cn("w-3 h-3", roleOption.color)} />
                    </div>
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
