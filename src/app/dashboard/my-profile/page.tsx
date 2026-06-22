'use client';

import React, { useState } from 'react';
import { Upload, Download, FileText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProfileCard from './components/ProfileCard';
import ResumeUploader from './components/ResumeUploader';
import ProfileStats from './components/ProfileStats';

export default function MyProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleResumeUpload = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setProfileData(data.profile);
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 md:p-8 shimmer">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">My Profile</h1>
            <p className="text-gray-300 text-sm md:text-lg">
              Upload your resume to create a stunning 3D animated profile
            </p>
          </div>
          {!profileData && (
            <div className="relative flex-shrink-0 hidden md:block">
              <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-40" />
              <div className="relative">
                <Zap className="w-20 h-20 md:w-24 md:h-24 text-gray-300 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>

      {!profileData ? (
        <div className="space-y-6">
          <ResumeUploader onUpload={handleResumeUpload} loading={loading} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile Card with 3D Animation */}
          <ProfileCard profile={profileData} />

          {/* Profile Statistics */}
          <ProfileStats profile={profileData} />

          {/* Action Buttons */}
          <div className="glass-card rounded-3xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center flex-wrap">
              <Button className="glass-button rounded-xl text-sm md:text-lg py-4 md:py-6 px-6 md:px-8">
                <Download className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                Export Profile
              </Button>
              <Button className="glass-button rounded-xl text-sm md:text-lg py-4 md:py-6 px-6 md:px-8">
                <FileText className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                View Resume
              </Button>
              <Button
                onClick={() => setProfileData(null)}
                className="bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm md:text-lg py-4 md:py-6 px-6 md:px-8"
              >
                <Upload className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                Upload New
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
