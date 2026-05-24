'use client';

import React, { useState, useEffect } from 'react';
import { JiraIssue } from '@/types/jira';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { getStatusColor, getPriorityColor, formatDateTime } from '@/lib/utils';
import { Upload, Send, Sparkles, FileText, Loader2, ArrowRight, List, Minimize2, Maximize2, GitPullRequest, ExternalLink } from 'lucide-react';

interface IssueCardProps {
  issue: JiraIssue;
  onUpdate: () => void;
}

interface Transition {
  id: string;
  name: string;
  to: {
    name: string;
  };
}

export const IssueCard = React.memo(function IssueCard({ issue, onUpdate }: IssueCardProps) {
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [loadingTransitions, setLoadingTransitions] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [pr, setPr] = useState<{ number: number; title: string; url: string; state: string } | null>(null);

  // Fetch available transitions and PR on mount
  useEffect(() => {
    fetchTransitions();
    fetchPR();
  }, [issue.key]);

  // Keyboard shortcuts for enhancement
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && !isEnhancing && comment.trim()) {
        switch (e.key.toLowerCase()) {
          case 'p':
            e.preventDefault();
            handleEnhanceText('professional');
            break;
          case 'b':
            e.preventDefault();
            handleEnhanceText('bullet');
            break;
          case 'c':
            e.preventDefault();
            handleEnhanceText('concise');
            break;
          case 'e':
            e.preventDefault();
            handleEnhanceText('expand');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [comment, isEnhancing]);

  const fetchTransitions = async () => {
    setLoadingTransitions(true);
    try {
      const response = await fetch(`/api/jira/transitions?issueKey=${issue.key}`);
      const data = await response.json();

      if (response.ok) {
        setTransitions(data.transitions || []);
      }
    } catch (error) {
      console.error('Error fetching transitions:', error);
    } finally {
      setLoadingTransitions(false);
    }
  };

  const fetchPR = async () => {
    try {
      const response = await fetch(`/api/github/search-pr?issueKey=${issue.key}`);
      const data = await response.json();

      if (data.pr) {
        setPr(data.pr);
      }
    } catch (error) {
      console.error('Error fetching PR:', error);
    }
  };

  const handleTransition = async (transitionId: string) => {
    setUpdatingStatus(true);
    try {
      const response = await fetch('/api/jira/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueKey: issue.key,
          transitionId,
        }),
      });

      if (response.ok) {
        onUpdate(); // Refresh the issue list
      }
    } catch (error) {
      console.error('Error transitioning issue:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleEnhanceText = async (mode: 'professional' | 'bullet' | 'concise' | 'expand' = 'professional') => {
    if (!comment.trim()) return;

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment, mode }),
      });

      const data = await response.json();
      if (data.enhanced) {
        setComment(data.enhanced);
      }
    } catch (error) {
      console.error('Error enhancing text:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleFormatText = async () => {
    if (!comment.trim()) return;

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/ai/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment }),
      });

      const data = await response.json();
      if (data.formatted) {
        setComment(data.formatted);
      }
    } catch (error) {
      console.error('Error formatting text:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim() && files.length === 0) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('issueKey', issue.key);
      formData.append('comment', comment);

      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/jira/update', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setComment('');
        setFiles([]);
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating issue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card rounded-2xl hover:scale-[1.02] transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="gradient-text font-mono font-bold">{issue.key}</span>
              {issue.fields.issuetype?.iconUrl && (
                <img
                  src={issue.fields.issuetype.iconUrl}
                  alt={issue.fields.issuetype.name}
                  className="w-5 h-5"
                />
              )}
            </CardTitle>

            <div className="flex gap-2">
              <Badge className={getStatusColor(issue.fields.status.name)}>
                {issue.fields.status.name}
              </Badge>
              <Badge variant="outline" className="text-gray-200 border-gray-600">
                {issue.fields.issuetype.name}
              </Badge>
            </div>

            {/* Quick Status Transitions */}
            {transitions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {transitions.map((transition) => (
                  <Button
                    key={transition.id}
                    onClick={() => handleTransition(transition.id)}
                    disabled={updatingStatus}
                    className="glass-button rounded-xl text-xs px-3 py-1.5 h-auto font-medium hover:scale-105 transition-transform"
                    size="sm"
                  >
                    {updatingStatus ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3 h-3 mr-1" />
                    )}
                    {transition.to.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 ml-4">
            {pr && (
              <a
                href={pr.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors group"
              >
                <GitPullRequest className="w-4 h-4" />
                <span>PR #{pr.number}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )}
            <div className="text-xs text-gray-400 whitespace-nowrap">
              Updated: {formatDateTime(issue.fields.updated)}
            </div>
            {issue.fields.priority && (
              <div className={getPriorityColor(issue.fields.priority.name)}>
                <img
                  src={issue.fields.priority.iconUrl}
                  alt={issue.fields.priority.name}
                  className="w-5 h-5"
                  title={issue.fields.priority.name}
                />
              </div>
            )}
          </div>
        </div>

        <CardDescription className="font-medium text-base text-gray-100">
          {issue.fields.summary}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <Textarea
            placeholder="Add your thoughts, notes, or updates here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="glass-input min-h-[100px] text-white placeholder:text-gray-400 rounded-xl"
          />

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => handleEnhanceText('professional')}
              disabled={!comment.trim() || isEnhancing}
              className="glass-button rounded-xl text-sm"
              size="sm"
              title="Professional tone (Ctrl+Shift+P)"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Professional
            </Button>

            <Button
              onClick={() => handleEnhanceText('bullet')}
              disabled={!comment.trim() || isEnhancing}
              className="glass-button rounded-xl text-sm"
              size="sm"
              title="Convert to bullet points (Ctrl+Shift+B)"
            >
              <List className="w-4 h-4 mr-2" />
              Bullets
            </Button>

            <Button
              onClick={() => handleEnhanceText('concise')}
              disabled={!comment.trim() || isEnhancing}
              className="glass-button rounded-xl text-sm"
              size="sm"
              title="Make concise (Ctrl+Shift+C)"
            >
              <Minimize2 className="w-4 h-4 mr-2" />
              Concise
            </Button>

            <Button
              onClick={() => handleEnhanceText('expand')}
              disabled={!comment.trim() || isEnhancing}
              className="glass-button rounded-xl text-sm"
              size="sm"
              title="Expand details (Ctrl+Shift+E)"
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Expand
            </Button>

            <div className="flex-1" />

            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <Button className="glass-button rounded-xl text-sm" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload ({files.length})
                </span>
              </Button>
            </label>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || (!comment.trim() && files.length === 0)}
              className="glass-button rounded-xl text-sm"
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              Add Comment
            </Button>
          </div>

          {files.length > 0 && (
            <div className="text-xs text-gray-300">
              Files: {files.map((f) => f.name).join(', ')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
