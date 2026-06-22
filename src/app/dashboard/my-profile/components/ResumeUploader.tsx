'use client';

import React, { useRef } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResumeUploaderProps {
  onUpload: (file: File) => void;
  loading: boolean;
}

export default function ResumeUploader({ onUpload, loading }: ResumeUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024) {
      onUpload(file);
    } else {
      alert('Please upload a PDF file (max 5MB)');
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`glass-card rounded-3xl p-8 md:p-12 text-center transition-all duration-300 cursor-pointer ${
        dragActive ? 'border-2 border-purple-400 bg-purple-500/10 scale-105' : 'border-2 border-dashed border-gray-600'
      }`}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleChange}
        className="hidden"
        disabled={loading}
      />

      <div className="space-y-6">
        <div className="relative mb-4 md:mb-6">
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-30 animate-pulse" />
          <div className="relative">
            {loading ? (
              <Loader2 className="w-16 h-16 md:w-24 md:h-24 mx-auto text-purple-400 animate-spin" />
            ) : (
              <Upload className="w-16 h-16 md:w-24 md:h-24 mx-auto text-gray-300" />
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-2">
            {loading ? 'Analyzing Your Resume...' : 'Upload Your Resume'}
          </h2>
          <p className="text-gray-300 text-base md:text-lg mb-3 md:mb-4">
            {loading
              ? 'Extracting data and generating your 3D profile...'
              : 'Drag and drop your PDF resume or click to browse'}
          </p>
          <p className="text-gray-400 text-xs md:text-sm">
            PDF files only, maximum 5MB
          </p>
        </div>

        {!loading && (
          <Button className="glass-button rounded-xl text-base md:text-lg py-4 md:py-6 px-6 md:px-8 mx-auto block">
            <FileText className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
            Choose Resume
          </Button>
        )}
      </div>
    </div>
  );
}
