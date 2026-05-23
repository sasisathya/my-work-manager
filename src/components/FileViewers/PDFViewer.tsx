'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText } from 'lucide-react';

interface PDFViewerProps {
  data: ArrayBuffer;
}

export default function PDFViewer({ data }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Create a blob URL from the ArrayBuffer
    const blob = new Blob([data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);

    // Cleanup function to revoke the URL
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [data]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  if (!mounted) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
        <div className="text-gray-400">Loading PDF viewer...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-red-400" />
          <span className="text-white text-sm font-medium">PDF Document</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenInNewTab}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </Button>
          <Button
            onClick={handleDownload}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* PDF Viewer using iframe */}
      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <iframe
          src={pdfUrl}
          className="w-full"
          style={{ height: '700px' }}
          title="PDF Viewer"
        />
      </div>

      <div className="text-gray-400 text-sm text-center">
        💡 Tip: Use your browser's built-in PDF viewer controls for navigation, zoom, and printing
      </div>
    </div>
  );
}
