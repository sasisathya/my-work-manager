import fs from 'fs/promises';
import path from 'path';

/**
 * Resume Storage Utility
 *
 * Handles:
 * - Current resume: resume-current.pdf (always used for parsing)
 * - Archived resumes: resume-YYYY-MM-DD-HH-mm-ss.pdf (timestamped backups)
 * - JSON profiles: profile-current.json (always used for display)
 * - Archived profiles: profile-YYYY-MM-DD-HH-mm-ss.json (timestamped backups)
 */

const PROFILES_DIR = path.join(process.cwd(), 'data', 'profiles');
const CURRENT_RESUME_NAME = 'resume-current.pdf';
const CURRENT_PROFILE_NAME = 'profile-current.json';

/**
 * Ensure profiles directory exists
 */
export async function ensureProfilesDir(): Promise<void> {
  try {
    await fs.mkdir(PROFILES_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating profiles directory:', error);
    throw error;
  }
}

/**
 * Get current timestamp in format: YYYY-MM-DD-HH-mm-ss
 */
function getTimestamp(): string {
  const now = new Date();
  return now
    .toISOString()
    .replace(/[:.]/g, '-')
    .split('.')[0];
}

/**
 * Archive existing resume if it exists
 * Renames: resume-current.pdf -> resume-YYYY-MM-DD-HH-mm-ss.pdf
 */
export async function archiveCurrentResume(): Promise<string | null> {
  try {
    const currentPath = path.join(PROFILES_DIR, CURRENT_RESUME_NAME);

    // Check if current resume exists
    try {
      await fs.access(currentPath);
    } catch {
      // File doesn't exist, nothing to archive
      return null;
    }

    // Create archived filename with timestamp
    const timestamp = getTimestamp();
    const archivedName = `resume-${timestamp}.pdf`;
    const archivedPath = path.join(PROFILES_DIR, archivedName);

    // Rename current to archived
    await fs.rename(currentPath, archivedPath);

    console.log(`Archived resume: ${CURRENT_RESUME_NAME} -> ${archivedName}`);
    return archivedName;
  } catch (error) {
    console.error('Error archiving current resume:', error);
    throw error;
  }
}

/**
 * Archive existing profile if it exists
 * Renames: profile-current.json -> profile-YYYY-MM-DD-HH-mm-ss.json
 */
export async function archiveCurrentProfile(): Promise<string | null> {
  try {
    const currentPath = path.join(PROFILES_DIR, CURRENT_PROFILE_NAME);

    // Check if current profile exists
    try {
      await fs.access(currentPath);
    } catch {
      // File doesn't exist, nothing to archive
      return null;
    }

    // Create archived filename with timestamp
    const timestamp = getTimestamp();
    const archivedName = `profile-${timestamp}.json`;
    const archivedPath = path.join(PROFILES_DIR, archivedName);

    // Rename current to archived
    await fs.rename(currentPath, archivedPath);

    console.log(`Archived profile: ${CURRENT_PROFILE_NAME} -> ${archivedName}`);
    return archivedName;
  } catch (error) {
    console.error('Error archiving current profile:', error);
    throw error;
  }
}

/**
 * Save resume file as current
 * If current exists, archives it first
 */
export async function saveCurrentResume(buffer: Buffer): Promise<void> {
  try {
    await ensureProfilesDir();

    // Archive existing resume if it exists
    await archiveCurrentResume();

    // Save new resume as current
    const currentPath = path.join(PROFILES_DIR, CURRENT_RESUME_NAME);
    await fs.writeFile(currentPath, buffer);

    console.log(`Saved new current resume: ${CURRENT_RESUME_NAME}`);
  } catch (error) {
    console.error('Error saving current resume:', error);
    throw error;
  }
}

/**
 * Save profile JSON as current
 * If current exists, archives it first
 */
export async function saveCurrentProfile(profileData: any): Promise<void> {
  try {
    await ensureProfilesDir();

    // Archive existing profile if it exists
    await archiveCurrentProfile();

    // Save new profile as current
    const currentPath = path.join(PROFILES_DIR, CURRENT_PROFILE_NAME);
    await fs.writeFile(currentPath, JSON.stringify(profileData, null, 2));

    console.log(`Saved new current profile: ${CURRENT_PROFILE_NAME}`);
  } catch (error) {
    console.error('Error saving current profile:', error);
    throw error;
  }
}

/**
 * Get current resume path
 */
export function getCurrentResumePath(): string {
  return path.join(PROFILES_DIR, CURRENT_RESUME_NAME);
}

/**
 * Get current profile path
 */
export function getCurrentProfilePath(): string {
  return path.join(PROFILES_DIR, CURRENT_PROFILE_NAME);
}

/**
 * Check if current resume exists
 */
export async function hasCurrentResume(): Promise<boolean> {
  try {
    await fs.access(getCurrentResumePath());
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if current profile exists
 */
export async function hasCurrentProfile(): Promise<boolean> {
  try {
    await fs.access(getCurrentProfilePath());
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current profile data
 */
export async function getCurrentProfile(): Promise<any | null> {
  try {
    const hasProfile = await hasCurrentProfile();
    if (!hasProfile) return null;

    const content = await fs.readFile(getCurrentProfilePath(), 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading current profile:', error);
    return null;
  }
}

/**
 * Get all archived resumes (sorted by date, newest first)
 */
export async function getArchivedResumes(): Promise<string[]> {
  try {
    const files = await fs.readdir(PROFILES_DIR);
    const archived = files
      .filter((f) => f.startsWith('resume-') && f !== CURRENT_RESUME_NAME)
      .sort()
      .reverse();
    return archived;
  } catch (error) {
    console.error('Error listing archived resumes:', error);
    return [];
  }
}

/**
 * Get all archived profiles (sorted by date, newest first)
 */
export async function getArchivedProfiles(): Promise<string[]> {
  try {
    const files = await fs.readdir(PROFILES_DIR);
    const archived = files
      .filter((f) => f.startsWith('profile-') && f !== CURRENT_PROFILE_NAME)
      .sort()
      .reverse();
    return archived;
  } catch (error) {
    console.error('Error listing archived profiles:', error);
    return [];
  }
}

/**
 * Delete all archived resumes (keep only current)
 * Useful for cleanup
 */
export async function deleteArchivedResumes(): Promise<void> {
  try {
    const archived = await getArchivedResumes();
    for (const file of archived) {
      const filePath = path.join(PROFILES_DIR, file);
      await fs.unlink(filePath);
    }
    console.log(`Deleted ${archived.length} archived resumes`);
  } catch (error) {
    console.error('Error deleting archived resumes:', error);
    throw error;
  }
}

/**
 * Delete all archived profiles (keep only current)
 * Useful for cleanup
 */
export async function deleteArchivedProfiles(): Promise<void> {
  try {
    const archived = await getArchivedProfiles();
    for (const file of archived) {
      const filePath = path.join(PROFILES_DIR, file);
      await fs.unlink(filePath);
    }
    console.log(`Deleted ${archived.length} archived profiles`);
  } catch (error) {
    console.error('Error deleting archived profiles:', error);
    throw error;
  }
}

/**
 * Delete current resume and profile (reset)
 */
export async function deleteCurrentResume(): Promise<void> {
  try {
    const currentPath = path.join(PROFILES_DIR, CURRENT_RESUME_NAME);
    try {
      await fs.unlink(currentPath);
      console.log(`Deleted current resume: ${CURRENT_RESUME_NAME}`);
    } catch {
      // Already deleted
    }
  } catch (error) {
    console.error('Error deleting current resume:', error);
    throw error;
  }
}

export async function deleteCurrentProfile(): Promise<void> {
  try {
    const currentPath = path.join(PROFILES_DIR, CURRENT_PROFILE_NAME);
    try {
      await fs.unlink(currentPath);
      console.log(`Deleted current profile: ${CURRENT_PROFILE_NAME}`);
    } catch {
      // Already deleted
    }
  } catch (error) {
    console.error('Error deleting current profile:', error);
    throw error;
  }
}

/**
 * Get resume file size in MB
 */
export async function getResumeFileSize(): Promise<number | null> {
  try {
    const stats = await fs.stat(getCurrentResumePath());
    return stats.size / (1024 * 1024); // Convert to MB
  } catch {
    return null;
  }
}

/**
 * Get profile statistics
 */
export async function getResumeStats(): Promise<{
  hasCurrentResume: boolean;
  hasCurrentProfile: boolean;
  currentResumeSize: number | null;
  archivedCount: number;
  lastUpdated: string | null;
}> {
  try {
    const hasResume = await hasCurrentResume();
    const hasProfile = await hasCurrentProfile();
    const fileSize = hasResume ? await getResumeFileSize() : null;
    const archived = await getArchivedResumes();

    let lastUpdated: string | null = null;
    if (hasProfile) {
      const stats = await fs.stat(getCurrentProfilePath());
      lastUpdated = stats.mtime.toISOString();
    }

    return {
      hasCurrentResume: hasResume,
      hasCurrentProfile: hasProfile,
      currentResumeSize: fileSize,
      archivedCount: archived.length,
      lastUpdated,
    };
  } catch (error) {
    console.error('Error getting resume stats:', error);
    return {
      hasCurrentResume: false,
      hasCurrentProfile: false,
      currentResumeSize: null,
      archivedCount: 0,
      lastUpdated: null,
    };
  }
}
