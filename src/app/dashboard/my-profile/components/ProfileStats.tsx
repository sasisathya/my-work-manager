'use client';

import React from 'react';
import { TrendingUp, Target, Zap, Award } from 'lucide-react';

interface Skill {
  name: string;
  level: number;
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

export default function ProfileStats({ profile }: { profile: ProfileData }) {
  // Calculate statistics
  const calculateStats = () => {
    const totalSkillPoints = profile.skills.reduce((sum, skill) => sum + skill.level, 0);
    const avgSkillLevel = profile.skills.length > 0 ? (totalSkillPoints / (profile.skills.length * 5)) * 100 : 0;

    const topSkills = [...profile.skills]
      .sort((a, b) => b.level - a.level)
      .slice(0, 3);

    const totalYearsExperience = profile.skills.reduce((sum, skill) => sum + (skill.yearsOfExperience || 0), 0);

    return {
      avgSkillLevel: Math.round(avgSkillLevel),
      topSkills,
      totalYearsExperience,
      skillCount: profile.skills.length,
      experienceCount: profile.experience.length,
      certCount: profile.certifications?.length || 0,
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Skill Level */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden group hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 font-medium">Skill Level</h3>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-4xl font-bold gradient-text mb-2">{stats.avgSkillLevel}%</div>
            <p className="text-gray-400 text-sm">Overall proficiency</p>
            {/* Progress Bar */}
            <div className="h-2 bg-gray-700/50 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700"
                style={{ width: `${stats.avgSkillLevel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Years of Experience */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden group hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 font-medium">Experience</h3>
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-4xl font-bold gradient-text mb-2">{stats.totalYearsExperience}</div>
            <p className="text-gray-400 text-sm">Years combined</p>
          </div>
        </div>

        {/* Total Skills */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden group hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 font-medium">Skills</h3>
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-4xl font-bold gradient-text mb-2">{stats.skillCount}</div>
            <p className="text-gray-400 text-sm">Distinct skills</p>
          </div>
        </div>

        {/* Certifications */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden group hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 font-medium">Certifications</h3>
              <Award className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-4xl font-bold gradient-text mb-2">{stats.certCount}</div>
            <p className="text-gray-400 text-sm">Achievements</p>
          </div>
        </div>
      </div>

      {/* Top Skills Section */}
      {stats.topSkills.length > 0 && (
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-2xl font-bold gradient-text mb-6">Top Skills</h2>
          <div className="space-y-4">
            {stats.topSkills.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-sm font-bold text-purple-400">
                      {index + 1}
                    </div>
                    <span className="font-semibold text-white">{skill.name}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < skill.level
                            ? 'bg-gradient-to-r from-purple-400 to-pink-400'
                            : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-full transition-all duration-700"
                    style={{
                      width: `${(skill.level / 5) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positions & Education Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Positions */}
        {profile.experience.length > 0 && (
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-bold gradient-text mb-4">Recent Positions</h3>
            <div className="space-y-3">
              {profile.experience.slice(0, 3).map((exp, index) => (
                <div key={index} className="text-sm">
                  <p className="font-semibold text-white">{exp.title}</p>
                  <p className="text-purple-400 text-xs">{exp.company}</p>
                  <p className="text-gray-400 text-xs">{exp.duration}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Background */}
        {profile.education.length > 0 && (
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-bold gradient-text mb-4">Education</h3>
            <div className="space-y-3">
              {profile.education.slice(0, 3).map((edu, index) => (
                <div key={index} className="text-sm">
                  <p className="font-semibold text-white">{edu.degree}</p>
                  <p className="text-blue-400 text-xs">{edu.school}</p>
                  <p className="text-gray-400 text-xs">{edu.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Certifications Section */}
      {profile.certifications && profile.certifications.length > 0 && (
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-2xl font-bold gradient-text mb-6">Certifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.certifications.map((cert, index) => (
              <div key={index} className="glass-card rounded-2xl p-4 border border-yellow-500/20 bg-yellow-500/5">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-white">{cert.name}</p>
                    <p className="text-gray-400 text-sm">{cert.issuer}</p>
                    <p className="text-gray-500 text-xs">{cert.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
