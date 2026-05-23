'use client';

import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { expanded } = useSidebar();

  return (
    <div className="min-h-screen relative">
      {/* Decorative floating orbs - same as setup page */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/30 rounded-full filter blur-3xl animate-pulse float" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-pink-500/25 rounded-full filter blur-3xl animate-pulse float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse float" style={{ animationDelay: '4s' }} />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${expanded ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <TopBar />

        {/* Page Content */}
        <main className="pt-16 p-6 min-h-screen relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
