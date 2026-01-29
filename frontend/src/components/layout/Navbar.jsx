import React from 'react';
import { Search, Bell, Command } from 'lucide-react';
import { RoleSwitcher } from '../RoleSwitcher';
import { cn } from '../../lib/utils';

export function Navbar({ title = 'Dashboard' }) {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Page Title */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="hidden md:flex items-center">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <input
                type="text"
                placeholder="Quick search..."
                className="w-64 pl-10 pr-12 py-2 text-sm bg-muted/50 border-0 rounded-xl focus:bg-background focus:ring-2 focus:ring-ring focus:outline-none transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-muted-foreground bg-background border border-border rounded shadow-sm">
                <Command className="w-3 h-3" />K
              </kbd>
            </div>
          </div>

          {/* Notifications */}
          <button className="relative p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full ring-2 ring-background" />
          </button>

          {/* Role Switcher */}
          <RoleSwitcher />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
