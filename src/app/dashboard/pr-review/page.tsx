'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  GitPullRequest,
  AlertTriangle,
  Shield,
  Bug,
  Zap,
  Code,
  CheckCircle2,
  Loader2,
  FileCode,
  MessageSquare,
  Download,
  Send,
  FileText,
  GitBranch,
  User,
  Calendar,
  GitCommit,
  FileDiff,
  Plus,
  Minus,
  FileQuestion,
  ChevronDown
} from 'lucide-react';
import SetupRequired from '@/components/SetupRequired';

interface ReviewCheck {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

export default function PRReviewPage() {
  const [prUrl, setPrUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [reviewResults, setReviewResults] = useState<any>(null);
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [configExists, setConfigExists] = useState<boolean | null>(null);
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set(['whatPRDoes', 'prDescription']));

  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = async () => {
    try {
      const response = await fetch('/api/config/check');
      const data = await response.json();
      setConfigExists(data.configured);
    } catch (err) {
      setConfigExists(false);
    }
  };

  const [checks, setChecks] = useState<ReviewCheck[]>([
    {
      id: 'code-flaws',
      name: 'Code Flaws',
      description: 'Detect logical errors, anti-patterns, and code smells',
      icon: Bug,
      enabled: true,
    },
    {
      id: 'error-handling',
      name: 'Error Handling',
      description: 'Missing try-catch blocks, unhandled promises, edge cases',
      icon: AlertTriangle,
      enabled: true,
    },
    {
      id: 'eslint-issues',
      name: 'ESLint Issues',
      description: 'Code style violations and linting errors',
      icon: Code,
      enabled: true,
    },
    {
      id: 'security',
      name: 'Security Vulnerabilities',
      description: 'SQL injection, XSS, insecure dependencies',
      icon: Shield,
      enabled: true,
    },
    {
      id: 'flow-breaking',
      name: 'Flow Breaking Issues',
      description: 'Dead code, unreachable statements, infinite loops',
      icon: Zap,
      enabled: true,
    },
    {
      id: 'crash-potential',
      name: 'Crash Potential',
      description: 'Null pointer exceptions, undefined references',
      icon: AlertTriangle,
      enabled: true,
    },
  ]);

  const toggleCheck = (id: string) => {
    setChecks(checks.map(check =>
      check.id === id ? { ...check, enabled: !check.enabled } : check
    ));
  };

  const toggleAccordion = (id: string) => {
    const newExpanded = new Set(expandedAccordions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAccordions(newExpanded);
  };

  const handleAnalyze = async () => {
    if (!prUrl) {
      alert('Please enter a GitHub PR URL');
      return;
    }

    const enabledChecks = checks.filter(c => c.enabled);
    if (enabledChecks.length === 0) {
      alert('Please enable at least one check');
      return;
    }

    setAnalyzing(true);
    setReviewResults(null);

    try {
      const response = await fetch('/api/github/review-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prUrl,
          checks: enabledChecks.map(c => c.id),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze PR');
      }

      const data = await response.json();
      setReviewResults(data);
    } catch (error: any) {
      console.error('Analysis error:', error);
      alert(error.message || 'Failed to analyze PR');
    } finally {
      setAnalyzing(false);
    }
  };

  const exportToMarkdown = () => {
    if (!reviewResults) return;

    const { pr, results } = reviewResults;

    let markdown = `# PR Review Report\n\n`;
    markdown += `**PR:** [#${pr.number} - ${pr.title}](${prUrl})\n`;
    markdown += `**Repository:** ${pr.owner}/${pr.repo}\n`;
    markdown += `**Author:** ${pr.author}\n`;
    markdown += `**Branch:** ${pr.branch}\n\n`;
    markdown += `---\n\n`;

    markdown += `## Summary\n\n${results.summary}\n\n`;
    markdown += `**Overall Score:** ${results.overallScore}/10\n\n`;

    if (results.whatThisPRDoes) {
      markdown += `## What This PR Does\n\n${results.whatThisPRDoes}\n\n`;
    }

    if (results.keyChanges && results.keyChanges.length > 0) {
      markdown += `### Key Changes\n\n`;
      results.keyChanges.forEach((change: string) => {
        markdown += `- ${change}\n`;
      });
      markdown += `\n`;
    }

    if (results.positives && results.positives.length > 0) {
      markdown += `## ✅ Positives\n\n`;
      results.positives.forEach((positive: string) => {
        markdown += `- ${positive}\n`;
      });
      markdown += `\n`;
    }

    if (results.issues && results.issues.length > 0) {
      markdown += `## 🔍 Issues Found\n\n`;

      const grouped = results.issues.reduce((acc: any, issue: any) => {
        if (!acc[issue.severity]) acc[issue.severity] = [];
        acc[issue.severity].push(issue);
        return acc;
      }, {});

      ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
        if (grouped[severity]) {
          markdown += `### ${severity} Issues\n\n`;
          grouped[severity].forEach((issue: any) => {
            markdown += `#### ${issue.file}:${issue.line}\n`;
            markdown += `**Category:** ${issue.category}\n\n`;
            markdown += `**Issue:** ${issue.issue}\n\n`;
            markdown += `**Suggestion:** ${issue.suggestion}\n\n`;
            markdown += `---\n\n`;
          });
        }
      });
    }

    if (results.note) {
      markdown += `\n> ${results.note}\n`;
    }

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pr-${pr.number}-review.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyAllResults = async () => {
    if (!reviewResults) return;

    const { pr, results } = reviewResults;

    // Create a comprehensive prompt for LLM to fix the issues
    let content = `# Pull Request Review - Self-Review for Fixes\n\n`;
    content += `I need help fixing all the issues found in my pull request before submitting for review.\n\n`;
    content += `## PR Context\n`;
    content += `- **Repository:** ${pr.owner}/${pr.repo}\n`;
    content += `- **PR #${pr.number}:** ${pr.title}\n`;
    content += `- **Author:** ${pr.author}\n`;
    content += `- **Branch:** ${pr.branch} → ${pr.baseBranch}\n`;
    content += `- **Overall Score:** ${results.overallScore}/10\n\n`;

    if (results.whatThisPRDoes) {
      content += `## What This PR Does\n${results.whatThisPRDoes}\n\n`;
    }

    // Files changed section
    if (pr.files && pr.files.length > 0) {
      content += `## Files Changed (${pr.files.length} files)\n`;
      pr.files.forEach((file: any) => {
        content += `- ${file.filename} (+${file.additions}/-${file.deletions})\n`;
      });
      content += `\n`;
    }

    // Issues section - formatted for LLM to understand and fix
    if (results.issues && results.issues.length > 0) {
      content += `## Issues to Fix (${results.issues.length} total)\n\n`;
      content += `Please review each issue below and provide code fixes:\n\n`;

      const grouped = results.issues.reduce((acc: any, issue: any) => {
        if (!acc[issue.severity]) acc[issue.severity] = [];
        acc[issue.severity].push(issue);
        return acc;
      }, {});

      ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
        if (grouped[severity]) {
          content += `### ${severity} Priority Issues (${grouped[severity].length})\n\n`;
          grouped[severity].forEach((issue: any, idx: number) => {
            content += `**Issue ${idx + 1}:**\n`;
            content += `- **File:** ${issue.file}\n`;
            content += `- **Line:** ${issue.line}\n`;
            content += `- **Category:** ${issue.category}\n`;
            content += `- **Problem:** ${issue.issue}\n`;
            content += `- **Suggestion:** ${issue.suggestion}\n\n`;
          });
        }
      });

      content += `---\n\n`;
      content += `## Instructions\n`;
      content += `Please help me fix these issues by:\n`;
      content += `1. Analyzing each issue in the context of the file and line number\n`;
      content += `2. Providing specific code fixes with before/after examples\n`;
      content += `3. Explaining why each fix is necessary\n`;
      content += `4. Prioritizing CRITICAL and HIGH severity issues first\n`;
      content += `5. Suggesting any additional improvements to make the code production-ready\n\n`;
    } else {
      content += `## No Issues Found! ✅\n\n`;
      content += `The code review found no issues. The PR looks good to submit!\n\n`;
    }

