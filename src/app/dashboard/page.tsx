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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* GCloud Card - Most Used */}
        <button
          onClick={() => router.push('/dashboard/gcloud')}
          className="glass-card rounded-3xl p-8 glow hover:scale-105 transition-all duration-300 text-left group cursor-pointer"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 blur-2xl bg-cyan-500/30 group-hover:bg-cyan-500/50 transition-all" />
            <div className="relative bg-cyan-500/20 rounded-2xl p-6 group-hover:bg-cyan-500/30 transition-all">
              <Cloud className="w-16 h-16 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 group-hover:gradient-text transition-all">
            GCloud/K8s
          </h2>
          <p className="text-gray-300 mb-4">
            Kubernetes terminal with pod management and log search
          </p>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <span>Open Workspace</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </div>
        </button>

        {/* JIRA Card */}
        <button
          onClick={() => router.push('/dashboard/jira')}
          className="glass-card rounded-3xl p-8 glow hover:scale-105 transition-all duration-300 text-left group cursor-pointer"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 blur-2xl bg-blue-500/30 group-hover:bg-blue-500/50 transition-all" />
            <div className="relative bg-blue-500/20 rounded-2xl p-6 group-hover:bg-blue-500/30 transition-all">
              <Database className="w-16 h-16 text-blue-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 group-hover:gradient-text transition-all">
            JIRA
          </h2>
          <p className="text-gray-300 mb-4">
            Manage your Jira issues with AI-powered enhancements
          </p>
          <div className="flex items-center gap-2 text-blue-400 font-semibold">
            <span>Open Workspace</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </div>
        </button>

        {/* GIT Card */}
        <button
          onClick={() => router.push('/dashboard/pr-review')}
          className="glass-card rounded-3xl p-8 glow hover:scale-105 transition-all duration-300 text-left group cursor-pointer"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 blur-2xl bg-green-500/30 group-hover:bg-green-500/50 transition-all" />
            <div className="relative bg-green-500/20 rounded-2xl p-6 group-hover:bg-green-500/30 transition-all">
              <GitBranch className="w-16 h-16 text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 group-hover:gradient-text transition-all">
            GIT
          </h2>
          <p className="text-gray-300 mb-4">
            Review pull requests with AI-powered code analysis
          </p>
          <div className="flex items-center gap-2 text-green-400 font-semibold">
            <span>Open Workspace</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </div>
        </button>

        {/* File Viewer Card */}
        <button
          onClick={() => router.push('/dashboard/md-editor')}
          className="glass-card rounded-3xl p-8 glow hover:scale-105 transition-all duration-300 text-left group cursor-pointer"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 blur-2xl bg-gray-500/30 group-hover:bg-gray-400/50 transition-all" />
            <div className="relative bg-gray-500/20 rounded-2xl p-6 group-hover:bg-gray-400/30 transition-all">
              <FileEdit className="w-16 h-16 text-gray-300" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 group-hover:gradient-text transition-all">
            File Viewer
          </h2>
          <p className="text-gray-300 mb-4">
            View PDF, Excel, Word files and edit Markdown/HTML with AI
          </p>
          <div className="flex items-center gap-2 text-gray-300 font-semibold">
            <span>Open Workspace</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </div>
        </button>

        {/* My Tasks Card */}
        <button
          onClick={() => router.push('/dashboard/tasks')}
          className="glass-card rounded-3xl p-8 glow hover:scale-105 transition-all duration-300 text-left group cursor-pointer"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 blur-2xl bg-yellow-500/30 group-hover:bg-yellow-500/50 transition-all" />
            <div className="relative bg-yellow-500/20 rounded-2xl p-6 group-hover:bg-yellow-500/30 transition-all">
              <StickyNote className="w-16 h-16 text-yellow-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 group-hover:gradient-text transition-all">
            My Tasks
          </h2>
          <p className="text-gray-300 mb-4">
            Create and manage sticky notes for your tasks
          </p>
          <div className="flex items-center gap-2 text-yellow-400 font-semibold">
            <span>Open Workspace</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </div>
        </button>

        {/* Docker/Kafka Card */}
        <button
          onClick={() => router.push('/dashboard/docker')}
          className="glass-card rounded-3xl p-8 glow hover:scale-105 transition-all duration-300 text-left group cursor-pointer"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 blur-2xl bg-purple-500/30 group-hover:bg-purple-500/50 transition-all" />
            <div className="relative bg-purple-500/20 rounded-2xl p-6 group-hover:bg-purple-500/30 transition-all">
              <Container className="w-16 h-16 text-purple-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 group-hover:gradient-text transition-all">
            Docker/Kafka
          </h2>
          <p className="text-gray-300 mb-4">
            Manage Docker containers and Kafka services with one click
          </p>
          <div className="flex items-center gap-2 text-purple-400 font-semibold">
            <span>Open Workspace</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
}
