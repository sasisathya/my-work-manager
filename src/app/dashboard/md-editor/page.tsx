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
  Folder,
  File as FileIcon,
  Menu,
} from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modified?: string;
}

// Helper to resolve relative paths
const resolveRelativePath = (basePath: string | null | undefined, relativePath: string): string => {
  if (!basePath) return relativePath; // If no base path, return relative path as-is
  const parts = basePath.split('/');
  const pathParts = relativePath.split('/');

  for (let i = 0; i < pathParts.length; i++) {
    if (pathParts[i] === '..') {
      parts.pop();
    } else if (pathParts[i] !== '.') {
      parts.push(pathParts[i]);
    }
  }

  return parts.join('/');
};

// Detect file type by extension and content
const detectFileType = (fileName: string | undefined, content: string): 'markdown' | 'html' | 'code' => {
  if (!fileName) return 'markdown'; // Default to markdown if no filename
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // Code files
  const codeExtensions = [
    'css', 'scss', 'less',
    'js', 'jsx', 'ts', 'tsx',
    'json', 'xml', 'svg', 'yaml', 'yml',
    'sql', 'java', 'py', 'rb', 'go', 'rs', 'cpp', 'c', 'h',
    'php', 'sh', 'bash', 'gradle', 'properties', 'env'
  ];

  if (codeExtensions.includes(ext)) {
    return 'code';
  }

  // HTML detection
  const isHtml = content.trim().startsWith('<') || content.includes('<div') || content.includes('<p>');
  if (isHtml) {
    return 'html';
  }

  // Default to markdown
  return 'markdown';
};

// Beautify/Format code for display
const beautifyCode = (code: string, fileExt: string | undefined): string => {
  if (!fileExt) return code; // Return as-is if no extension

  // For JSON, prettify with indentation
  if (fileExt === '.json' || fileExt.endsWith('.json')) {
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return code;
    }
  }

  // For other code files, just ensure proper formatting
  return code;
};