    if (results.positives && results.positives.length > 0) {
      content += `## What's Done Well\n`;
      results.positives.forEach((positive: string) => {
        content += `- ${positive}\n`;
      });
      content += `\n`;
    }

    try {
      await navigator.clipboard.writeText(content);
      alert('Review results copied to clipboard! Paste into Claude/GPT to get fixes.');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard. Please try again.');
    }
  };

  const toggleIssueSelection = (index: number) => {
    const newSelected = new Set(selectedIssues);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIssues(newSelected);
  };

  const selectAllIssues = () => {
    if (!reviewResults?.results?.issues) return;
    const allIndices = new Set<number>(reviewResults.results.issues.map((_: any, idx: number) => idx));
    setSelectedIssues(allIndices);
  };

  const deselectAllIssues = () => {
    setSelectedIssues(new Set());
  };

  const submitSelectedComments = async () => {
    if (!reviewResults || selectedIssues.size === 0) return;

    setSubmitting(true);
    const { pr } = reviewResults;
    const issues = reviewResults.results.issues;
    const selectedIssuesList = Array.from(selectedIssues).map(idx => issues[idx]);

    let successCount = 0;
    let failCount = 0;

    for (const issue of selectedIssuesList) {
      const commentBody = `**${issue.severity}** - ${issue.category}\n\n${issue.issue}\n\n**Suggestion:** ${issue.suggestion}\n\n---\n*Generated by Work Manager PR Review*`;

      try {
        const response = await fetch('/api/github/add-comment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: pr.owner,
            repo: pr.repo,
            prNumber: pr.number,
            comment: commentBody,
            path: issue.file,
            line: issue.line,
            side: 'RIGHT',
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('Error adding comment:', error);
        failCount++;
      }
    }

    setSubmitting(false);
    setSelectedIssues(new Set());
    alert(`Successfully added ${successCount} comment(s) to GitHub PR!${failCount > 0 ? ` (${failCount} failed)` : ''}`);
  };

  const addCommentToGitHub = async (issue: any) => {
    if (!reviewResults) return;

    const { pr } = reviewResults;
    const commentBody = `**${issue.severity}** - ${issue.category}\n\n${issue.issue}\n\n**Suggestion:** ${issue.suggestion}\n\n---\n*Generated by Work Manager PR Review*`;

    try {
      const response = await fetch('/api/github/add-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: pr.owner,
          repo: pr.repo,
          prNumber: pr.number,
          comment: commentBody,
          path: issue.file,
          line: issue.line,
          side: 'RIGHT',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add comment');
      }

      alert('Comment added successfully to GitHub PR!');
    } catch (error: any) {
      console.error('Add comment error:', error);
      alert(error.message || 'Failed to add comment to GitHub');
    }
  };

  // Show setup required if config doesn't exist
  if (configExists === false) {
    return (
      <SetupRequired
        title="GitHub Configuration Required"
        message="To use the PR Review feature, you need to configure your GitHub credentials and AI settings first."
        feature="GitHub PR Review"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Compact Header with URL Input and Checks */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
        <div className="space-y-3">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-gray-400" />
              <h1 className="text-lg font-bold text-white">PR Review</h1>
            </div>
            <p className="text-xs text-gray-500">Code review for GitHub Pull Requests</p>
          </div>

          {/* Input Row */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                id="prUrl"
                type="url"
                placeholder="https://github.com/owner/repo/pull/123"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !analyzing && prUrl && handleAnalyze()}
                className="w-full bg-gray-800 border border-gray-600 text-white placeholder:text-gray-500 h-9 text-sm rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || !prUrl}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-4 h-9 rounded-lg border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap text-sm"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Analyzing
                </>
              ) : (
                <>
                  <FileCode className="w-3 h-3 mr-1" />
                  Analyze
                </>
              )}
            </Button>
          </div>

          {/* Review Checks Row - Compact horizontal layout */}
          <div className="pt-2 border-t border-gray-700">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-semibold">Checks:</span>
              {checks.map((check) => {
                const Icon = check.icon;
                return (
                  <button
                    key={check.id}
                    onClick={() => toggleCheck(check.id)}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer
                      ${check.enabled
                        ? 'bg-gray-700 border border-gray-500 text-white'
                        : 'bg-gray-800 border border-gray-700 text-gray-500 opacity-60 hover:opacity-100'
                      }
                    `}
                    title={check.description}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{check.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {reviewResults && (
        <div className="space-y-4">
          {/* Side by Side Accordions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* What This PR Does Accordion */}
            {reviewResults.results.whatThisPRDoes && (
              <div className="bg-gray-900 border border-gray-600 rounded-xl overflow-hidden shadow-lg">
                <button
                  onClick={() => toggleAccordion('whatPRDoes')}
                  className="w-full flex items-center justify-between gap-2 p-4 hover:bg-gray-850 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-300" />
                    <h2 className="text-lg font-bold text-white">What This PR Does</h2>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                      expandedAccordions.has('whatPRDoes') ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedAccordions.has('whatPRDoes') && (
                  <div className="border-t border-gray-700 px-4 pb-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-3 mt-3">
                      <p className="text-gray-200 text-sm leading-relaxed">{reviewResults.results.whatThisPRDoes}</p>
                    </div>

                    {reviewResults.results.keyChanges && reviewResults.results.keyChanges.length > 0 && (
                      <>
                        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                          <GitCommit className="w-4 h-4 text-gray-400" />
                          Key Changes
                        </h3>
                        <ul className="space-y-1">
                          {reviewResults.results.keyChanges.map((change: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="text-xs">{change}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PR Description Accordion */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleAccordion('prDescription')}
                className="w-full flex items-center justify-between gap-2 p-4 hover:bg-gray-850 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-bold text-white">PR Description</h2>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                    expandedAccordions.has('prDescription') ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              {expandedAccordions.has('prDescription') && (
                <div className="border-t border-gray-700 px-4 pb-4">
                  {reviewResults.pr.description ? (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-3 mt-3">
                      <pre className="text-gray-300 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                        {reviewResults.pr.description}
                      </pre>
                    </div>
                  ) : (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-3 mt-3 flex items-center gap-2">
                      <FileQuestion className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <p className="text-gray-400 italic text-xs">No description provided for this PR</p>
                    </div>
                  )}

                  {/* PR Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-center">
                      <FileDiff className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{reviewResults.pr.stats?.totalFiles || reviewResults.pr.files?.length || 0}</p>
                      <p className="text-xs text-gray-500">Files Changed</p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-center">
                      <Plus className="w-4 h-4 text-green-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-green-400">+{reviewResults.pr.stats?.totalAdditions || 0}</p>
                      <p className="text-xs text-gray-500">Additions</p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-center">
                      <Minus className="w-4 h-4 text-red-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-red-400">-{reviewResults.pr.stats?.totalDeletions || 0}</p>
                      <p className="text-xs text-gray-500">Deletions</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Files Changed Section */}
          {reviewResults.pr.files && reviewResults.pr.files.length > 0 && (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileDiff className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-bold text-white">Files Changed</h2>
              </div>

              <div className="space-y-2">
                {reviewResults.pr.files.map((file: any, idx: number) => (
                  <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileCode className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-mono text-xs truncate">{file.filename}</p>
                        <p className="text-xs text-gray-500 capitalize">{file.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs ml-2 flex-shrink-0">
                      <span className="text-green-400">+{file.additions}</span>
                      <span className="text-red-400">-{file.deletions}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Section - PR Summary */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-gray-400" />
                PR Information
              </h2>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Title</p>
                    <p className="text-white font-medium text-xs">{reviewResults.pr.title}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Author</p>
                    <p className="text-white font-medium text-xs">{reviewResults.pr.author}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <GitBranch className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Branch</p>
                    <p className="text-white font-medium text-xs truncate">{reviewResults.pr.branch} → {reviewResults.pr.baseBranch}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <GitCommit className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Repository</p>
                    <p className="text-white font-medium text-xs">{reviewResults.pr.owner}/{reviewResults.pr.repo}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <h2 className="text-sm font-bold text-white mb-3">Overall Score</h2>
              <div className="flex items-center justify-center">
                <div className="relative w-24 h-24">
                  <svg className="transform -rotate-90 w-24 h-24">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="transparent"
                      className="text-gray-800"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - reviewResults.results.overallScore / 10)}`}
                      className={`${
                        reviewResults.results.overallScore >= 8 ? 'text-gray-400' :
                        reviewResults.results.overallScore >= 6 ? 'text-gray-500' :
                        reviewResults.results.overallScore >= 4 ? 'text-gray-600' :
                        'text-gray-700'
                      } transition-all duration-1000`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {reviewResults.results.overallScore}/10
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-center text-gray-400 mt-2 text-xs">
                {reviewResults.results.overallScore >= 8 ? 'Excellent' :
                 reviewResults.results.overallScore >= 6 ? 'Good' :
                 reviewResults.results.overallScore >= 4 ? 'Needs Work' :
                 'Critical Issues'}
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <h2 className="text-sm font-bold text-white mb-2">Actions</h2>
              <div className="space-y-2">
                <Button
                  onClick={copyAllResults}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg border border-blue-500 transition-colors text-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                  Copy for AI Fix
                </Button>
                <Button
                  onClick={exportToMarkdown}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg border border-gray-600 transition-colors text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Export as Markdown
                </Button>
              </div>
            </div>

            {reviewResults.results.positives && reviewResults.results.positives.length > 0 && (
              <div className="bg-gray-900 border border-gray-600 rounded-xl p-4">
                <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-400" />
                  Positives
                </h2>
                <ul className="space-y-1">
                  {reviewResults.results.positives.map((positive: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5 text-gray-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs">{positive}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Section - Issues */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  Review Results
                </h3>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {reviewResults.results.issues && reviewResults.results.issues.length > 0 && (
                    <div className="flex gap-1.5">
                      <Button
                        onClick={selectAllIssues}
                        className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-0.5 rounded-md border border-gray-600"
                      >
                        Select All
                      </Button>
                      <Button
                        onClick={deselectAllIssues}
                        className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-0.5 rounded-md border border-gray-600"
                      >
                        Deselect
                      </Button>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {reviewResults.results.issues?.length || 0} issue(s)
                    {selectedIssues.size > 0 && ` · ${selectedIssues.size} selected`}
                  </div>
                </div>
              </div>

              <div className="mb-4 p-3 bg-gray-800 border border-gray-700 rounded-lg">
                <p className="text-gray-300 text-sm">{reviewResults.results.summary}</p>
              </div>

              {reviewResults.results.issues && reviewResults.results.issues.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {reviewResults.results.issues.map((issue: any, idx: number) => (
                      <div
                        key={idx}
                        className={`bg-gray-800 rounded-lg p-3 border transition-all ${
                          selectedIssues.has(idx) ? 'border-blue-500 bg-blue-950/20' :
                          issue.severity === 'CRITICAL' ? 'border-red-900 bg-red-950/30' :
                          issue.severity === 'HIGH' ? 'border-orange-900 bg-orange-950/30' :
                          issue.severity === 'MEDIUM' ? 'border-yellow-900 bg-yellow-950/30' :
                          'border-gray-600'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedIssues.has(idx)}
                            onChange={() => toggleIssueSelection(idx)}
                            className="w-4 h-4 mt-0.5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer flex-shrink-0"
                          />
                          <div className="flex items-start gap-2 flex-1">
                            <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              issue.severity === 'CRITICAL' ? 'text-red-400' :
                              issue.severity === 'HIGH' ? 'text-orange-400' :
                              issue.severity === 'MEDIUM' ? 'text-yellow-400' :
                              'text-gray-400'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-bold whitespace-nowrap ${
                                  issue.severity === 'CRITICAL' ? 'bg-red-900 text-red-200' :
                                  issue.severity === 'HIGH' ? 'bg-orange-900 text-orange-200' :
                                  issue.severity === 'MEDIUM' ? 'bg-yellow-900 text-yellow-200' :
                                  'bg-gray-700 text-gray-200'
                                }`}>
                                  {issue.severity}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                                  {issue.category}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mb-1.5">
                                <code className="bg-gray-950 px-1.5 py-0.5 rounded border border-gray-700 text-xs">{issue.file}:{issue.line}</code>
                              </p>
                              <p className="text-white font-medium text-sm mb-1.5">{issue.issue}</p>
                              <div className="bg-gray-950 p-2 rounded border border-gray-700">
                                <p className="text-xs text-gray-500 mb-0.5">Suggestion:</p>
                                <p className="text-xs text-gray-300">{issue.suggestion}</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => addCommentToGitHub(issue)}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-gray-600 transition-colors flex-shrink-0 text-xs"
                            title="Add this comment to GitHub PR"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Add Comment
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedIssues.size > 0 && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        onClick={submitSelectedComments}
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 px-6 rounded-lg border border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            Submitting {selectedIssues.size} comment(s)...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-1.5" />
                            Submit {selectedIssues.size} Comment(s)
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                  <p className="text-lg font-semibold text-white">No issues found</p>
                  <p className="text-gray-400 text-sm mt-1">This PR looks good to merge</p>
                </div>
              )}

              {reviewResults.results.note && (
                <div className="mt-3 p-2.5 bg-gray-800 border border-gray-700 rounded-lg">
                  <p className="text-xs text-gray-400 italic">{reviewResults.results.note}</p>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
