'use client';

import React, { useRef, useState } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResumeUploadFormProps {
  onUploadComplete?: () => void;
}

export default function ResumeUploadForm({ onUploadComplete }: ResumeUploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload resume');
      }

      setSuccess('Resume uploaded successfully!');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      console.log('Resume uploaded successfully, calling onUploadComplete callback');

      // Call the callback after a short delay to allow UI to update
      setTimeout(async () => {
        console.log('Executing onUploadComplete callback');
        await onUploadComplete?.();
        console.log('onUploadComplete callback completed');
      }, 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {success && (
        <div className="glass-card border-green-500/40 bg-gradient-to-r from-green-500/15 to-emerald-500/15 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <p className="text-green-200 text-sm font-medium">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="glass-card border-red-500/40 bg-gradient-to-r from-red-500/15 to-red-400/15 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-200 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="border-2 border-dashed border-gray-500/50 rounded-2xl p-8 text-center hover:border-gray-400/50 transition-colors cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
            )}
          </div>
          <div>
            <p className="text-white font-semibold group-hover:text-gray-200 transition-colors">
              {uploading ? 'Uploading...' : 'Click to upload your resume'}
            </p>
            <p className="text-gray-400 text-sm">or drag and drop</p>
          </div>
          <p className="text-gray-500 text-xs mt-2">PDF • Max 5MB</p>
        </div>
      </div>

      {!uploading && (
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="glass-button text-white font-bold text-lg py-6 w-full rounded-2xl"
          disabled={uploading}
        >
          <Upload className="w-5 h-5 mr-2" />
          Select Resume
        </Button>
      )}
    </div>
  );
}
