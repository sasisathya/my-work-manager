'use client';

import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Upload, Download, FileText, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ResumeUploader from './components/ResumeUploader';

// Lazy load components for better performance
const ProfileCard = lazy(() => import('./components/ProfileCard'));
const ProfileStats = lazy(() => import('./components/ProfileStats'));

// Loading skeleton component
function ProfileSkeleton() {
  return (
    <div className="glass-card rounded-3xl p-6 md:p-8 animate-pulse">
      <div className="h-64 bg-gray-700/50 rounded-2xl mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-700/50 rounded w-3/4" />
        <div className="h-4 bg-gray-700/50 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function MyProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfileStatus();
  }, []);

  const fetchProfileStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/profile/status');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfileData(data.profile);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

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
      setError('Failed to upload resume');
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
              {loading && !profileData ? 'Loading your profile...' : 'Upload your resume to create a stunning 3D animated profile'}
            </p>
          </div>
          {!profileData && !loading && (
            <div className="relative flex-shrink-0 hidden md:block">
              <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-40" />
              <div className="relative">
                <Zap className="w-20 h-20 md:w-24 md:h-24 text-gray-300 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && !profileData && (
        <div className="space-y-6">
          <ProfileSkeleton />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass-card border-red-500/40 bg-gradient-to-r from-red-500/15 to-red-400/15 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-red-200 font-medium">{error}</p>
          </div>
        </div>
      )}

      {!loading && !profileData ? (
        <div className="space-y-6">
          <ResumeUploader onUpload={handleResumeUpload} loading={loading} />
        </div>
      ) : profileData ? (
        <div className="space-y-6">
          {/* Profile Card with 3D Animation - Lazy loaded */}
          <Suspense fallback={<ProfileSkeleton />}>
            <ProfileCard profile={profileData} />
          </Suspense>

          {/* Profile Statistics - Lazy loaded */}
          <Suspense fallback={<ProfileSkeleton />}>
            <ProfileStats profile={profileData} />
          </Suspense>

          {/* Raw JSON Data Viewer */}
          <div className="glass-card rounded-3xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold gradient-text">Profile Data (JSON)</h2>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(profileData, null, 2));
                  alert('JSON copied to clipboard!');
                }}
                className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
              >
                Copy JSON
              </button>
            </div>
            <div className="bg-gray-900/80 rounded-2xl p-4 overflow-auto max-h-96 border border-gray-700/50">
              <pre className="text-xs md:text-sm text-gray-300 font-mono whitespace-pre-wrap break-words">
                {JSON.stringify(profileData, null, 2)}
              </pre>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              This JSON data is stored in `/data/profiles/profile_[timestamp].json` and used for 3D animated profile generation.
            </p>
          </div>

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
      ) : null}
    </div>
  );
}
