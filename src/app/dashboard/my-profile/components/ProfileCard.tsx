'use client';

import React, { memo, useMemo } from 'react';
import { Star, Briefcase, BookOpen, Award } from 'lucide-react';

interface Skill {
  name: string;
  level: number; // 1-5
  yearsOfExperience?: number;
}

interface Experience {
  title: string;
  company: string;
  duration: string;
  description?: string;
}

interface Education {
  degree: string;
  school: string;
  year: string;
}

interface ProfileData {
  personalInfo: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  certifications?: Array<{ name: string; issuer: string; year: string }>;
}

// Memoized skill item component
const SkillItem = memo(({ skill, getSkillColor, getSkillBgColor }: any) => (
  <div className={`${getSkillBgColor(skill.level)} rounded-2xl p-4 border border-gray-600/20 hover:border-gray-600/50 transition-all duration-300`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white text-sm">{skill.name}</span>
        {skill.yearsOfExperience && (
          <span className="text-xs text-gray-400">({skill.yearsOfExperience}y)</span>
        )}
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={`${
              i < skill.level
                ? `fill-yellow-400 text-yellow-400`
                : `text-gray-600`
            }`}
          />
        ))}
      </div>
    </div>
    <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
      <div
        className={`h-full bg-gradient-to-r ${getSkillColor(skill.level)} transition-all duration-500`}
        style={{ width: `${(skill.level / 5) * 100}%` }}
      />
    </div>
  </div>
));

SkillItem.displayName = 'SkillItem';

// Memoized experience item component
const ExperienceItem = memo(({ exp }: any) => (
  <div className="glass-card rounded-2xl p-4 border border-gray-600/20 hover:border-gray-600/50 transition-all duration-300 transform hover:scale-102">
    <div className="flex items-start gap-3 mb-2">
      <div className="mt-1">
        <Briefcase className="w-5 h-5 text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-white text-sm">{exp.title}</h3>
        <p className="text-purple-400 font-medium text-xs">{exp.company}</p>
        <p className="text-gray-400 text-xs">{exp.duration}</p>
        {exp.description && (
          <p className="text-gray-300 text-xs mt-2">{exp.description}</p>
        )}
      </div>
    </div>
  </div>
));

ExperienceItem.displayName = 'ExperienceItem';

// Memoized education item component
const EducationItem = memo(({ edu }: any) => (
  <div className="glass-card rounded-2xl p-4 border border-gray-600/20 hover:border-gray-600/50 transition-all duration-300">
    <div className="flex items-start gap-3">
      <div className="mt-1">
        <BookOpen className="w-5 h-5 text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-white text-sm">{edu.degree}</h3>
        <p className="text-blue-400 font-medium text-xs">{edu.school}</p>
        <p className="text-gray-400 text-xs">{edu.year}</p>
      </div>
    </div>
  </div>
));

EducationItem.displayName = 'EducationItem';

