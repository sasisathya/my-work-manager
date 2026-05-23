'use client';

import React, { useState } from 'react';
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
  FileQuestion
} from 'lucide-react';

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
    const allIndices = new Set(reviewResults.results.issues.map((_: any, idx: number) => idx));
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <GitPullRequest className="w-8 h-8 text-gray-300" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">PR Review</h1>
            <p className="text-gray-400 text-lg">Code review for GitHub Pull Requests</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
        <div className="space-y-6">
          <div>
            <Label htmlFor="prUrl" className="text-gray-200 font-semibold text-base mb-3 block">
              GitHub Pull Request URL
            </Label>
            <Input
              id="prUrl"
              type="url"
              placeholder="https://github.com/owner/repo/pull/123"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              className="bg-gray-800 border border-gray-600 text-white placeholder:text-gray-500 h-12 text-base rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
            <p className="text-xs text-gray-500 mt-2 ml-2">
              Enter the full URL of the GitHub PR you want to review
            </p>
          </div>
        </div>
      </div>

      {/* Review Checks */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Select Review Checks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checks.map((check) => {
            const Icon = check.icon;
            return (
              <div
                key={check.id}
                onClick={() => toggleCheck(check.id)}
                className={`
                  bg-gray-800 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:bg-gray-750
                  ${check.enabled
                    ? 'border-2 border-gray-500'
                    : 'border border-gray-700 opacity-60 hover:opacity-100'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-1
                    ${check.enabled ? 'bg-gray-600' : 'bg-gray-700'}
                  `}>
                    {check.enabled && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-5 h-5 ${check.enabled ? 'text-gray-300' : 'text-gray-500'}`} />
                      <h3 className={`font-semibold ${check.enabled ? 'text-white' : 'text-gray-400'}`}>
                        {check.name}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500">{check.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analyze Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleAnalyze}
          disabled={analyzing || !prUrl}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg py-6 px-12 rounded-xl border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-6 h-6 mr-3 animate-spin" />
              Analyzing PR...
            </>
          ) : (
            <>
              <FileCode className="w-6 h-6 mr-3" />
              Analyze Pull Request
            </>
          )}
        </Button>
      </div>

      {/* Results Section */}
      {reviewResults && (
        <div className="space-y-8">
          {/* What This PR Does Section */}
          {reviewResults.results.whatThisPRDoes && (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-600 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-7 h-7 text-gray-300" />
                <h2 className="text-2xl font-bold text-white">What This PR Does</h2>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-4">
                <p className="text-gray-200 text-base leading-relaxed">{reviewResults.results.whatThisPRDoes}</p>
              </div>

              {reviewResults.results.keyChanges && reviewResults.results.keyChanges.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <GitCommit className="w-5 h-5 text-gray-400" />
                    Key Changes
                  </h3>
                  <ul className="space-y-2">
                    {reviewResults.results.keyChanges.map((change: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-300">
                        <CheckCircle2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{change}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* PR Description Section */}
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-7 h-7 text-gray-400" />
              <h2 className="text-2xl font-bold text-white">PR Description</h2>
            </div>

            {reviewResults.pr.description ? (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <pre className="text-gray-300 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {reviewResults.pr.description}
                </pre>
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex items-center gap-3">
                <FileQuestion className="w-6 h-6 text-gray-500" />
                <p className="text-gray-400 italic">No description provided for this PR</p>
              </div>
            )}

            {/* PR Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                <FileDiff className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{reviewResults.pr.stats?.totalFiles || reviewResults.pr.files?.length || 0}</p>
                <p className="text-xs text-gray-500">Files Changed</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                <Plus className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-400">+{reviewResults.pr.stats?.totalAdditions || 0}</p>
                <p className="text-xs text-gray-500">Additions</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                <Minus className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-400">-{reviewResults.pr.stats?.totalDeletions || 0}</p>
                <p className="text-xs text-gray-500">Deletions</p>
              </div>
            </div>
          </div>

          {/* Files Changed Section */}
          {reviewResults.pr.files && reviewResults.pr.files.length > 0 && (
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <FileDiff className="w-7 h-7 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Files Changed</h2>
              </div>

              <div className="space-y-3">
                {reviewResults.pr.files.map((file: any, idx: number) => (
                  <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <FileCode className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-mono text-sm truncate">{file.filename}</p>
                        <p className="text-xs text-gray-500 capitalize">{file.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-400">+{file.additions}</span>
                      <span className="text-red-400">-{file.deletions}</span>
                      <span className="text-gray-500">{file.changes} changes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section - PR Summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <GitPullRequest className="w-6 h-6 text-gray-400" />
                PR Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Title</p>
                    <p className="text-white font-medium">{reviewResults.pr.title}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Author</p>
                    <p className="text-white font-medium">{reviewResults.pr.author}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <GitBranch className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Branch</p>
                    <p className="text-white font-medium">{reviewResults.pr.branch} → {reviewResults.pr.baseBranch}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <GitCommit className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Repository</p>
                    <p className="text-white font-medium">{reviewResults.pr.owner}/{reviewResults.pr.repo}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Overall Score</h2>
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-800"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - reviewResults.results.overallScore / 10)}`}
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
                    <span className="text-3xl font-bold text-white">
                      {reviewResults.results.overallScore}/10
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-center text-gray-400 mt-4 text-sm">
                {reviewResults.results.overallScore >= 8 ? 'Excellent' :
                 reviewResults.results.overallScore >= 6 ? 'Good' :
                 reviewResults.results.overallScore >= 4 ? 'Needs Work' :
                 'Critical Issues'}
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Actions</h2>
              <div className="space-y-3">
                <Button
                  onClick={copyAllResults}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl border border-blue-500 transition-colors"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Copy for AI Fix
                </Button>
                <Button
                  onClick={exportToMarkdown}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl border border-gray-600 transition-colors"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export as Markdown
                </Button>
              </div>
            </div>

            {reviewResults.results.positives && reviewResults.results.positives.length > 0 && (
              <div className="bg-gray-900 border border-gray-600 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-gray-400" />
                  Positives
                </h2>
                <ul className="space-y-2">
                  {reviewResults.results.positives.map((positive: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <span className="text-sm">{positive}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Section - Issues */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <MessageSquare className="w-7 h-7 text-gray-400" />
                  Review Results
                </h2>
                <div className="flex items-center gap-3">
                  {reviewResults.results.issues && reviewResults.results.issues.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        onClick={selectAllIssues}
                        className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg border border-gray-600"
                      >
                        Select All
                      </Button>
                      <Button
                        onClick={deselectAllIssues}
                        className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg border border-gray-600"
                      >
                        Deselect All
                      </Button>
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    {reviewResults.results.issues?.length || 0} issue(s) found
                    {selectedIssues.size > 0 && ` · ${selectedIssues.size} selected`}
                  </div>
                </div>
              </div>

              <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-xl">
                <p className="text-gray-300">{reviewResults.results.summary}</p>
              </div>

              {reviewResults.results.issues && reviewResults.results.issues.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {reviewResults.results.issues.map((issue: any, idx: number) => (
                      <div
                        key={idx}
                        className={`bg-gray-800 rounded-xl p-5 border transition-all ${
                          selectedIssues.has(idx) ? 'border-blue-500 bg-blue-950/20' :
                          issue.severity === 'CRITICAL' ? 'border-red-900 bg-red-950/30' :
                          issue.severity === 'HIGH' ? 'border-orange-900 bg-orange-950/30' :
                          issue.severity === 'MEDIUM' ? 'border-yellow-900 bg-yellow-950/30' :
                          'border-gray-600'
                        }`}
                      >
                        <div className="flex items-start gap-4 mb-3">
                          <input
                            type="checkbox"
                            checked={selectedIssues.has(idx)}
                            onChange={() => toggleIssueSelection(idx)}
                            className="w-5 h-5 mt-1 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer"
                          />
                          <div className="flex items-start gap-3 flex-1">
                            <AlertTriangle className={`w-5 h-5 mt-1 flex-shrink-0 ${
                              issue.severity === 'CRITICAL' ? 'text-red-400' :
                              issue.severity === 'HIGH' ? 'text-orange-400' :
                              issue.severity === 'MEDIUM' ? 'text-yellow-400' :
                              'text-gray-400'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                  issue.severity === 'CRITICAL' ? 'bg-red-900 text-red-200' :
                                  issue.severity === 'HIGH' ? 'bg-orange-900 text-orange-200' :
                                  issue.severity === 'MEDIUM' ? 'bg-yellow-900 text-yellow-200' :
                                  'bg-gray-700 text-gray-200'
                                }`}>
                                  {issue.severity}
                                </span>
                                <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-700 text-gray-300">
                                  {issue.category}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400 mb-2">
                                <code className="bg-gray-950 px-2 py-1 rounded border border-gray-700">{issue.file}:{issue.line}</code>
                              </p>
                              <p className="text-white font-medium mb-2">{issue.issue}</p>
                              <div className="bg-gray-950 p-3 rounded-lg border border-gray-700">
                                <p className="text-xs text-gray-500 mb-1">Suggestion:</p>
                                <p className="text-sm text-gray-300">{issue.suggestion}</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => addCommentToGitHub(issue)}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 border border-gray-600 transition-colors"
                            title="Add this comment to GitHub PR"
                          >
                            <Send className="w-4 h-4" />
                            Add Comment
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedIssues.size > 0 && (
                    <div className="mt-6 flex justify-center">
                      <Button
                        onClick={submitSelectedComments}
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 px-8 rounded-xl border border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Submitting {selectedIssues.size} comment(s)...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Submit {selectedIssues.size} Selected Comment(s) to GitHub
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-white">No issues found</p>
                  <p className="text-gray-400 mt-2">This PR looks good to merge</p>
                </div>
              )}

              {reviewResults.results.note && (
                <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-xl">
                  <p className="text-sm text-gray-400 italic">{reviewResults.results.note}</p>
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
