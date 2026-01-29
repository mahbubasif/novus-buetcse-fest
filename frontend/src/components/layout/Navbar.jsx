import React from 'react';
import { Search, Bell } from 'lucide-react';
import { RoleSwitcher } from '../RoleSwitcher';

export function Navbar({ title = 'Dashboard' }) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Page Title */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Quick search..."
                className="w-64 pl-10 pr-4 py-2 text-sm bg-gray-100 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs text-gray-400 bg-gray-200 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Role Switcher */}
          <RoleSwitcher />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
