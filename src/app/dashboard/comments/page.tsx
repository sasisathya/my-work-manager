'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquare, Sparkles, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function CommentsPage() {
  const router = useRouter();
  const [configured, setConfigured] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = async () => {
    try {
      const [configResponse, aiResponse] = await Promise.all([
        fetch('/api/config/check'),
        fetch('/api/config/get'),
      ]);

      const configData = await configResponse.json();
      const aiData = await aiResponse.json();

      setConfigured(configData.configured);
      setAiConfigured(aiData.ai?.enabled && configData.configured);
    } catch (err) {
      setConfigured(false);
      setAiConfigured(false);
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
          <h1 className="text-4xl font-bold gradient-text mb-3">Comments</h1>
          <p className="text-gray-200 text-lg">AI-enhanced collaboration and communication</p>
        </div>

        <div className="glass-card rounded-3xl p-12 text-center border-yellow-500/40 bg-gradient-to-r from-yellow-500/15 to-orange-500/15">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-4">Configuration Required</h2>
          <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">
            To use AI-enhanced Comments, please configure your Jira and AI credentials.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push('/dashboard/settings?highlight=jira')}
              className="glass-button rounded-xl text-lg py-6 px-8"
            >
              Configure Jira
            </Button>
            <Button
              onClick={() => router.push('/dashboard/settings?highlight=ai')}
              className="glass-button rounded-xl text-lg py-6 px-8"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Configure AI
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card rounded-3xl p-8 shimmer">
        <h1 className="text-4xl font-bold gradient-text mb-3">Comments</h1>
        <p className="text-gray-200 text-lg">AI-enhanced collaboration and communication</p>
      </div>

      {/* Coming Soon Section */}
      <div className="glass-card rounded-3xl p-12 text-center glow">
        <div className="relative mb-6">
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-60" />
          <div className="relative">
            <MessageSquare className="w-24 h-24 mx-auto text-pink-400 animate-pulse" />
          </div>
        </div>
        <h2 className="text-3xl font-bold gradient-text mb-4">Coming Soon</h2>
        <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">
          Powerful comment management with AI assistance is in development. Get ready for intelligent
          comment suggestions, sentiment analysis, and automated responses.
        </p>
        <div className="flex justify-center gap-4">
          <div className="glass-card rounded-2xl p-6 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <span className="text-gray-200 font-medium">AI Suggestions</span>
          </div>
          <div className="glass-card rounded-2xl p-6 flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-400" />
            <span className="text-gray-200 font-medium">Team Mentions</span>
          </div>
          <div className="glass-card rounded-2xl p-6 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-pink-400" />
            <span className="text-gray-200 font-medium">Sentiment Analysis</span>
          </div>
        </div>
      </div>
    </div>
  );
}
