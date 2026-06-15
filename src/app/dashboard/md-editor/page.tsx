'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  FolderOpen,
  Loader2,
  Sparkles,
  Save,
  Download,
  Eye,
  Edit3,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileEdit,
  ChevronRight,
  User,
  Bot,
  Send,
  Trash2,
  Check,
  X,
  Clock,
  ChevronLeft,
} from 'lucide-react';

// Confluence-compatible markdown renderer with link URL support
const renderMarkdown = (markdown: string, baseUrl?: string | null): string => {
  if (!markdown) return '';

  let html = markdown;

  // Extract base URL for relative link resolution
  let linkBaseUrl = baseUrl ? new URL(baseUrl).origin : null;

  // Code blocks (must be processed first)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers - Confluence needs proper h1-h6 tags
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr/>');
  html = html.replace(/^\*\*\*$/gm, '<hr/>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Links - convert to anchor links (#) format
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    let finalUrl = url;

    // If URL contains a hash/anchor, extract just the anchor part
    if (url.includes('#')) {
      finalUrl = '#' + url.split('#')[1]; // Get everything after #
    }
    // If URL is relative, convert to anchor format by using it as the hash
    else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Convert path to anchor format: /page/name → #/page/name or just #name
      finalUrl = '#' + url;
    }
    // If it's an absolute URL, extract domain and path as anchor
    else if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        // Use pathname as anchor, removing leading slash
        const pathname = urlObj.pathname.replace(/^\//, '');
        finalUrl = '#' + (pathname || 'top');
      } catch {
        finalUrl = '#link';
      }
    }

    // For anchor links, don't open in new tab
    const isAnchor = finalUrl.startsWith('#');
    return `<a href="${finalUrl}" ${!isAnchor ? 'target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
  });

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0;" />');

  // Lists - ordered
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, (match) => {
    return match.includes('\n') ? `<ol>${match}</ol>` : `<ol>${match}</ol>`;
  });

  // Lists - unordered (handle nested lists)
  const lines = html.split('\n');
  let inList = false;
  let listDepth = 0;
  let processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\s*)[-*+]\s+(.+)$/);

    if (match) {
      const indent = match[1].length;
      const content = match[2];
      const currentDepth = Math.floor(indent / 2);

      if (!inList) {
        processedLines.push('<ul>');
        inList = true;
        listDepth = currentDepth;
      } else if (currentDepth > listDepth) {
        processedLines.push('<ul>');
        listDepth = currentDepth;
      } else if (currentDepth < listDepth) {
        processedLines.push('</ul>');
        listDepth = currentDepth;
      }

      processedLines.push(`<li>${content}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
        listDepth = 0;
      }
      processedLines.push(line);
    }
  }

  if (inList) {
    processedLines.push('</ul>');
  }

  html = processedLines.join('\n');

  // Paragraphs (avoid wrapping already processed elements)
  html = html.replace(/^(?!<[houlpb]|<\/|<code|<pre|<hr)(.+)$/gm, '<p>$1</p>');

  // Line breaks
  html = html.replace(/\n\n/g, '\n');

  return html;
};

const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Convert to Confluence format - just clean HTML for paste
const convertToConfluenceFormat = (markdown: string, baseUrl?: string | null): string => {
  // First render to HTML (with link resolution if baseUrl provided)
  let html = renderMarkdown(markdown, baseUrl);

  // For direct paste into Confluence editor, return clean HTML without wrapper
  // Confluence will automatically format it when pasted
  return html;
};

// Convert to Confluence API format (with storage wrapper)
const convertToConfluenceApiFormat = (markdown: string, baseUrl?: string | null): string => {
  // First render to HTML
  let html = renderMarkdown(markdown, baseUrl);

  // Wrap in ac:rich-text-body for API storage format
  html = `<ac:rich-text-body>${html}</ac:rich-text-body>`;

  return html;
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'approved' | 'rejected';
  suggestedContent?: string;
  originalPrompt?: string;
}