function ProfileCardContent({ profile }: { profile: ProfileData }) {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'skills' | 'experience' | 'education'>('overview');

  const getSkillColor = (level: number) => {
    if (level >= 5) return 'from-purple-500 to-pink-500';
    if (level >= 4) return 'from-blue-500 to-cyan-500';
    if (level >= 3) return 'from-green-500 to-emerald-500';
    return 'from-yellow-500 to-orange-500';
  };

  const getSkillBgColor = (level: number) => {
    if (level >= 5) return 'bg-purple-500/10';
    if (level >= 4) return 'bg-blue-500/10';
    if (level >= 3) return 'bg-green-500/10';
    return 'bg-yellow-500/10';
  };

  return (
    <div className="space-y-6">
      {/* Main Profile Card */}
      <div className="glass-card rounded-3xl p-6 md:p-8 overflow-hidden relative">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8 mb-6 md:mb-8 pb-6 md:pb-8 border-b border-gray-600/30">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-purple-400 via-pink-400 to-purple-600 flex items-center justify-center overflow-hidden animate-pulse">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-xl bg-gray-900 flex items-center justify-center">
                  <span className="text-3xl md:text-5xl font-bold gradient-text">
                    {profile.personalInfo.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              {/* Glow Ring */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-purple-400 to-pink-400 opacity-50 animate-spin-slow" style={{ animationDuration: '6s' }} />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left w-full">
              <h1 className="text-2xl md:text-4xl font-bold gradient-text mb-2">
                {profile.personalInfo.name || 'User Profile'}
              </h1>
              {profile.personalInfo.summary && (
                <p className="text-gray-300 text-sm md:text-lg mb-3 md:mb-4 max-w-2xl">
                  {profile.personalInfo.summary}
                </p>
              )}
              <div className="flex flex-wrap gap-2 md:gap-4 justify-center md:justify-start text-xs md:text-sm">
                {profile.personalInfo.location && (
                  <div className="text-gray-400">
                    <span className="text-gray-500">📍</span> {profile.personalInfo.location}
                  </div>
                )}
                {profile.personalInfo.email && (
                  <div className="text-gray-400">
                    <span className="text-gray-500">📧</span> {profile.personalInfo.email}
                  </div>
                )}
                {profile.personalInfo.phone && (
                  <div className="text-gray-400">
                    <span className="text-gray-500">📱</span> {profile.personalInfo.phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-gray-600/30 overflow-x-auto">
            {[
              { id: 'overview' as const, label: 'Overview', icon: '👁️' },
              { id: 'skills' as const, label: 'Skills', icon: '⭐' },
              { id: 'experience' as const, label: 'Experience', icon: '💼' },
              { id: 'education' as const, label: 'Education', icon: '📚' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-purple-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card rounded-2xl p-4 text-center">
                  <div className="text-3xl font-bold gradient-text mb-1">
                    {profile.experience.length}
                  </div>
                  <p className="text-gray-400 text-sm">Positions</p>
                </div>
                <div className="glass-card rounded-2xl p-4 text-center">
                  <div className="text-3xl font-bold gradient-text mb-1">
                    {profile.skills.length}
                  </div>
                  <p className="text-gray-400 text-sm">Skills</p>
                </div>
                <div className="glass-card rounded-2xl p-4 text-center">
                  <div className="text-3xl font-bold gradient-text mb-1">
                    {profile.education.length}
                  </div>
                  <p className="text-gray-400 text-sm">Degrees</p>
                </div>
              </div>
            )}

            {/* Skills Tab - Limited to 10 items (virtualization pattern) */}
            {activeTab === 'skills' && (
              <div className="space-y-3">
                {profile.skills.slice(0, 10).map((skill, index) => (
                  <SkillItem
                    key={`${skill.name}-${index}`}
                    skill={skill}
                    getSkillColor={getSkillColor}
                    getSkillBgColor={getSkillBgColor}
                  />
                ))}
                {profile.skills.length > 10 && (
                  <div className="p-3 text-center text-sm text-gray-400">
                    ... and {profile.skills.length - 10} more skills
                  </div>
                )}
              </div>
            )}

            {/* Experience Tab - Limited to 5 items */}
            {activeTab === 'experience' && (
              <div className="space-y-3">
                {profile.experience.slice(0, 5).map((exp, index) => (
                  <ExperienceItem key={`${exp.title}-${index}`} exp={exp} />
                ))}
                {profile.experience.length > 5 && (
                  <div className="p-3 text-center text-sm text-gray-400">
                    ... and {profile.experience.length - 5} more positions
                  </div>
                )}
              </div>
            )}

            {/* Education Tab - Limited to 5 items */}
            {activeTab === 'education' && (
              <div className="space-y-3">
                {profile.education.slice(0, 5).map((edu, index) => (
                  <EducationItem key={`${edu.degree}-${index}`} edu={edu} />
                ))}
                {profile.education.length > 5 && (
                  <div className="p-3 text-center text-sm text-gray-400">
                    ... and {profile.education.length - 5} more degrees
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Named export for lazy loading
export const MemoizedProfileCard = memo(ProfileCardContent);

// Default export for direct imports
export default MemoizedProfileCard;
