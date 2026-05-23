'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
  const router = useRouter();
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = async () => {
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

  if (loading) {
    return <div className="text-center py-12 text-gray-300">Loading...</div>;
  }

  if (!configured) {
    return (
      <div className="space-y-8">
        <div className="glass-card rounded-3xl p-8 shimmer">
          <h1 className="text-4xl font-bold gradient-text mb-3">Analytics</h1>
          <p className="text-gray-200 text-lg">Insights and metrics for your work performance</p>
        </div>

        <div className="glass-card rounded-3xl p-12 text-center border-yellow-500/40 bg-gradient-to-r from-yellow-500/15 to-orange-500/15">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-4">Configuration Required</h2>
          <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">
            To view Analytics, please configure your Jira credentials first.
          </p>
          <Button
            onClick={() => router.push('/dashboard/settings?highlight=jira')}
            className="glass-button rounded-xl text-lg py-6 px-8"
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            Configure Jira
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card rounded-3xl p-8 shimmer">
        <h1 className="text-4xl font-bold gradient-text mb-3">Analytics</h1>
        <p className="text-gray-200 text-lg">Insights and metrics for your work performance</p>
      </div>

      {/* Coming Soon Section */}
      <div className="glass-card rounded-3xl p-12 text-center glow">
        <div className="relative mb-6">
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-60" />
          <div className="relative">
            <BarChart3 className="w-24 h-24 mx-auto text-blue-400 animate-pulse" />
          </div>
        </div>
        <h2 className="text-3xl font-bold gradient-text mb-4">Coming Soon</h2>
        <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">
          Advanced analytics and reporting features are under development. Track your productivity,
          visualize trends, and gain insights into your work patterns.
        </p>
        <div className="flex justify-center gap-4">
          <div className="glass-card rounded-2xl p-6 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <span className="text-gray-200 font-medium">Performance Charts</span>
          </div>
          <div className="glass-card rounded-2xl p-6 flex items-center gap-3">
            <PieChart className="w-6 h-6 text-purple-400" />
            <span className="text-gray-200 font-medium">Time Distribution</span>
          </div>
          <div className="glass-card rounded-2xl p-6 flex items-center gap-3">
            <Activity className="w-6 h-6 text-pink-400" />
            <span className="text-gray-200 font-medium">Activity Tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
}