export default function MDEditorPage() {
  const [filePath, setFilePath] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [previewMode, setPreviewMode] = useState(true);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [contentType, setContentType] = useState<'markdown' | 'html'>('markdown');
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null); // Track if loaded from Confluence
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Memoize markdown rendering to prevent recalculation on every render
  const renderedMarkdown = useMemo(() => renderMarkdown(fileContent, sourceUrl), [fileContent, sourceUrl]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Auto-dismiss copy feedback after 2 seconds
  useEffect(() => {
    if (copiedFeedback) {
      const timer = setTimeout(() => setCopiedFeedback(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedFeedback]);

  const handleCopy = async (text: string, feedbackMsg: string, isHtml: boolean = false) => {
    try {
      if (isHtml && navigator.clipboard.write) {
        // Copy as both plain text and HTML to preserve formatting in Confluence
        // while keeping anchor links as #section (not full URLs)
        try {
          const blob = new Blob([text], { type: 'text/html' });
          const plainBlob = new Blob([text], { type: 'text/plain' });
          const data = [
            new ClipboardItem({
              'text/html': blob,
              'text/plain': plainBlob,
            }),
          ];
          await navigator.clipboard.write(data);
        } catch {
          // Fallback to plain text if write fails
          await navigator.clipboard.writeText(text);
        }
      } else {
        // Copy as plain text
        await navigator.clipboard.writeText(text);
      }
      setCopiedFeedback(feedbackMsg);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleReadFile = async () => {
    if (!filePath) {
      setError('Please enter a file path');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if it's a Confluence URL
      const isConfluenceUrl = filePath.includes('/pages/') && (filePath.includes('confluence') || filePath.includes('engconf'));

      if (isConfluenceUrl) {
        // Fetch from Confluence
        const response = await fetch('/api/confluence/fetch-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageUrl: filePath }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch Confluence page');
        }

        setFileContent(data.content);
        setOriginalContent(data.content);
        setContentType('html');
        setSourceUrl(filePath); // Store the Confluence URL for link resolution

        setSuccess(`Confluence page loaded: ${data.metadata.title} (Space: ${data.metadata.space})`);

        // Add to recent files
        if (!recentFiles.includes(filePath)) {
          setRecentFiles([filePath, ...recentFiles.slice(0, 4)]);
        }

        // Clear chat history when new file is loaded
        setChatHistory([]);
      } else {
        // Read from local file
        const response = await fetch('/api/md-editor/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to read file');
        }

        setFileContent(data.content);
        setOriginalContent(data.content);
        setSourceUrl(null); // Clear source URL for local files

        // Auto-detect content type
        const isHtml = data.content.trim().startsWith('<') || data.content.includes('<div') || data.content.includes('<p>');
        setContentType(isHtml ? 'html' : 'markdown');

        setSuccess(`File loaded: ${data.fileName} (${isHtml ? 'HTML' : 'Markdown'})`);

        // Add to recent files
        if (!recentFiles.includes(filePath)) {
          setRecentFiles([filePath, ...recentFiles.slice(0, 4)]);
        }

        // Clear chat history when new file is loaded
        setChatHistory([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasteContent = (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');

    // If HTML is available (like from Confluence), use it
    if (htmlData && htmlData.trim()) {
      e.preventDefault();
      setFileContent(htmlData);
      setOriginalContent(htmlData);
      setContentType('html');
      setSuccess('Pasted HTML content (Confluence format detected)');
      setChatHistory([]);
    } else if (textData) {
      // Regular text paste
      const isHtml = textData.trim().startsWith('<') || textData.includes('<div') || textData.includes('<p>');
      setContentType(isHtml ? 'html' : 'markdown');
    }
  };

  const handleAIEdit = async () => {
    if (!aiPrompt.trim()) {
      setError('Please enter instructions for AI editing');
      return;
    }

    if (!fileContent) {
      setError('Please load a file first');
      return;
    }

    setAiProcessing(true);
    setError('');
    setSuccess('');

    // Add user message to chat
    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: aiPrompt,
      timestamp: new Date(),
    };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/md-editor/ai-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: fileContent,
          prompt: aiPrompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process with AI');
      }

      // Add AI response with suggested changes
      const aiMessageId = `ai-${Date.now()}`;
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        role: 'assistant',
        content: `I've analyzed your request: "${aiPrompt}"\n\nHere are the changes I'm suggesting:`,
        timestamp: new Date(),
        status: 'pending',
        suggestedContent: data.editedContent,
        originalPrompt: aiPrompt,
      };
      setChatHistory(prev => [...prev, aiMessage]);

      setAiPrompt('');
    } catch (err: any) {
      setError(err.message);

      // Add error message to chat
      const errorMessageId = `error-${Date.now()}`;
      const errorMessage: ChatMessage = {
        id: errorMessageId,
        role: 'assistant',
        content: `Error: ${err.message}\n\nPlease try rephrasing your request or check your AI configuration.`,
        timestamp: new Date(),
        status: 'rejected',
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleApproveChanges = (messageId: string) => {
    setChatHistory(prev => prev.map(msg => {
      if (msg.id === messageId && msg.suggestedContent) {
        setFileContent(msg.suggestedContent);
        setSuccess(`Changes applied: ${msg.originalPrompt}`);
        return { ...msg, status: 'approved' as const };
      }
      return msg;
    }));
  };

  const handleRejectChanges = (messageId: string) => {
    setChatHistory(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, status: 'rejected' as const };
      }
      return msg;
    }));
    setSuccess('Changes rejected. You can try a different request.');
  };

  const handleSaveFile = async () => {
    if (!filePath || !fileContent) {
      setError('No file loaded to save');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/md-editor/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath,
          content: fileContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save file');
      }

      setOriginalContent(fileContent);
      setSuccess('File saved successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportAsNew = () => {
    const blob = new Blob([fileContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edited-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccess('File exported successfully!');
  };

  const handleClearChat = () => {
    setChatHistory([]);
    setSuccess('Chat history cleared');
  };

  const hasUnsavedChanges = fileContent !== originalContent && fileContent !== '';

  // Simple diff display (show first 500 chars of before/after)
  const getDiffPreview = (original: string, modified: string) => {
    const maxLength = 500;
    const originalPreview = original.substring(0, maxLength) + (original.length > maxLength ? '...' : '');
    const modifiedPreview = modified.substring(0, maxLength) + (modified.length > maxLength ? '...' : '');

    return {
      original: originalPreview,
      modified: modifiedPreview,
      hasChanges: original !== modified,
    };
  };

  return (
    <div className="space-y-8">

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-gray-900 border border-gray-600 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <p className="text-gray-200 font-medium">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-gray-900 border border-gray-600 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-red-200 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Compact File Input Section */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <Input
            id="filePath"
            type="text"
            placeholder="Enter file path: file:///path/to/file.pdf (or .md, .docx, .xlsx, .html) or Confluence URL"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filePath) {
                handleReadFile();
              }
            }}
            className="bg-gray-800 border border-gray-600 text-white placeholder:text-gray-500 h-12 text-sm rounded-lg flex-1"
          />

          <Button
            onClick={handleReadFile}
            disabled={loading || !filePath}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 h-12 rounded-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Load
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />
                Load
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor Section with Floating Chat */}
      {fileContent && (
        <div>
          {/* LinkedIn-Style Floating Chat Popup */}
          {chatOpen && (
            <div
              className={`fixed right-6 transition-all duration-300 z-50 ${
                chatMinimized ? 'bottom-6' : 'bottom-6'
              }`}
              style={{ width: '400px', maxHeight: chatMinimized ? '60px' : '600px' }}
            >
              <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-400" />
                    AI Assistant
                  </h3>
                  <div className="flex items-center gap-2">
                    {chatHistory.length > 0 && (
                      <button
                        onClick={handleClearChat}
                        className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        title="Clear Chat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setChatMinimized(!chatMinimized)}
                      className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                      title={chatMinimized ? 'Expand' : 'Minimize'}
                    >
                      <ChevronLeft className={`w-5 h-5 transition-transform ${chatMinimized ? 'rotate-90' : '-rotate-90'}`} />
                    </button>
                    <button
                      onClick={() => setChatOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors"
                      title="Close Chat"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Chat Messages */}
                {!chatMinimized && (
                  <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" style={{ maxHeight: '400px' }}>
                  {chatHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <Bot className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                      <p className="text-gray-500 text-sm">
                        No conversation yet. Ask AI to edit your document and review the suggested changes.
                      </p>
                    </div>
                  ) : (
                <>
                  {chatHistory.map((msg) => (
                    <div key={msg.id} className="space-y-2">
                      {/* User or AI Message Header */}
                      <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                              <Bot className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-lg p-4 ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 border border-gray-700 text-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs mt-2 opacity-60 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {msg.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        {msg.role === 'user' && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Show Diff Preview for AI Suggestions */}
                      {msg.role === 'assistant' && msg.suggestedContent && (
                        <div className="ml-11 space-y-3">
                          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 space-y-3">
                            <div className="text-xs font-semibold text-gray-400 uppercase">Suggested Changes</div>

                            {/* Before/After Preview */}
                            <div className="grid grid-cols-1 gap-3">
                              <div className="space-y-2">
                                <div className="text-xs font-semibold text-red-400">Current (Before):</div>
                                <div className="bg-red-950/30 border border-red-900/50 rounded p-3 text-xs font-mono text-gray-300 max-h-40 overflow-y-auto">
                                  {getDiffPreview(fileContent, msg.suggestedContent).original}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="text-xs font-semibold text-green-400">Suggested (After):</div>
                                <div className="bg-green-950/30 border border-green-900/50 rounded p-3 text-xs font-mono text-gray-300 max-h-40 overflow-y-auto">
                                  {getDiffPreview(fileContent, msg.suggestedContent).modified}
                                </div>
                              </div>
                            </div>

                            {/* Approval Buttons */}
                            {msg.status === 'pending' && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  onClick={() => handleApproveChanges(msg.id)}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm"
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Apply Changes
                                </Button>
                                <Button
                                  onClick={() => handleRejectChanges(msg.id)}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}

                            {/* Status Messages */}
                            {msg.status === 'approved' && (
                              <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-green-300">Changes applied to document</span>
                              </div>
                            )}
                            {msg.status === 'rejected' && (
                              <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 flex items-center gap-2">
                                <X className="w-4 h-4 text-red-400" />
                                <span className="text-xs text-red-300">Changes rejected</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    ))}
                      <div ref={chatEndRef} />
                    </>
                  )}
                  </div>
                )}

                {/* Chat Input */}
                {!chatMinimized && (
                  <div className="p-4 border-t border-gray-700 bg-gray-850">
                  <div className="space-y-3">
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (aiPrompt.trim() && !aiProcessing) {
                            handleAIEdit();
                          }
                        }
                      }}
                      placeholder="Ask AI to edit... (e.g., 'Fix grammar', 'Add examples', 'Make it shorter')"
                      className="bg-gray-800 border border-gray-600 text-white placeholder:text-gray-500 rounded-lg min-h-[80px] resize-none"
                      disabled={aiProcessing}
                    />
                    <Button
                      onClick={handleAIEdit}
                      disabled={aiProcessing || !aiPrompt.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg"
                    >
                      {aiProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          AI is analyzing...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send to AI
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                )}
              </div>
            </div>
          )}

          {/* Floating Chat Button */}
          {!chatOpen && (
            <button
              onClick={() => {
                setChatOpen(true);
                setChatMinimized(false);
              }}
              className="fixed bottom-6 right-6 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 group"
            >
              <Bot className="w-6 h-6" />
              {chatHistory.length > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-gray-900">
                  {chatHistory.length}
                </div>
              )}
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-gray-600">
                Ask AI Assistant
              </div>
            </button>
          )}

          {/* Document Editor - Full Width */}
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-gray-400" />
                Document Editor
              </h2>
              <div className="flex items-center gap-3">
                {hasUnsavedChanges && (
                  <span className="text-yellow-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Unsaved changes
                  </span>
                )}
                <Button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  {previewMode ? (
                    <>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </>
                  )}
                </Button>
              </div>
            </div>

            {previewMode ? (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-h-[700px] overflow-y-auto">
                {/* Content Type Toggle */}
                <div className="mb-4 flex items-center gap-3 pb-4 border-b border-gray-700">
                  <span className="text-sm text-gray-400">Content Type:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setContentType('markdown')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        contentType === 'markdown'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Markdown
                    </button>
                    <button
                      onClick={() => setContentType('html')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        contentType === 'html'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      HTML/Confluence
                    </button>
                  </div>
                </div>

                {contentType === 'html' ? (
                  <div className="bg-white w-full">
                    <iframe
                      srcDoc={fileContent}
                      className="w-full border-0"
                      style={{ height: '700px', backgroundColor: 'white' }}
                      title="HTML Viewer"
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="prose prose-invert prose-lg max-w-none markdown-preview">
                    <style jsx global>{`
                      .markdown-preview h1 {
                        font-size: 2.5rem;
                        font-weight: 800;
                        color: #ffffff;
                        margin-top: 1.5rem;
                        margin-bottom: 1rem;
                        padding-bottom: 0.5rem;
                        border-bottom: 2px solid #4b5563;
                      }
                      .markdown-preview h2 {
                        font-size: 2rem;
                        font-weight: 700;
                        color: #f3f4f6;
                        margin-top: 1.5rem;
                        margin-bottom: 0.75rem;
                        padding-bottom: 0.3rem;
                        border-bottom: 1px solid #374151;
                      }
                      .markdown-preview h3 {
                        font-size: 1.5rem;
                        font-weight: 600;
                        color: #e5e7eb;
                        margin-top: 1.25rem;
                        margin-bottom: 0.5rem;
                      }
                      .markdown-preview h4 {
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: #d1d5db;
                        margin-top: 1rem;
                        margin-bottom: 0.5rem;
                      }
                      .markdown-preview p {
                        color: #d1d5db;
                        line-height: 1.75;
                        margin-bottom: 1rem;
                      }
                      .markdown-preview strong {
                        color: #ffffff;
                        font-weight: 700;
                      }
                      .markdown-preview em {
                        color: #e5e7eb;
                        font-style: italic;
                      }
                      .markdown-preview code {
                        background-color: #1f2937;
                        color: #fbbf24;
                        padding: 0.2rem 0.4rem;
                        border-radius: 0.25rem;
                        font-size: 0.9em;
                        font-family: 'Courier New', monospace;
                      }
                      .markdown-preview pre {
                        background-color: #111827;
                        border: 1px solid #374151;
                        border-radius: 0.5rem;
                        padding: 1rem;
                        overflow-x: auto;
                        margin: 1rem 0;
                      }
                      .markdown-preview pre code {
                        background-color: transparent;
                        color: #d1d5db;
                        padding: 0;
                      }
                      .markdown-preview ul, .markdown-preview ol {
                        color: #d1d5db;
                        margin-left: 1.5rem;
                        margin-bottom: 1rem;
                      }
                      .markdown-preview li {
                        margin-bottom: 0.5rem;
                        line-height: 1.6;
                      }
                      .markdown-preview ul {
                        list-style-type: disc;
                      }
                      .markdown-preview ol {
                        list-style-type: decimal;
                      }
                      .markdown-preview ul ul {
                        list-style-type: circle;
                        margin-top: 0.5rem;
                      }
                      .markdown-preview ul ul ul {
                        list-style-type: square;
                      }
                      .markdown-preview a {
                        color: #60a5fa;
                        text-decoration: underline;
                      }
                      .markdown-preview a:hover {
                        color: #93c5fd;
                      }
                      .markdown-preview blockquote {
                        border-left: 4px solid #4b5563;
                        padding-left: 1rem;
                        margin: 1rem 0;
                        color: #9ca3af;
                        font-style: italic;
                      }
                      .markdown-preview hr {
                        border: none;
                        border-top: 2px solid #374151;
                        margin: 2rem 0;
                      }
                      .markdown-preview table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 1rem 0;
                        background-color: #1f2937;
                      }
                      .markdown-preview th, .markdown-preview td {
                        border: 1px solid #374151;
                        padding: 0.75rem;
                        text-align: left;
                      }
                      .markdown-preview th {
                        background-color: #111827;
                        color: #ffffff;
                        font-weight: 600;
                      }
                      .markdown-preview td {
                        color: #d1d5db;
                      }
                    `}</style>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: renderedMarkdown,
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Editing as:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setContentType('markdown')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        contentType === 'markdown'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Markdown
                    </button>
                    <button
                      onClick={() => setContentType('html')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        contentType === 'html'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      HTML/Confluence
                    </button>
                  </div>
                </div>
                <Textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  onPaste={handlePasteContent}
                  className="bg-gray-800 border border-gray-600 text-white placeholder:text-gray-500 font-mono text-sm rounded-lg min-h-[700px]"
                  placeholder="Paste Confluence content here or type Markdown/HTML... (Ctrl+V to paste)"
                />
                <p className="text-xs text-gray-400 ml-2">
                  💡 Tip: Copy content from Confluence and paste here (Ctrl+V) - HTML format will be automatically detected
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <Button
                onClick={handleSaveFile}
                disabled={saving || !hasUnsavedChanges}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save File
                  </>
                )}
              </Button>

              <Button
                onClick={() => {
                  handleCopy(fileContent, '✓ Markdown copied to clipboard!');
                }}
                className={`font-bold py-3 rounded-lg transition-all ${
                  copiedFeedback === '✓ Markdown copied to clipboard!'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {copiedFeedback === '✓ Markdown copied to clipboard!' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Copy as Markdown
                  </>
                )}
              </Button>

              <Button
                onClick={() => {
                  const confluenceHtml = convertToConfluenceFormat(fileContent, sourceUrl);
                  handleCopy(confluenceHtml, '✓ Confluence format copied!', true);
                }}
                className={`font-bold py-3 rounded-lg transition-all ${
                  copiedFeedback === '✓ Confluence format copied!'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white`}
              >
                {copiedFeedback === '✓ Confluence format copied!' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Copy for Confluence
                  </>
                )}
              </Button>

              <Button
                onClick={() => {
                  setFileContent(originalContent);
                  setSuccess('Changes discarded');
                }}
                disabled={!hasUnsavedChanges}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Discard Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