// Transform HTML content to serve resources via API
const transformHtmlContent = (html: string, fileDir?: string | null): string => {
  if (!html || !fileDir) return html;

  let transformed = html;

  // Replace relative paths for stylesheets
  transformed = transformed.replace(
    /href=["'](?!(?:https?:|\/\/|data:))([^"']+)["']/g,
    (match, filePath) => {
      // Keep absolute app paths as-is
      if (filePath.startsWith('/')) {
        return match;
      }
      // For relative paths, resolve and serve via API
      const absolutePath = resolveRelativePath(fileDir, filePath);
      return `href="/api/md-editor/serve-file?path=${encodeURIComponent(absolutePath)}"`;
    }
  );

  // Replace relative paths for images and other src attributes
  transformed = transformed.replace(
    /src=["'](?!(?:https?:|\/\/|data:))([^"']+)["']/g,
    (match, filePath) => {
      if (filePath.startsWith('/')) {
        return match;
      }
      const absolutePath = resolveRelativePath(fileDir, filePath);
      return `src="/api/md-editor/serve-file?path=${encodeURIComponent(absolutePath)}"`;
    }
  );

  // Remove problematic Next.js attributes
  transformed = transformed.replace(/\s+data-precedence="[^"]*"/g, '');

  return transformed;
};

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

  // Headers - Confluence needs proper h1-h6 tags with IDs for anchor links
  const createHeaderWithId = (level: number, text: string) => {
    const id = text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    return `<h${level} id="${id}">${text}</h${level}>`;
  };

  html = html.replace(/^###### (.+)$/gm, (_, text) => createHeaderWithId(6, text));
  html = html.replace(/^##### (.+)$/gm, (_, text) => createHeaderWithId(5, text));
  html = html.replace(/^#### (.+)$/gm, (_, text) => createHeaderWithId(4, text));
  html = html.replace(/^### (.+)$/gm, (_, text) => createHeaderWithId(3, text));
  html = html.replace(/^## (.+)$/gm, (_, text) => createHeaderWithId(2, text));
  html = html.replace(/^# (.+)$/gm, (_, text) => createHeaderWithId(1, text));

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
  const [contentType, setContentType] = useState<'markdown' | 'html' | 'code'>('markdown');
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null); // Track if loaded from Confluence
  const [fileDir, setFileDir] = useState<string | null>(null); // Directory path for resolving relative resources
  const chatEndRef = useRef<HTMLDivElement>(null);

  // File browser state
  const [folderPath, setFolderPath] = useState('');
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [fileBrowserLoading, setFileBrowserLoading] = useState(false);
  const [fileBrowserError, setFileBrowserError] = useState('');
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('');

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

  // Auto-dismiss success messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-dismiss error messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle hash navigation and scroll to sections
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        // Remove the # from the hash
        const elementId = hash.substring(1);

        // Wait a bit for DOM to update
        setTimeout(() => {
          const element = document.getElementById(elementId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    };

    // Handle initial hash on page load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [fileContent, previewMode]);

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
        setFileDir(data.dirPath); // Store directory path for CSS/resource resolution

        // Auto-detect content type and beautify if needed
        const detectedType = detectFileType(data.fileName, data.content);
        setContentType(detectedType);

        if (detectedType === 'code') {
          const beautified = beautifyCode(data.content, data.fileName);
          setFileContent(beautified);
          setOriginalContent(beautified);
        }

        const typeLabel = detectedType === 'code' ? 'Code' : detectedType === 'html' ? 'HTML' : 'Markdown';
        setSuccess(`File loaded: ${data.fileName} (${typeLabel})`);

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

  const handleOpenPath = async () => {
    const path = filePath || folderPath;
    if (!path) {
      setFileBrowserError('Please enter a path');
      return;
    }

    // Check if it's a web URL
    if (path.startsWith('http://') || path.startsWith('https://')) {
      await handleLoadWebUrl(path);
      return;
    }

    // Try to determine if it's a folder or file (local path)
    // First, try as a folder
    await handleLoadFolderPath(path);
  };

  const handleLoadFolderPath = async (path: string) => {
    setFileBrowserLoading(true);
    setFileBrowserError('');
    setError('');
    setFileList([]);

    try {
      const response = await fetch('/api/md-editor/list-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: path }),
      });

      const data = await response.json();

      if (response.ok && data.files) {
        setFileList(data.files);
        setCurrentFolder(data.folderPath);
        setFolderPath(path);
        setFilePath('');
        setShowFileBrowser(true);
        setSuccess(`Loaded ${data.files.length} items from folder`);
      } else {
        // If folder fails, try as a file
        await handleReadFilePath(path);
      }
    } catch (err: any) {
      // If folder fails, try as a file
      await handleReadFilePath(path);
    } finally {
      setFileBrowserLoading(false);
    }
  };

  const handleReadFilePath = async (path: string) => {
    setLoading(true);
    setFileBrowserError('');
    setError('');

    try {
      const response = await fetch('/api/md-editor/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: path }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to read file or access folder');
      }

      // Check if the response indicates it's a directory
      if (data.isDirectory) {
        // If it's a directory, load it as a folder instead
        setLoading(false);
        await handleLoadFolderPath(path);
        return;
      }

      setFileContent(data.content);
      setOriginalContent(data.content);
      setSourceUrl(null);
      setFilePath(path);
      setFileDir(data.dirPath); // Store directory path for CSS/resource resolution
      // Keep folder path and file list so browser can navigate from any loaded file
      // setFolderPath(''); // REMOVED to allow folder navigation
      // setFileList([]); // REMOVED to allow folder navigation
      // setShowFileBrowser(false); // Allow file browser to remain accessible

      // Get file name safely - handle cases where data.fileName might be undefined
      let cleanPath = path;
      if (path && path.startsWith('file://')) {
        cleanPath = path.replace('file://', '');
      }
      const fileName = data.fileName || (cleanPath ? cleanPath.split('/').pop() : 'Unknown');

      // Auto-detect content type and beautify if needed
      const detectedType = detectFileType(fileName || 'unknown', data.content);
      setContentType(detectedType);

      if (detectedType === 'code') {
        const beautified = beautifyCode(data.content, fileName || '');
        setFileContent(beautified);
        setOriginalContent(beautified);
      }

      const typeLabel = detectedType === 'code' ? 'Code' : detectedType === 'html' ? 'HTML' : 'Markdown';
      const displayName = fileName || (cleanPath && cleanPath.split('/').pop()) || 'File';
      setSuccess(`File loaded: ${displayName} (${typeLabel})`);
      setChatHistory([]);
    } catch (err: any) {
      setError(err.message || 'Path not found. Please check and try again.');
      setFileBrowserError('');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadWebUrl = async (url: string) => {
    setLoading(true);
    setError('');
    setFileBrowserError('');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch URL`);
      }

      const content = await response.text();

      setFileContent(content);
      setOriginalContent(content);
      setSourceUrl(url);
      setFilePath(url);
      setFileDir(null); // No directory for web URLs

      // Auto-detect content type
      const fileName = url.split('/').pop() || 'document';
      const detectedType = detectFileType(fileName, content);
      setContentType(detectedType);

      if (detectedType === 'code') {
        const beautified = beautifyCode(content, fileName || '');
        setFileContent(beautified);
        setOriginalContent(beautified);
      }

      const typeLabel = detectedType === 'code' ? 'Code' : detectedType === 'html' ? 'HTML' : 'Markdown';
      setSuccess(`Loaded from web: ${fileName} (${typeLabel})`);
      setChatHistory([]);

      // Don't show file browser for web URLs
      setShowFileBrowser(false);
      setFileList([]);
    } catch (err: any) {
      setError(err.message || 'Failed to load from web URL. Please check the URL and try again.');
      setFileBrowserError('');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFolder = async () => {
    if (!folderPath) {
      setFileBrowserError('Please enter a folder path');
      return;
    }

    await handleLoadFolderPath(folderPath);
  };

  const handleSelectFile = async (file: FileItem) => {
    if (file.isDirectory) {
      setFolderPath(file.path);
      // Trigger loading by updating folder path
      const response = await fetch('/api/md-editor/list-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: file.path }),
      });

      const data = await response.json();
      if (data.files) {
        setFileList(data.files);
        setCurrentFolder(data.folderPath);
      }
      return;
    }

    // Load file content
    setFilePath(file.path);
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/md-editor/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: file.path }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to read file');
      }

      setFileContent(data.content);
      setOriginalContent(data.content);
      setSourceUrl(null);
      setFileDir(data.dirPath); // Store directory path for CSS/resource resolution
      // Keep file list so folder browser remains accessible - do NOT clear it
      // setFileList([]); // REMOVED: This was preventing folder navigation

      // Auto-detect content type and beautify if needed
      const detectedType = detectFileType(file.name, data.content);
      setContentType(detectedType);

      if (detectedType === 'code') {
        const beautified = beautifyCode(data.content, file.name);
        setFileContent(beautified);
        setOriginalContent(beautified);
      }

      const typeLabel = detectedType === 'code' ? 'Code' : detectedType === 'html' ? 'HTML' : 'Markdown';
      setSuccess(`File loaded: ${file.name} (${typeLabel})`);
      setChatHistory([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = async () => {
    if (!currentFolder) return; // Safety check
    const parentPath = currentFolder.split('/').slice(0, -1).join('/');
    if (parentPath) {
      const response = await fetch('/api/md-editor/list-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: parentPath }),
      });

      const data = await response.json();
      if (data.files) {
        setFileList(data.files);
        setCurrentFolder(data.folderPath);
        setFolderPath(parentPath);
      }
    }
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

      {/* Success/Error Messages - Toast Style */}
      {success && (
        <div className="fixed top-4 right-4 z-40 bg-green-900/90 border border-green-700 rounded-lg p-4 backdrop-blur-sm max-w-sm animate-in fade-in slide-in-from-top">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-100 font-medium text-sm">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 z-40 bg-red-900/90 border border-red-700 rounded-lg p-4 backdrop-blur-sm max-w-sm animate-in fade-in slide-in-from-top">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-100 font-medium text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Unified File/Folder Input Section */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Enter file path, folder, or Confluence URL"
              value={filePath || folderPath}
              onChange={(e) => {
                const val = e.target.value.trim();
                setFilePath(val);
                setFolderPath(val);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleOpenPath();
                }
              }}
              className="bg-gray-800 border border-gray-600 text-white placeholder:text-gray-500 h-10 text-sm rounded-lg w-full"
            />
          </div>
          <Button
            onClick={handleOpenPath}
            disabled={(loading || fileBrowserLoading) || (!filePath && !folderPath)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 h-10 rounded-lg whitespace-nowrap"
          >
            {loading || fileBrowserLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Loading
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-1" />
                Open
              </>
            )}
          </Button>
          {fileList.length > 0 && (
            <Button
              onClick={() => setShowFileBrowser(!showFileBrowser)}
              className={`${
                showFileBrowser
                  ? 'bg-purple-700 hover:bg-purple-800'
                  : 'bg-gray-700 hover:bg-gray-600'
              } text-white font-bold px-4 h-10 rounded-lg whitespace-nowrap`}
              title={showFileBrowser ? 'Hide file browser' : 'Show file browser'}
            >
              <Menu className="w-4 h-4" />
            </Button>
          )}
        </div>

        {(fileBrowserError || error) && (
          <div className="mt-2 bg-red-900/30 border border-red-700/50 rounded p-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-300">{fileBrowserError || error}</span>
          </div>
        )}
      </div>

      {/* File Browser with Editor */}
      {(fileList.length > 0 || fileContent) && (
        <div className={`${showFileBrowser && fileList.length > 0 ? 'grid grid-cols-1 lg:grid-cols-5 gap-4' : ''}`}>
          {/* File List Sidebar - Only show if browsing folders */}
          {showFileBrowser && fileList.length > 0 && (
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 sticky top-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <div className="mb-3 pb-2 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-white">Files</h4>
                    {currentFolder && currentFolder !== '/' && (
                      <button
                        onClick={handleGoBack}
                        className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
                        title="Go to parent folder"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{currentFolder ? (currentFolder.split('/').pop() || 'root') : 'root'}</p>
                </div>

                <div className="space-y-0.5">
                  {fileList.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => handleSelectFile(file)}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-800 transition-colors flex items-center gap-2 text-xs group"
                      title={file.name}
                    >
                      {file.isDirectory ? (
                        <>
                          <Folder className="w-3 h-3 text-purple-400 flex-shrink-0" />
                          <span className="text-gray-300 group-hover:text-white truncate flex-1">
                            {file.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <FileIcon className="w-3 h-3 text-blue-400 flex-shrink-0" />
                          <span className="text-gray-300 group-hover:text-white truncate flex-1">
                            {file.name}
                          </span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Editor Content - Full width or 4 columns wide depending on sidebar */}
          {fileContent && (
            <div className={`${showFileBrowser && fileList.length > 0 ? 'lg:col-span-4 order-1 lg:order-2' : 'w-full'}`}>
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
                    <button
                      onClick={() => setContentType('code')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        contentType === 'code'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Code
                    </button>
                  </div>
                </div>

                {contentType === 'code' ? (
                  <div className="bg-gray-900 rounded-lg p-6 w-full overflow-x-auto max-h-[700px] overflow-y-auto">
                    <pre className="text-sm text-gray-300 font-mono">
                      <code>{fileContent}</code>
                    </pre>
                  </div>
                ) : contentType === 'html' ? (
                  <div className="bg-white w-full">
                    <iframe
                      srcDoc={`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
      padding: 20px;
    }
    img { max-width: 100%; height: auto; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; }
    pre { background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f5f5f5; font-weight: bold; }
  </style>
</head>
<body>
  ${transformHtmlContent(fileContent, fileDir)}
</body>
</html>`}
                      className="w-full border-0"
                      style={{ height: '700px', backgroundColor: 'white' }}
                      title="HTML Viewer"
                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
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
                      onClick={(e: React.MouseEvent) => {
                        const target = e.target as HTMLElement;
                        if (target.tagName === 'A') {
                          const href = (target as HTMLAnchorElement).getAttribute('href');
                          if (href && href.startsWith('#')) {
                            e.preventDefault();
                            const elementId = href.substring(1);
                            const element = document.getElementById(elementId);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }
                        }
                      }}
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
                    <button
                      onClick={() => setContentType('code')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        contentType === 'code'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Code
                    </button>
                  </div>
                </div>
                <Textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  onPaste={handlePasteContent}
                  className="bg-gray-800 border border-gray-600 text-white placeholder:text-gray-500 font-mono text-sm rounded-lg min-h-[700px]"
                  placeholder="Paste Confluence content here or type Markdown/HTML/Code... (Ctrl+V to paste)"
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
      )}
    </div>
  );
}
