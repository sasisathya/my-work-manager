'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { JiraIssue } from '@/types/jira';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, Clock, AlertCircle, TrendingUp, Zap, ArrowLeft } from 'lucide-react';

// Dynamic import for IssueCard - reduces initial bundle size
const IssueCard = dynamic(() => import('@/components/IssueCard').then(mod => ({ default: mod.IssueCard })), {
  loading: () => (
    <div className="glass-card rounded-2xl p-6 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
    </div>
  ),
  ssr: false
});

export default function JiraPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/jira/issues');
      if (!response.ok) {
        throw new Error('Failed to fetch issues');
      }
      const data = await response.json();
      setIssues(data.issues);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: issues.length,
    inProgress: issues.filter((i) =>
      i.fields.status.name.toLowerCase().includes('in progress')
    ).length,
    todo: issues.filter(
      (i) =>
        i.fields.status.name.toLowerCase().includes('to do') ||
        i.fields.status.name.toLowerCase().includes('open')
    ).length,
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="glass-card rounded-3xl p-8 shimmer">
        <div className="flex items-center gap-4 mb-4">
          <Button
            onClick={() => router.push('/dashboard')}
            className="glass-button rounded-xl"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Jira Workspace
            </h1>
            <p className="text-gray-200 text-lg">
              Manage your Jira tickets with AI-powered enhancements
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 glow hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-300 mb-1 font-medium">Total Issues</p>
              <p className="text-4xl font-bold gradient-text">{stats.total}</p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-blue-500/50" />
              <div className="relative bg-blue-500/20 rounded-2xl p-4">
                <AlertCircle className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>All assigned tasks</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 glow hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-300 mb-1 font-medium">To Do</p>
              <p className="text-4xl font-bold gradient-text">{stats.todo}</p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-yellow-500/50" />
              <div className="relative bg-yellow-500/20 rounded-2xl p-4">
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Zap className="w-4 h-4" />
            <span>Pending tasks</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 glow hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-300 mb-1 font-medium">In Progress</p>
              <p className="text-4xl font-bold gradient-text">{stats.inProgress}</p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-green-500/50" />
              <div className="relative bg-green-500/20 rounded-2xl p-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>Active work</span>
          </div>
        </div>
      </div>

      {/* Issues Section */}
      <div className="glass-card rounded-3xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold gradient-text">Your Open Issues</h2>
          <Button
            onClick={fetchIssues}
            disabled={loading}
            className="glass-button rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Issues List */}
        {loading && issues.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-gray-300" />
            <p className="text-gray-200 text-lg">Loading your issues...</p>
          </div>
        ) : error ? (
          <div className="glass-card border-red-500/40 bg-gradient-to-r from-red-500/15 to-red-400/15 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <p className="text-red-200 mb-2 font-semibold text-xl">Error loading issues</p>
            <p className="text-red-300 text-sm mb-4">{error}</p>
            <p className="text-gray-300 text-sm mb-6">
              Please check your configuration in Settings.
            </p>
            <Button
              onClick={() => router.push('/dashboard/settings')}
              className="glass-button rounded-xl"
            >
              Go to Settings
            </Button>
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400 animate-bounce" />
            <p className="text-white text-xl font-semibold mb-2 gradient-text">
              All caught up!
            </p>
            <p className="text-gray-300">You have no open issues assigned to you.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} onUpdate={fetchIssues} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
