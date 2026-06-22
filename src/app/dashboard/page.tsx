'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Database, GitBranch, FileEdit, Zap, Settings, ArrowRight, StickyNote, Cloud, Container } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const response = await fetch('/api/config/check');
      const data = await response.json();
      setConfigured(data.configured);
    } catch (err) {
      setConfigured(false);
    } finally {
      setLoading(false);
    }
  };

  if (!configured) {
    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="glass-card rounded-3xl p-8 shimmer">
          <h1 className="text-4xl font-bold gradient-text mb-3">
            Welcome to Work Manager!
          </h1>
          <p className="text-gray-200 text-lg">
            Get started by configuring your integrations
          </p>
        </div>

        {/* Setup Prompt */}
        <div className="glass-card rounded-3xl p-12 text-center glow">
          <div className="relative mb-6">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-gray-500 to-white opacity-40" />
            <div className="relative">
              <Zap className="w-24 h-24 mx-auto text-gray-300 animate-pulse" />
            </div>
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-4">Setup Required</h2>
          <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">
            To start using the work manager, please configure your credentials in Settings.
          </p>
          <Button
            onClick={() => router.push('/dashboard/settings')}
            className="glass-button rounded-xl text-lg py-6 px-8"
          >
            <Settings className="w-6 h-6 mr-3" />
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="glass-card rounded-3xl p-8 shimmer">
        <h1 className="text-4xl font-bold gradient-text mb-3">
          Work Manager Dashboard
        </h1>
        <p className="text-gray-200 text-lg">
          Select a workspace to get started
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* GCloud Card - Most Used */}
        <button
          onClick={() => router.push('/dashboard/gcloud')}
          className="glass-card rounded-2xl p-4 glow hover:scale-105 transition-all duration-300 text-left group cursor-pointer"
        >
          <div className="relative mb-3">
            <div className="absolute inset-0 blur-2xl bg-cyan-500/30 group-hover:bg-cyan-500/50 transition-all" />
            <div className="relative bg-cyan-500/20 rounded-xl p-3 group-hover:bg-cyan-500/30 transition-all">
              <Cloud className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-sm font-bold text-white mb-1 group-hover:gradient-text transition-all">
            GCloud/K8s
          </h2>
          <p className="text-gray-400 text-xs mb-2">
            Kubernetes & pod management
          </p>
          <div className="flex items-center gap-1 text-cyan-400 font-semibold text-xs">
            <span>Open</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* JIRA Card */}
        <button
          onClick={() => router.push('/dashboard/jira')}
          className="glass-card rounded-2xl p-4 glow hover:scale-105 transition-all duration-300 text-left group cursor-pointer"
        >
          <div className="relative mb-3">
            <div className="absolute inset-0 blur-2xl bg-blue-500/30 group-hover:bg-blue-500/50 transition-all" />
            <div className="relative bg-blue-500/20 rounded-xl p-3 group-hover:bg-blue-500/30 transition-all">
              <Database className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <h2 className="text-sm font-bold text-white mb-1 group-hover:gradient-text transition-all">
            JIRA
          </h2>
          <p className="text-gray-400 text-xs mb-2">
            Manage Jira issues
          </p>
          <div className="flex items-center gap-1 text-blue-400 font-semibold text-xs">
            <span>Open</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* GIT Card */}
        <button
          onClick={() => router.push('/dashboard/pr-review')}
          className="glass-card rounded-2xl p-4 glow hover:scale-105 transition-all duration-300 text-left group cursor-pointer"
        >
          <div className="relative mb-3">
            <div className="absolute inset-0 blur-2xl bg-green-500/30 group-hover:bg-green-500/50 transition-all" />
            <div className="relative bg-green-500/20 rounded-xl p-3 group-hover:bg-green-500/30 transition-all">
              <GitBranch className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <h2 className="text-sm font-bold text-white mb-1 group-hover:gradient-text transition-all">
            GIT PR Review
          </h2>
          <p className="text-gray-400 text-xs mb-2">
            Analyze pull requests
          </p>
          <div className="flex items-center gap-1 text-green-400 font-semibold text-xs">
            <span>Open</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* File Viewer Card */}
        <button
          onClick={() => router.push('/dashboard/md-editor')}
          className="glass-card rounded-2xl p-4 glow hover:scale-105 transition-all duration-300 text-left group cursor-pointer"
        >
          <div className="relative mb-3">
            <div className="absolute inset-0 blur-2xl bg-gray-500/30 group-hover:bg-gray-400/50 transition-all" />
            <div className="relative bg-gray-500/20 rounded-xl p-3 group-hover:bg-gray-400/30 transition-all">
              <FileEdit className="w-8 h-8 text-gray-300" />
            </div>
          </div>
          <h2 className="text-sm font-bold text-white mb-1 group-hover:gradient-text transition-all">
            File Editor
          </h2>
          <p className="text-gray-400 text-xs mb-2">
            View & edit files
          </p>
          <div className="flex items-center gap-1 text-gray-300 font-semibold text-xs">
            <span>Open</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* My Tasks Card */}
        <button
          onClick={() => router.push('/dashboard/tasks')}
          className="glass-card rounded-2xl p-4 glow hover:scale-105 transition-all duration-300 text-left group cursor-pointer"
        >
          <div className="relative mb-3">
            <div className="absolute inset-0 blur-2xl bg-yellow-500/30 group-hover:bg-yellow-500/50 transition-all" />
            <div className="relative bg-yellow-500/20 rounded-xl p-3 group-hover:bg-yellow-500/30 transition-all">
              <StickyNote className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <h2 className="text-sm font-bold text-white mb-1 group-hover:gradient-text transition-all">
            My Tasks
          </h2>
          <p className="text-gray-400 text-xs mb-2">
            Manage tasks & notes
          </p>
          <div className="flex items-center gap-1 text-yellow-400 font-semibold text-xs">
            <span>Open</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Docker/Kafka Card */}
        <button
          onClick={() => router.push('/dashboard/docker')}
          className="glass-card rounded-2xl p-4 glow hover:scale-105 transition-all duration-300 text-left group cursor-pointer"
        >
          <div className="relative mb-3">
            <div className="absolute inset-0 blur-2xl bg-purple-500/30 group-hover:bg-purple-500/50 transition-all" />
            <div className="relative bg-purple-500/20 rounded-xl p-3 group-hover:bg-purple-500/30 transition-all">
              <Container className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <h2 className="text-sm font-bold text-white mb-1 group-hover:gradient-text transition-all">
            Docker
          </h2>
          <p className="text-gray-400 text-xs mb-2">
            Manage containers
          </p>
          <div className="flex items-center gap-1 text-purple-400 font-semibold text-xs">
            <span>Open</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
}
