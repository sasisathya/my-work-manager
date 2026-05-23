'use client';

import React from 'react';
import { Bell, Search, User, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TopBar() {
  return (
    <div className="fixed top-0 left-64 right-0 h-16 glass-card border-b-2 border-purple-500/30 flex items-center justify-between px-6 z-30">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search tasks, issues, comments..."
            className="glass-input pl-10 h-10 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* AI Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-xs font-medium text-purple-300">AI Active</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-purple-500/10 transition-colors">
          <Bell className="w-5 h-5 text-gray-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
        </button>

        {/* Settings */}
        <button className="p-2 rounded-lg hover:bg-purple-500/10 transition-colors">
          <Settings className="w-5 h-5 text-gray-300" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-purple-500/30">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">Jira User</p>
            <p className="text-xs text-gray-400">Developer</p>
          </div>
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 blur-lg bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-60 transition-opacity" />
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center glow">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
