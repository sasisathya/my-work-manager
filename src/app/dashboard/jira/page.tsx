'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { JiraIssue } from '@/types/jira';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, Clock, AlertCircle, TrendingUp, Zap, ArrowLeft } from 'lucide-react';
import SetupRequired from '@/components/SetupRequired';

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
  const [configExists, setConfigExists] = useState<boolean | null>(null);

  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = async () => {
    try {
      const response = await fetch('/api/config/check');
      const data = await response.json();
      setConfigExists(data.configured);

      if (data.configured) {
        fetchIssues();
      } else {
        setLoading(false);
      }
    } catch (err) {
      setConfigExists(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (configExists) {
      fetchIssues();
    }
  }, [configExists]);

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

  // Show setup required if config doesn't exist
  if (configExists === false) {
    return (
      <SetupRequired
        title="Jira Configuration Required"
        message="To use the Jira integration, you need to configure your Jira credentials first."
        feature="Jira integration"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Header Section with Stats */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white">Your Tickets</h1>
            <p className="text-xs text-gray-500">Manage your Jira tickets</p>
          </div>
          <Button
            onClick={fetchIssues}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Compact Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-center">
            <AlertCircle className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-center">
            <Clock className="w-3.5 h-3.5 text-yellow-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-yellow-400">{stats.todo}</p>
            <p className="text-xs text-gray-500">To Do</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-green-400">{stats.inProgress}</p>
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
        </div>
      </div>

      {/* Issues Section */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
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
