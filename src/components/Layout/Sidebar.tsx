'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Settings,
  Zap,
  ChevronRight,
  GitPullRequest,
  FileText,
  ChevronLeft,
  ListTodo,
  StickyNote,
  Container,
  User,
  Upload,
  ChevronDown
} from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Tasks', href: '/dashboard/tasks', icon: StickyNote },
  { name: 'GCloud/K8s', href: '/dashboard/gcloud', icon: Zap },
  { name: 'Docker/Kafka', href: '/dashboard/docker', icon: Container },
  { name: 'Jira Tickets', href: '/dashboard/jira', icon: ListTodo },
  { name: 'PR Review', href: '/dashboard/pr-review', icon: GitPullRequest },
  { name: 'File Viewer', href: '/dashboard/md-editor', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { expanded, setExpanded } = useSidebar();
  const [profileExpanded, setProfileExpanded] = useState(false);

  return (
    <div className={`fixed left-0 top-0 h-screen glass-card border-r-2 border-gray-600/30 flex flex-col z-40 transition-all duration-300 ${
      expanded ? 'w-64' : 'w-20'
    }`}>
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-600/20">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-gradient-to-r from-gray-500 to-white opacity-40 animate-pulse" />
              <div className="relative glass-button rounded-2xl p-3 glow">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
            {expanded && (
              <div>
                <h1 className="text-xl font-bold gradient-text">Work Manager</h1>
                <p className="text-xs text-gray-400">Powered by AI</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg hover:bg-gray-600/20 text-gray-400 hover:text-white transition-colors"
          >
            {expanded ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                  ${isActive
                    ? 'glass-button text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-600/20 hover:text-white'
                  }
                  ${!expanded ? 'justify-center' : ''}
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                {expanded && (
                  <>
                    <span className="font-medium flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-1 text-xs font-bold bg-gray-500 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className="w-4 h-4 animate-pulse" />
                    )}
                  </>
                )}
              </Link>
              {/* Tooltip on hover when collapsed */}
              {!expanded && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-gray-600 z-50">
                  {item.name}
                  {item.badge && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-gray-500 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* My Profile Section */}
      <div className="p-4 border-t border-gray-600/20 space-y-3">
        {/* Profile Header */}
        <button
          onClick={() => setProfileExpanded(!profileExpanded)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
            profileExpanded
              ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white'
              : 'text-gray-300 hover:bg-gray-600/20 hover:text-white'
          }`}
        >
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900" />
          </div>
          {expanded && (
            <>
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-white">My Profile</p>
                <p className="text-xs text-gray-400">No resume yet</p>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${profileExpanded ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>

        {/* Profile Expanded Section */}
        {expanded && profileExpanded && (
          <div className="space-y-2 bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
            <Link
              href="/dashboard/my-profile"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-600/30 hover:text-white transition-colors"
            >
              <User className="w-4 h-4" />
              <span>View Profile</span>
            </Link>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-600/30 hover:text-white transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Upload Resume</span>
              <input type="file" accept=".pdf" hidden className="hidden" />
            </label>
          </div>
        )}

        {/* Settings at bottom */}
        <div className="relative group">
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-600/20 hover:text-white transition-all duration-300 ${
              !expanded ? 'justify-center' : ''
            }`}
          >
            <Settings className="w-5 h-5" />
            {expanded && <span className="font-medium">Settings</span>}
          </Link>
          {/* Tooltip on hover when collapsed */}
          {!expanded && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-gray-600 z-50">
              Settings
            </div>
          )}
        </div>
      </div>

      {/* Version info */}
      {expanded && (
        <div className="p-4 text-center">
          <p className="text-xs text-gray-500">v1.0.0</p>
        </div>
      )}
    </div>
  );
}
