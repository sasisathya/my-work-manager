'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Loader2, CheckCircle2, ExternalLink, Sparkles, Database, AlertCircle, HelpCircle, TestTube, GitPullRequest, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Help Tooltip Component
const HelpTooltip = ({ content }: { content: React.ReactNode }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-white cursor-help transition-colors inline-block" />
    </TooltipTrigger>
    <TooltipContent side="right" className="max-w-sm">
      {content}
    </TooltipContent>
  </Tooltip>
);

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightTab = searchParams.get('highlight');

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [githubTesting, setGithubTesting] = useState(false);
  const [githubTestSuccess, setGithubTestSuccess] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestSuccess, setAiTestSuccess] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(highlightTab || 'jira');

  const [formData, setFormData] = useState({
    jiraUrl: '',
    jiraEmail: '',
    jiraToken: '',
    jiraProject: '',
    githubToken: '',
    aiProvider: 'openai',
    aiApiKey: '',
    confluenceUrl: '',
    confluenceEmail: '',
    confluenceToken: '',
    primaryColor: '#FFFFFF',
    secondaryColor: '#000000',
  });

  // Track if tokens were modified
  const [tokenModified, setTokenModified] = useState(false);
  const [githubTokenModified, setGithubTokenModified] = useState(false);
  const [aiKeyModified, setAiKeyModified] = useState(false);
  const [confluenceTokenModified, setConfluenceTokenModified] = useState(false);
  const [confluenceTesting, setConfluenceTesting] = useState(false);
  const [confluenceTestSuccess, setConfluenceTestSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (highlightTab) {
      setActiveTab(highlightTab);
    }
  }, [highlightTab]);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config/get');
      if (response.ok) {
        const data = await response.json();
        if (data.jira) {
          setFormData(prev => ({
            ...prev,
            jiraUrl: data.jira.baseUrl || '',
            jiraEmail: data.jira.email || '',
            jiraToken: data.jira.hasToken ? '••••••••••••••••••••' : '', // Show placeholder if token exists
            jiraProject: data.jira.defaultProject || '',
            githubToken: data.github?.hasToken ? '••••••••••••••••••••' : '', // Show placeholder if GitHub token exists
            aiProvider: data.ai?.provider || 'openai',
            aiApiKey: data.ai?.hasApiKey ? '••••••••••••••••••••' : '', // Show placeholder if API key exists
            confluenceUrl: data.confluence?.baseUrl || '',
            confluenceEmail: data.confluence?.email || '',
            confluenceToken: data.confluence?.hasToken ? '••••••••••••••••••••' : '',
            primaryColor: data.theme?.primaryColor || '#FFFFFF',
            secondaryColor: data.theme?.secondaryColor || '#000000',
          }));
        }
      }
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Track if token fields were modified
    if (name === 'jiraToken') {
      setTokenModified(true);
    }
    if (name === 'githubToken') {
      setGithubTokenModified(true);
    }
    if (name === 'aiApiKey') {
      setAiKeyModified(true);
    }
    if (name === 'confluenceToken') {
      setConfluenceTokenModified(true);
    }

    // Reset test success when credentials change
    if (['jiraUrl', 'jiraEmail', 'jiraToken'].includes(name)) {
      setTestSuccess(false);
    }
    if (name === 'githubToken') {
      setGithubTestSuccess(false);
    }
    if (name === 'aiApiKey' || name === 'aiProvider') {
      setAiTestSuccess(false);
    }
    if (['confluenceUrl', 'confluenceEmail', 'confluenceToken'].includes(name)) {
      setConfluenceTestSuccess(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = {
        jiraUrl: formData.jiraUrl,
        jiraEmail: formData.jiraEmail,
      };

      // If token was modified, send the new token
      // Otherwise, send flag to use existing token from config
      if (tokenModified) {
        payload.jiraToken = formData.jiraToken;
      } else {
        payload.useExistingToken = true;
      }

      const response = await fetch('/api/jira/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to connect to Jira');
      }

      setTestSuccess(true);
      setSuccess(data.message || 'Connection successful!');
    } catch (err: any) {
      setError(err.message);
      setTestSuccess(false);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveJira = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require test to pass first
    if (!testSuccess) {
      setError('Please test the connection first before saving');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = {
        jiraUrl: formData.jiraUrl,
        jiraEmail: formData.jiraEmail,
        jiraProject: formData.jiraProject,
      };

      // Only include token if it was modified
      if (tokenModified) {
        payload.jiraToken = formData.jiraToken;
      }

      const response = await fetch('/api/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      setSuccess('Jira configuration saved successfully!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = {
        aiProvider: formData.aiProvider,
      };

      // Only include API key if it was modified
      if (aiKeyModified && formData.aiApiKey) {
        payload.aiApiKey = formData.aiApiKey;
      }

      const response = await fetch('/api/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      setSuccess('AI configuration saved successfully!');
      setAiKeyModified(false);
      setAiTestSuccess(false); // Reset test status after save

      // Reload config to show the placeholder for the saved key
      await loadConfig();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestAIConnection = async () => {
    setAiTesting(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = {
        aiProvider: formData.aiProvider,
      };

      // If API key was modified, send the new key
      // Otherwise, send flag to use existing key from config
      if (aiKeyModified) {
        payload.aiApiKey = formData.aiApiKey;
      } else {
        payload.useExistingKey = true;
      }

      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to connect to AI provider');
      }

      setAiTestSuccess(true);
      setSuccess(data.message || 'AI connection successful!');
    } catch (err: any) {
      setError(err.message);
      setAiTestSuccess(false);
    } finally {
      setAiTesting(false);
    }
  };

  const handleTestGitHubConnection = async () => {
    setGithubTesting(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = {};

      // If token was modified, send the new token
      // Otherwise, send flag to use existing token from config
      if (githubTokenModified) {
        payload.githubToken = formData.githubToken;
      } else {
        payload.useExistingToken = true;
      }

      const response = await fetch('/api/github/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to connect to GitHub');
      }

      setGithubTestSuccess(true);
      setSuccess(data.message || 'GitHub connection successful!');
    } catch (err: any) {
      setError(err.message);
      setGithubTestSuccess(false);
    } finally {
      setGithubTesting(false);
    }
  };

  const handleSaveGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = {};

      // Only include GitHub token if it was modified
      if (githubTokenModified) {
        payload.githubToken = formData.githubToken;
      }

      const response = await fetch('/api/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      setSuccess('GitHub configuration saved successfully!');
      setGithubTokenModified(false);
      setGithubTestSuccess(false); // Reset test status after save
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConfluenceConnection = async () => {
    setConfluenceTesting(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = {
        confluenceUrl: formData.confluenceUrl,
        confluenceEmail: formData.confluenceEmail,
      };

      // If token was modified, send the new token
      // Otherwise, send flag to use existing token from config
      if (confluenceTokenModified) {
        payload.confluenceToken = formData.confluenceToken;
      } else {
        payload.useExistingToken = true;
      }

      const response = await fetch('/api/confluence/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to connect to Confluence');
      }

      setConfluenceTestSuccess(true);
      setSuccess(data.message || 'Connection successful!');
    } catch (err: any) {
      setError(err.message);
      setConfluenceTestSuccess(false);
    } finally {
      setConfluenceTesting(false);
    }
  };

  const handleSaveConfluence = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = {
        confluenceUrl: formData.confluenceUrl,
        confluenceEmail: formData.confluenceEmail,
      };

      // Only include token if it was modified
      if (confluenceTokenModified) {
        payload.confluenceToken = formData.confluenceToken;
      }

      const response = await fetch('/api/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      setSuccess('Confluence configuration saved successfully!');
      setConfluenceTokenModified(false);
      setConfluenceTestSuccess(false); // Reset test status after save
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = {
        theme: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
        },
      };

      const response = await fetch('/api/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save theme configuration');
      }

      setSuccess('Theme colors saved successfully! Refresh the page to see changes.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isJiraConfigured = formData.jiraUrl && formData.jiraEmail;
  const isGitHubConfigured = formData.githubToken && formData.githubToken !== '';
  const isAIConfigured = formData.aiApiKey;
  const isConfluenceConfigured = formData.confluenceUrl && formData.confluenceToken;

  return (
    <TooltipProvider delayDuration={200}>
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card rounded-3xl p-8 shimmer">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-gradient-to-r from-gray-500 to-white opacity-40" />
            <div className="relative glass-button rounded-2xl p-4">
              <Settings className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Settings</h1>
            <p className="text-gray-200 text-lg">Configure your integrations and preferences</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('jira')}
          className={`
            px-6 py-3 rounded-xl font-semibold transition-all duration-300
            ${activeTab === 'jira'
              ? 'glass-button text-white'
              : 'glass-card text-gray-300 hover:text-white'
            }
            ${highlightTab === 'jira' ? 'animate-pulse' : ''}
          `}
        >
          <Database className="w-5 h-5 inline mr-2" />
          Jira Integration
          {isJiraConfigured && <CheckCircle2 className="w-4 h-4 inline ml-2 text-green-400" />}
          {!isJiraConfigured && <AlertCircle className="w-4 h-4 inline ml-2 text-yellow-400" />}
        </button>

        <button
          onClick={() => setActiveTab('github')}
          className={`
            px-6 py-3 rounded-xl font-semibold transition-all duration-300
            ${activeTab === 'github'
              ? 'glass-button text-white'
              : 'glass-card text-gray-300 hover:text-white'
            }
            ${highlightTab === 'github' ? 'animate-pulse' : ''}
          `}
        >
          <GitPullRequest className="w-5 h-5 inline mr-2" />
          GitHub Integration
          {isGitHubConfigured && <CheckCircle2 className="w-4 h-4 inline ml-2 text-green-400" />}
        </button>

        <button
          onClick={() => setActiveTab('confluence')}
          className={`
            px-6 py-3 rounded-xl font-semibold transition-all duration-300
            ${activeTab === 'confluence'
              ? 'glass-button text-white'
              : 'glass-card text-gray-300 hover:text-white'
            }
            ${highlightTab === 'confluence' ? 'animate-pulse' : ''}
          `}
        >
          <FileText className="w-5 h-5 inline mr-2" />
          Confluence
          {isConfluenceConfigured && <CheckCircle2 className="w-4 h-4 inline ml-2 text-green-400" />}
          {!isConfluenceConfigured && <AlertCircle className="w-4 h-4 inline ml-2 text-yellow-400" />}
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`
            px-6 py-3 rounded-xl font-semibold transition-all duration-300
            ${activeTab === 'ai'
              ? 'glass-button text-white'
              : 'glass-card text-gray-300 hover:text-white'
            }
            ${highlightTab === 'ai' ? 'animate-pulse' : ''}
          `}
        >
          <Sparkles className="w-5 h-5 inline mr-2" />
          AI Settings
          {isAIConfigured && <CheckCircle2 className="w-4 h-4 inline ml-2 text-green-400" />}
        </button>

        <button
          onClick={() => setActiveTab('theme')}
          className={`
            px-6 py-3 rounded-xl font-semibold transition-all duration-300
            ${activeTab === 'theme'
              ? 'glass-button text-white'
              : 'glass-card text-gray-300 hover:text-white'
            }
          `}
        >
          <Settings className="w-5 h-5 inline mr-2" />
          Theme
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="glass-card border-green-500/40 bg-gradient-to-r from-green-500/15 to-emerald-500/15 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <p className="text-green-200 font-medium">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="glass-card border-red-500/40 bg-gradient-to-r from-red-500/15 to-red-400/15 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-red-200 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Jira Settings Tab */}
      {activeTab === 'jira' && (
        <div className="glass-card rounded-3xl p-8">
          <form onSubmit={handleSaveJira} className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold gradient-text mb-4">Jira Configuration</h3>
              <p className="text-gray-300 mb-6">Connect to your Atlassian Jira workspace</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="jiraUrl" className="text-gray-100 font-semibold text-base flex items-center gap-2">
                Jira URL <span className="text-gray-300">*</span>
                <HelpTooltip content={
                  <div className="space-y-2">
                    <p className="font-semibold text-white">Your Jira Instance URL</p>
                    <p>The base URL of your Atlassian Jira instance.</p>
                    <p className="text-gray-400">Example: https://your-company.atlassian.net</p>
                    <p className="text-xs text-gray-400 mt-2">Find it in your browser when logged into Jira</p>
                  </div>
                } />
              </Label>
              <Input
                id="jiraUrl"
                name="jiraUrl"
                type="url"
                placeholder="https://your-company.atlassian.net"
                value={formData.jiraUrl}
                onChange={handleChange}
                required
                className="glass-input text-white placeholder:text-gray-400 h-12 text-base rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <Label htmlFor="jiraEmail" className="text-gray-100 font-semibold text-base flex items-center gap-2">
                  Email <span className="text-gray-300">*</span>
                  <HelpTooltip content={
                    <div className="space-y-2">
                      <p className="font-semibold text-white">Your Jira Account Email</p>
                      <p>The email address you use to log into Jira.</p>
                      <p className="text-xs text-gray-400 mt-2">This is used for authentication</p>
                    </div>
                  } />
                </Label>
                <Input
                  id="jiraEmail"
                  name="jiraEmail"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.jiraEmail}
                  onChange={handleChange}
                  required
                  className="glass-input text-white placeholder:text-gray-400 h-12 rounded-xl"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="jiraProject" className="text-gray-100 font-semibold text-base flex items-center gap-2">
                  Project Key
                  <HelpTooltip content={
                    <div className="space-y-3">
                      <p className="font-semibold text-white">Project Key (Optional)</p>
                      <p>A short code (usually 2-10 uppercase letters) that identifies your Jira project.</p>
                      <div className="bg-gray-700/30 p-2 rounded-lg">
                        <p className="text-xs font-semibold text-gray-400 mb-1">Examples:</p>
                        <p className="text-xs">PROJ, DEV, TASK, MYAPP</p>
                      </div>
                      <div className="border-t border-gray-600/40 pt-2">
                        <p className="font-semibold text-white text-sm mb-2">How to find it:</p>
                        <ol className="text-xs space-y-1 list-decimal list-inside">
                          <li>Go to your Jira project</li>
                          <li>Look at any issue (e.g., "PROJ-123")</li>
                          <li>The letters before the dash are your Project Key</li>
                        </ol>
                      </div>
                      <p className="text-xs text-gray-400 italic">Leave empty to fetch issues from all projects</p>
                    </div>
                  } />
                </Label>
                <Input
                  id="jiraProject"
                  name="jiraProject"
                  type="text"
                  placeholder="e.g., PROJ, DEV, TASK"
                  value={formData.jiraProject}
                  onChange={handleChange}
                  className="glass-input text-white placeholder:text-gray-400 h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="jiraToken" className="text-gray-100 font-semibold text-base flex items-center gap-2">
                Personal Access Token (PAT) <span className="text-gray-300">*</span>
                <HelpTooltip content={
                  <div className="space-y-3">
                    <p className="font-semibold text-white">Jira Personal Access Token</p>
                    <p>A secure token used to authenticate API requests to Jira Server/Data Center.</p>
                    <div className="border-t border-gray-600/40 pt-2">
                      <p className="font-semibold text-white text-sm mb-2">How to create one:</p>
                      <ol className="text-xs space-y-1 list-decimal list-inside">
                        <li>Log in to your Jira instance</li>
                        <li>Go to Profile → Personal Access Tokens</li>
                        <li>Click "Create token"</li>
                        <li>Give it a name (e.g., "Work Manager")</li>
                        <li>Set expiration date (optional)</li>
                        <li>Copy the token and paste it here</li>
                      </ol>
                    </div>
                    <p className="text-xs text-gray-400 bg-yellow-500/10 p-2 rounded">⚠️ Save it immediately - you can't view it again!</p>
                    <p className="text-xs text-gray-400 mt-2">Note: For Jira Server/Data Center (internal instances)</p>
                  </div>
                } />
              </Label>
              <Input
                id="jiraToken"
                name="jiraToken"
                type="password"
                placeholder={formData.jiraToken === '••••••••••••••••••••' ? 'Token already saved (enter new to change)' : 'Enter your Personal Access Token'}
                value={formData.jiraToken}
                onChange={handleChange}
                required
                className="glass-input text-white placeholder:text-gray-400 h-12 rounded-xl"
              />
              <p className="text-xs text-gray-400 ml-2">
                Create PAT: Profile → Personal Access Tokens → Create token
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                type="button"
                onClick={handleTestConnection}
                className="glass-button text-white font-bold text-lg py-6 rounded-2xl"
                disabled={testing || !formData.jiraUrl || !formData.jiraEmail || !formData.jiraToken}
              >
                {testing ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Testing Connection...
                  </>
                ) : testSuccess ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 mr-3 text-green-400" />
                    Connection Successful!
                  </>
                ) : (
                  <>
                    <TestTube className="w-6 h-6 mr-3" />
                    Test Connection
                  </>
                )}
              </Button>

              <Button
                type="submit"
                className="glass-button text-white font-bold text-lg py-6 rounded-2xl"
                disabled={loading || !testSuccess}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6 mr-3" />
                    Save Jira Configuration
                  </>
                )}
              </Button>
            </div>

            {!testSuccess && formData.jiraUrl && formData.jiraEmail && formData.jiraToken && (
              <p className="text-center text-sm text-yellow-300">
                ⚠️ Please test the connection before saving
              </p>
            )}
          </form>
        </div>
      )}

      {/* GitHub Settings Tab */}
      {activeTab === 'github' && (
        <div className="glass-card rounded-3xl p-8">
          <form onSubmit={handleSaveGitHub} className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold gradient-text mb-4">GitHub Configuration</h3>
              <p className="text-gray-300 mb-6">Configure GitHub access for PR Review (Optional)</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="githubToken" className="text-gray-100 font-semibold text-base flex items-center gap-2">
                GitHub Personal Access Token
                <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                <HelpTooltip content={
                  <div className="space-y-3">
                    <p className="font-semibold text-white">GitHub Personal Access Token (PAT)</p>
                    <p>Required for accessing private repositories and higher API rate limits.</p>
                    <div className="border-t border-gray-600/40 pt-2">
                      <p className="font-semibold text-white text-sm mb-2">How to create one:</p>
                      <ol className="text-xs space-y-1 list-decimal list-inside">
                        <li>Go to GitHub → Settings → Developer settings</li>
                        <li>Click "Personal access tokens" → "Tokens (classic)"</li>
                        <li>Click "Generate new token (classic)"</li>
                        <li>Give it a name (e.g., "Work Manager PR Review")</li>
                        <li>Select scopes: <code className="bg-gray-700/30 px-1 rounded">repo</code> (for private repos) or <code className="bg-gray-700/30 px-1 rounded">public_repo</code> (public only)</li>
                        <li>Click "Generate token"</li>
                        <li>Copy and paste it here</li>
                      </ol>
                    </div>
                    <div className="bg-yellow-500/10 p-2 rounded">
                      <p className="text-xs text-gray-400">⚠️ Public repositories work without a token, but you'll have lower API rate limits.</p>
                    </div>
                  </div>
                } />
              </Label>
              <Input
                id="githubToken"
                name="githubToken"
                type="password"
                placeholder={formData.githubToken === '••••••••••••••••••••' ? 'Token already saved (enter new to change)' : 'ghp_••••••••••••••••••••'}
                value={formData.githubToken}
                onChange={handleChange}
                className="glass-input text-white placeholder:text-gray-400 h-12 rounded-xl"
              />
              <a
                href="https://github.com/settings/tokens/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-gray-300 flex items-center gap-2 ml-2 transition-colors font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Create GitHub Personal Access Token
                <ExternalLink className="w-3 h-3" />
              </a>
              <p className="text-xs text-gray-400 ml-2">Leave empty if you only need to review public PRs (with rate limits)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                type="button"
                onClick={handleTestGitHubConnection}
                className="glass-button text-white font-bold text-lg py-6 rounded-2xl"
                disabled={githubTesting || !formData.githubToken || formData.githubToken === ''}
              >
                {githubTesting ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Testing Connection...
                  </>
                ) : githubTestSuccess ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 mr-3 text-green-400" />
                    Connection Successful!
                  </>
                ) : (
                  <>
                    <TestTube className="w-6 h-6 mr-3" />
                    Test Connection
                  </>
                )}
              </Button>

              <Button
                type="submit"
                className="glass-button text-white font-bold text-lg py-6 rounded-2xl"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6 mr-3" />
                    Save GitHub Configuration
                  </>
                )}
              </Button>
            </div>

            {githubTestSuccess && formData.githubToken && (
              <p className="text-center text-sm text-green-300">
                ✓ GitHub token verified and ready to use
              </p>
            )}
          </form>
        </div>
      )}

      {/* AI Settings Tab */}
      {activeTab === 'ai' && (
        <div className="glass-card rounded-3xl p-8">
          <form onSubmit={handleSaveAI} className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold gradient-text mb-4">AI Configuration</h3>
              <p className="text-gray-300 mb-6">Enhance comments with AI magic (Optional)</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="aiProvider" className="text-gray-100 font-semibold text-base flex items-center gap-2">
                AI Provider
                <HelpTooltip content={
                  <div className="space-y-2">
                    <p className="font-semibold text-white">Choose Your AI Provider</p>
                    <p>Select which AI service to use for enhancing your Jira comments.</p>
                    <div className="space-y-1 mt-2">
                      <p className="text-xs"><span className="font-semibold text-gray-400">OpenAI (GPT-4):</span> Powerful and well-established</p>
                      <p className="text-xs"><span className="font-semibold text-gray-400">Claude (Anthropic):</span> Advanced reasoning and safety</p>
                    </div>
                  </div>
                } />
              </Label>
              <select
                id="aiProvider"
                name="aiProvider"
                value={formData.aiProvider}
                onChange={handleChange}
                className="glass-input text-white w-full h-12 rounded-xl px-4 text-base font-medium cursor-pointer hover:border-gray-400/50 transition-all"
              >
                <option value="openai" className="bg-slate-900 text-white py-2">🤖 OpenAI (GPT-4)</option>
                <option value="claude" className="bg-slate-900 text-white py-2">✨ Claude (Anthropic)</option>
              </select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="aiApiKey" className="text-gray-100 font-semibold text-base flex items-center gap-2">
                {formData.aiProvider === 'openai' ? 'OpenAI' : 'Claude'} API Key
                <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                <HelpTooltip content={
                  <div className="space-y-3">
                    <p className="font-semibold text-white">{formData.aiProvider === 'openai' ? 'OpenAI' : 'Claude'} API Key</p>
                    <p>Your API key for accessing {formData.aiProvider === 'openai' ? 'OpenAI' : 'Claude'} AI services.</p>
                    <div className="border-t border-gray-600/40 pt-2">
                      <p className="font-semibold text-white text-sm mb-2">How to get your API key:</p>
                      <ol className="text-xs space-y-1 list-decimal list-inside">
                        <li>Click the "Get {formData.aiProvider === 'openai' ? 'OpenAI' : 'Claude'} API key" link below</li>
                        <li>Sign up or log in to your account</li>
                        <li>Navigate to API keys section</li>
                        <li>Create a new API key</li>
                        <li>Copy and paste it here</li>
                      </ol>
                    </div>
                    <p className="text-xs text-gray-400 italic">Leave empty if you don't want to use AI features</p>
                  </div>
                } />
              </Label>
              <Input
                id="aiApiKey"
                name="aiApiKey"
                type="password"
                placeholder={formData.aiApiKey === '••••••••••••••••••••' ? 'API Key already saved (enter new to change)' : 'sk-••••••••••••••••••••'}
                value={formData.aiApiKey}
                onChange={handleChange}
                className="glass-input text-white placeholder:text-gray-400 h-12 rounded-xl"
              />
              {formData.aiProvider === 'openai' ? (
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-gray-300 flex items-center gap-2 ml-2 transition-colors font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  Get OpenAI API key
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-gray-300 flex items-center gap-2 ml-2 transition-colors font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  Get Claude API key
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <p className="text-xs text-gray-400 ml-2">Leave empty to disable AI features</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                type="button"
                onClick={handleTestAIConnection}
                className="glass-button text-white font-bold text-lg py-6 rounded-2xl"
                disabled={aiTesting || !formData.aiApiKey || formData.aiApiKey === ''}
              >
                {aiTesting ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Testing Connection...
                  </>
                ) : aiTestSuccess ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 mr-3 text-green-400" />
                    Connection Successful!
                  </>
                ) : (
                  <>
                    <TestTube className="w-6 h-6 mr-3" />
                    Test Connection
                  </>
                )}
              </Button>

              <Button
                type="submit"
                className="glass-button text-white font-bold text-lg py-6 rounded-2xl"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6 mr-3" />
                    Save AI Configuration
                  </>
                )}
              </Button>
            </div>

            {aiTestSuccess && formData.aiApiKey && (
              <p className="text-center text-sm text-green-300">
                ✓ AI API key verified and ready to use
              </p>
            )}
          </form>
        </div>
      )}

      {/* Confluence Settings Tab */}
      {activeTab === 'confluence' && (
        <div className="glass-card rounded-3xl p-8">
          <form onSubmit={handleSaveConfluence} className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold gradient-text mb-4">Confluence Configuration</h3>
              <p className="text-gray-300 mb-6">Connect to your Atlassian Confluence workspace (Optional)</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="confluenceUrl" className="text-gray-100 font-semibold text-base flex items-center gap-2">
                Confluence URL <span className="text-gray-300">*</span>
                <HelpTooltip content={
                  <div className="space-y-2">
                    <p className="font-semibold text-white">Your Confluence Instance URL</p>
                    <p>The base URL of your Atlassian Confluence instance.</p>
                    <p className="text-gray-400">Example: https://your-company.atlassian.net/wiki</p>
                    <p className="text-xs text-gray-400 mt-2">Find it in your browser when logged into Confluence</p>
                  </div>
                } />
              </Label>
              <Input
                id="confluenceUrl"
                name="confluenceUrl"
                type="url"
                placeholder="https://your-company.atlassian.net/wiki"
                value={formData.confluenceUrl}
                onChange={handleChange}
                className="glass-input text-white placeholder:text-gray-400 h-12 text-base rounded-xl"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="confluenceToken" className="text-gray-100 font-semibold text-base flex items-center gap-2">
                Personal Access Token (PAT) <span className="text-gray-300">*</span>
                <HelpTooltip content={
                  <div className="space-y-3">
                    <p className="font-semibold text-white">Confluence Personal Access Token</p>
                    <p>A secure token (Bearer token) used to authenticate API requests to Confluence Server/Data Center.</p>
                    <div className="border-t border-gray-600/40 pt-2">
                      <p className="font-semibold text-white text-sm mb-2">For Confluence Server/Data Center:</p>
                      <ol className="text-xs space-y-1 list-decimal list-inside">
                        <li>Log in to your Confluence instance</li>
                        <li>Go to Profile → Personal Access Tokens</li>
                        <li>Click "Create token"</li>
                        <li>Give it a name (e.g., "Work Manager")</li>
                        <li>Set expiration (optional)</li>
                        <li>Copy the token and paste it here</li>
                      </ol>
                    </div>
                    <div className="border-t border-gray-600/40 pt-2 mt-2">
                      <p className="font-semibold text-white text-sm mb-2">For Confluence Cloud:</p>
                      <ol className="text-xs space-y-1 list-decimal list-inside">
                        <li>Go to https://id.atlassian.com</li>
                        <li>Security → API tokens → Create</li>
                        <li>Also provide your email below</li>
                      </ol>
                    </div>
                    <p className="text-xs text-gray-400 bg-yellow-500/10 p-2 rounded">⚠️ Save it immediately - you can't view it again!</p>
                  </div>
                } />
              </Label>
              <Input
                id="confluenceToken"
                name="confluenceToken"
                type="password"
                placeholder={formData.confluenceToken === '••••••••••••••••••••' ? 'Token already saved (enter new to change)' : 'Enter your Personal Access Token'}
                value={formData.confluenceToken}
                onChange={handleChange}
                className="glass-input text-white placeholder:text-gray-400 h-12 rounded-xl"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="confluenceEmail" className="text-gray-100 font-semibold text-base flex items-center gap-2">
                Email <span className="text-gray-400 text-sm font-normal">(Optional - only for Cloud)</span>
                <HelpTooltip content={
                  <div className="space-y-2">
                    <p className="font-semibold text-white">Email for Confluence Cloud</p>
                    <p>Only required for Confluence Cloud instances (*.atlassian.net).</p>
                    <p>For Confluence Server/Data Center, leave this blank - the PAT is sufficient.</p>
                    <p className="text-xs text-gray-400 mt-2">Cloud uses Basic Auth (email:token), Server uses Bearer token</p>
                  </div>
                } />
              </Label>
              <Input
                id="confluenceEmail"
                name="confluenceEmail"
                type="email"
                placeholder="Optional - only needed for Confluence Cloud"
                value={formData.confluenceEmail}
                onChange={handleChange}
                className="glass-input text-white placeholder:text-gray-400 h-12 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                type="button"
                onClick={handleTestConfluenceConnection}
                className="glass-button text-white font-bold text-lg py-6 rounded-2xl"
                disabled={confluenceTesting || !formData.confluenceUrl || !formData.confluenceToken}
              >
                {confluenceTesting ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Testing Connection...
                  </>
                ) : confluenceTestSuccess ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 mr-3 text-green-400" />
                    Connection Successful!
                  </>
                ) : (
                  <>
                    <TestTube className="w-6 h-6 mr-3" />
                    Test Connection
                  </>
                )}
              </Button>

              <Button
                type="submit"
                className="glass-button text-white font-bold text-lg py-6 rounded-2xl"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6 mr-3" />
                    Save Confluence Configuration
                  </>
                )}
              </Button>
            </div>

            {confluenceTestSuccess && formData.confluenceToken && (
              <p className="text-center text-sm text-green-300">
                ✓ Confluence token verified and ready to use
              </p>
            )}
          </form>
        </div>
      )}

      {/* Theme Customization Section */}
      {activeTab === 'theme' && (
        <div className="glass-card rounded-3xl p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Theme Customization</h2>
            <p className="text-gray-300 text-base">
              Customize the application's color scheme. Choose two main colors that will be used throughout the interface.
            </p>
          </div>

          <form onSubmit={handleSaveTheme} className="space-y-8">
            <div className="space-y-4">
              <Label htmlFor="primaryColor" className="text-gray-100 font-semibold text-base flex items-center gap-2">
                Primary Color
                <HelpTooltip content={
                  <div className="space-y-2">
                    <p className="font-semibold text-white">Primary Color</p>
                    <p>This color will be used for primary elements like buttons, highlights, and active states.</p>
                    <p className="text-xs text-gray-400 mt-2">Default: White (#FFFFFF)</p>
                  </div>
                } />
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="primaryColor"
                  name="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  className="glass-input h-16 w-24 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="glass-input text-white placeholder:text-gray-400 h-12 rounded-xl flex-1"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="secondaryColor" className="text-gray-100 font-semibold text-base flex items-center gap-2">
                Secondary Color
                <HelpTooltip content={
                  <div className="space-y-2">
                    <p className="font-semibold text-white">Secondary Color</p>
                    <p>This color will be used for secondary elements like backgrounds, borders, and subtle accents.</p>
                    <p className="text-xs text-gray-400 mt-2">Default: Black (#000000)</p>
                  </div>
                } />
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="secondaryColor"
                  name="secondaryColor"
                  type="color"
                  value={formData.secondaryColor}
                  onChange={handleChange}
                  className="glass-input h-16 w-24 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="glass-input text-white placeholder:text-gray-400 h-12 rounded-xl flex-1"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="bg-gray-700/30 p-4 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">
                <strong>Preview:</strong> Your selected colors
              </p>
              <div className="flex gap-4">
                <div className="flex-1 p-4 rounded-lg text-center font-semibold" style={{ backgroundColor: formData.primaryColor, color: formData.secondaryColor }}>
                  Primary Color
                </div>
                <div className="flex-1 p-4 rounded-lg text-center font-semibold" style={{ backgroundColor: formData.secondaryColor, color: formData.primaryColor }}>
                  Secondary Color
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="glass-button text-white font-bold text-lg py-6 rounded-2xl w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6 mr-3" />
                  Save Theme Colors
                </>
              )}
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Note: Theme changes will be applied after saving and refreshing the page.
            </p>
          </form>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-gray-300">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span>🔒 AES-256 encrypted · Stored locally</span>
      </div>
    </div>
    </TooltipProvider>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-12">
        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-gray-300" />
        <p className="text-gray-200 text-lg">Loading settings...</p>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
