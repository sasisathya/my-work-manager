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
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card rounded-3xl p-8 shimmer">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-3">My Profile</h1>
            <p className="text-gray-200 text-lg">
              Upload your resume to create a stunning 3D animated profile
            </p>
          </div>
          {!profileData && (
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-40" />
              <div className="relative">
                <Zap className="w-24 h-24 text-gray-300 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>

      {!profileData ? (
        <ResumeUploader onUpload={handleResumeUpload} loading={loading} />
      ) : (
        <div className="space-y-8">
          {/* Profile Card with 3D Animation */}
          <ProfileCard profile={profileData} />

          {/* Profile Statistics */}
          <ProfileStats profile={profileData} />

          {/* Action Buttons */}
          <div className="glass-card rounded-3xl p-8 flex gap-4 justify-center">
            <Button className="glass-button rounded-xl text-lg py-6 px-8">
              <Download className="w-6 h-6 mr-3" />
              Export Profile
            </Button>
            <Button className="glass-button rounded-xl text-lg py-6 px-8">
              <FileText className="w-6 h-6 mr-3" />
              View Resume
            </Button>
            <Button
              onClick={() => setProfileData(null)}
              className="bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-lg py-6 px-8"
            >
              <Upload className="w-6 h-6 mr-3" />
              Upload New
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
