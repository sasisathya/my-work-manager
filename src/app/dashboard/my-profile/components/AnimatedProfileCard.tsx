'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Code2,
  BookOpen,
  Award,
  Github,
  Linkedin,
  ExternalLink,
} from 'lucide-react';

interface ProfileData {
  personalInfo: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
  skills: Array<{
    name: string;
    level: number;
    category?: string;
    yearsOfExperience?: number;
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description?: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
    field?: string;
    grade?: string;
  }>;
  metadata: {
    totalYearsExperience: number;
    completionScore: number;
  };
}

interface AnimatedProfileCardProps {
  profile: ProfileData;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const skillBarVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.6 },
  },
};

export default function AnimatedProfileCard({ profile }: AnimatedProfileCardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'experience' | 'education'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'skills', label: 'Skills', icon: Code2 },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: BookOpen },
  ];

  const getLevelColor = (level: number) => {
    if (level >= 5) return 'from-emerald-500 to-teal-500';
    if (level >= 4) return 'from-blue-500 to-cyan-500';
    if (level >= 3) return 'from-purple-500 to-pink-500';
    return 'from-orange-500 to-yellow-500';
  };

  const getLevelLabel = (level: number) => {
    const labels = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert', 'Master'];
    return labels[Math.min(level - 1, 5)] || 'Expert';
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Hero Card with 3D Effect */}
      <motion.div
        variants={itemVariants}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300" />

        <div className="relative glass-card rounded-3xl overflow-hidden">
          {/* Background gradient animation */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />

          {/* Content */}
          <div className="relative p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              {/* Profile Picture Area with 3D effect */}
              <motion.div
                className="md:col-span-1 flex justify-center"
                initial={{ opacity: 0, rotateY: -20 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <div className="relative">
                  {/* Floating background circles */}
                  <motion.div
                    className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0.7, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <motion.div
                    className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-md opacity-30"
                    animate={{
                      scale: [1.1, 1, 1.1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 3,
                      delay: 0.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />

                  {/* Profile Avatar */}
                  <div className="relative w-40 h-40 md:w-48 md:h-48 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-purple-400/50">
                    <div className="text-7xl font-bold text-white">
                      {profile.personalInfo.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Profile Info */}
              <motion.div
                className="md:col-span-2 space-y-6"
                variants={itemVariants}
              >
                {/* Name and Title */}
                <div>
                  <motion.h1
                    className="text-4xl md:text-5xl font-bold text-white mb-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {profile.personalInfo.name}
                  </motion.h1>
                  <motion.p
                    className="text-xl text-purple-300 font-semibold"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    Software Engineer III • {profile.metadata.totalYearsExperience}+ Years Experience
                  </motion.p>
                </div>

                {/* Contact Info */}
                <motion.div
                  className="grid grid-cols-2 gap-4"
                  variants={itemVariants}
                >
                  {profile.personalInfo.email && (
                    <div className="flex items-center gap-2 text-gray-300 hover:text-purple-300 transition-colors cursor-pointer group">
                      <Mail className="w-5 h-5 group-hover:scale-125 transition-transform" />
                      <span className="text-sm truncate">{profile.personalInfo.email}</span>
                    </div>
                  )}
                  {profile.personalInfo.phone && (
                    <div className="flex items-center gap-2 text-gray-300 hover:text-blue-300 transition-colors cursor-pointer group">
                      <Phone className="w-5 h-5 group-hover:scale-125 transition-transform" />
                      <span className="text-sm">{profile.personalInfo.phone}</span>
                    </div>
                  )}
                  {profile.personalInfo.location && (
                    <div className="flex items-center gap-2 text-gray-300 hover:text-pink-300 transition-colors cursor-pointer group col-span-2">
                      <MapPin className="w-5 h-5 group-hover:scale-125 transition-transform" />
                      <span className="text-sm">{profile.personalInfo.location}</span>
                    </div>
                  )}
                </motion.div>

                {/* Stats */}
                <motion.div
                  className="grid grid-cols-3 gap-4"
                  variants={itemVariants}
                >
                  {[
                    {
                      label: 'Experience',
                      value: `${profile.metadata.totalYearsExperience}+`,
                      unit: 'Years',
                    },
                    {
                      label: 'Skills',
                      value: profile.skills.length,
                      unit: 'Total',
                    },
                    {
                      label: 'Profile',
                      value: profile.metadata.completionScore,
                      unit: '%',
                    },
                  ].map((stat, idx) => (
                    <motion.div
                      key={idx}
                      className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/50 transition-colors"
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                      <div className="text-xs text-gray-400 mt-1">{stat.unit}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        variants={itemVariants}
        className="flex gap-2 flex-wrap"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Content Sections */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {profile.personalInfo.summary && (
              <motion.div
                variants={itemVariants}
                className="glass-card rounded-2xl p-6 border-l-4 border-purple-500"
              >
                <h3 className="text-lg font-semibold text-white mb-3">Professional Summary</h3>
                <p className="text-gray-300 leading-relaxed text-justify">
                  {profile.personalInfo.summary}
                </p>
              </motion.div>
            )}

            {/* Quick Stats */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-purple-400" />
                  Top Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.slice(0, 5).map((skill, idx) => (
                    <motion.span
                      key={idx}
                      className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-full text-sm text-purple-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {skill.name}
                    </motion.span>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-400" />
                  Achievements
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">✓</span>
                    <span>Recognized 8 times with Star of the Sprint Award</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">✓</span>
                    <span>3rd place in 48-hour engineering hackathon</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Group skills by category */}
            {['Technical', 'Soft'].map((category) => {
              const categorySkills = profile.skills.filter((s) => s.category === category);
              if (categorySkills.length === 0) return null;

              return (
                <div key={category} className="space-y-4">
                  <h3 className="text-xl font-semibold text-white capitalize">{category} Skills</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categorySkills.map((skill, idx) => (
                      <motion.div
                        key={idx}
                        variants={itemVariants}
                        className="glass-card rounded-xl p-4 hover:border-purple-500/50 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-white">{skill.name}</span>
                          <span className="text-sm text-purple-300">{getLevelLabel(skill.level)}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
                          <motion.div
                            variants={skillBarVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: idx * 0.1, duration: 0.6 }}
                            className={`h-full bg-gradient-to-r ${getLevelColor(skill.level)} origin-left`}
                            style={{ width: `${(skill.level / 5) * 100}%` }}
                          />
                        </div>
                        {skill.yearsOfExperience && (
                          <div className="text-xs text-gray-400 mt-2">
                            {skill.yearsOfExperience}+ years experience
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Experience Tab */}
        {activeTab === 'experience' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {profile.experience.map((exp, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="glass-card rounded-2xl p-6 border-l-4 border-blue-500 hover:border-blue-400 transition-colors"
                whileHover={{ x: 5 }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{exp.title}</h3>
                    <p className="text-purple-300 font-medium">{exp.company}</p>
                  </div>
                  <span className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
                    {exp.duration}
                  </span>
                </div>
                {exp.description && (
                  <p className="text-gray-300 text-sm leading-relaxed mt-3">{exp.description}</p>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Education Tab */}
        {activeTab === 'education' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {profile.education.map((edu, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="glass-card rounded-2xl p-6 border-l-4 border-green-500"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{edu.degree}</h3>
                    <p className="text-green-300 font-medium">{edu.school}</p>
                    {edu.field && <p className="text-gray-400 text-sm">{edu.field}</p>}
                  </div>
                  <span className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
                    {edu.year}
                  </span>
                </div>
                {edu.grade && (
                  <div className="mt-3 text-sm text-gray-400">
                    CGPA: <span className="text-green-300 font-semibold">{edu.grade}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
