import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  FlaskConical,
  GraduationCap,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Smart Search', href: '/search', icon: Search },
  { name: 'AI Chat', href: '/chat', icon: MessageSquare },
  { name: 'Lab Generator', href: '/lab-generator', icon: FlaskConical },
];

const secondaryNav = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

export function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col",
        "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950",
        "border-r border-slate-800/50 transition-all duration-300 ease-in-out",
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/50">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/30">
          <GraduationCap className="w-6 h-6 text-white" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white tracking-tight">Novus</span>
            <span className="text-xs text-slate-500">AI Learning Platform</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <div className={cn(!collapsed && 'px-3', 'mb-4')}>
          {!collapsed && (
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Main Menu
            </span>
          )}
        </div>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                "transition-all duration-200 group",
                collapsed && 'justify-center',
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-white shadow-lg shadow-indigo-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full" />
                )}
                <item.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-colors",
                    isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                  )}
                />
                {!collapsed && <span>{item.name}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-slate-700">
                    {item.name}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* AI Feature Badge */}
      {!collapsed && (
        <div className="mx-3 mb-4 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-white">AI Powered</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enhanced learning with intelligent search & chat
          </p>
        </div>
      )}

      {/* Secondary Navigation */}
      <div className="px-3 py-4 border-t border-slate-800/50">
        {secondaryNav.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                "transition-all duration-200 group",
                collapsed && 'justify-center',
                isActive
                  ? 'bg-slate-800/50 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0 text-slate-500 group-hover:text-slate-300" />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-8 flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-lg"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
}

export default Sidebar;
