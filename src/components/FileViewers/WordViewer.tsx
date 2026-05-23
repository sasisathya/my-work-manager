'use client';

import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

interface WordViewerProps {
  data: ArrayBuffer;
}

export default function WordViewer({ data }: WordViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    convertToHtml();
  }, [data]);

  const convertToHtml = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await mammoth.convertToHtml(
        { arrayBuffer: data },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Heading 4'] => h4:fresh",
            "p[style-name='Code'] => pre:fresh",
          ],
        }
      );

      setHtmlContent(result.value);

      // Log any messages/warnings
      if (result.messages.length > 0) {
        console.log('Conversion messages:', result.messages);
      }
    } catch (err: any) {
      setError(`Failed to convert Word document: ${err.message}`);
      console.error('Word conversion error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportAsHtml = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(htmlContent);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
        <p className="text-gray-400">Converting Word document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <span className="text-white text-sm font-medium">Word Document</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={copyToClipboard}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            Copy HTML
          </Button>
          <Button
            onClick={exportAsHtml}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export HTML
          </Button>
        </div>
      </div>

      {/* Document Content */}
      <div className="bg-gray-800 rounded-lg p-8 max-h-[700px] overflow-auto">
        <div className="prose prose-invert prose-lg max-w-none word-document">
          <style jsx global>{`
            .word-document h1 {
              font-size: 2.5rem;
              font-weight: 800;
              color: #ffffff;
              margin-top: 1.5rem;
              margin-bottom: 1rem;
              padding-bottom: 0.5rem;
              border-bottom: 2px solid #4b5563;
            }
            .word-document h2 {
              font-size: 2rem;
              font-weight: 700;
              color: #f3f4f6;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
              padding-bottom: 0.3rem;
              border-bottom: 1px solid #374151;
            }
            .word-document h3 {
              font-size: 1.5rem;
              font-weight: 600;
              color: #e5e7eb;
              margin-top: 1.25rem;
              margin-bottom: 0.5rem;
            }
            .word-document h4 {
              font-size: 1.25rem;
              font-weight: 600;
              color: #d1d5db;
              margin-top: 1rem;
              margin-bottom: 0.5rem;
            }
            .word-document p {
              color: #d1d5db;
              line-height: 1.75;
              margin-bottom: 1rem;
            }
            .word-document strong {
              color: #ffffff;
              font-weight: 700;
            }
            .word-document em {
              color: #e5e7eb;
              font-style: italic;
            }
            .word-document ul,
            .word-document ol {
              color: #d1d5db;
              margin-left: 1.5rem;
              margin-bottom: 1rem;
            }
            .word-document li {
              margin-bottom: 0.5rem;
              line-height: 1.6;
            }
            .word-document table {
              width: 100%;
              border-collapse: collapse;
              margin: 1rem 0;
              background-color: #1f2937;
            }
            .word-document th,
            .word-document td {
              border: 1px solid #374151;
              padding: 0.75rem;
              text-align: left;
            }
            .word-document th {
              background-color: #111827;
              color: #ffffff;
              font-weight: 600;
            }
            .word-document td {
              color: #d1d5db;
            }
            .word-document img {
              max-width: 100%;
              height: auto;
              border-radius: 0.5rem;
              margin: 1rem 0;
            }
            .word-document a {
              color: #60a5fa;
              text-decoration: underline;
            }
            .word-document a:hover {
              color: #93c5fd;
            }
            .word-document pre {
              background-color: #111827;
              border: 1px solid #374151;
              border-radius: 0.5rem;
              padding: 1rem;
              overflow-x: auto;
              margin: 1rem 0;
              color: #d1d5db;
            }
          `}</style>
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </div>
    </div>
  );
}
