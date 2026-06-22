import { NextResponse } from 'next/server';
import {
  hasCurrentResume,
  hasCurrentProfile,
  getCurrentProfile,
  getResumeStats,
} from '@/lib/resume-storage';

/**
 * GET /api/profile/status
 * Returns:
 * - hasResume: boolean (is resume uploaded)
 * - profile: object (current parsed profile)
 * - stats: object (file sizes, archive count, etc)
 */
export async function GET() {
  try {
    const hasResume = await hasCurrentResume();
    const hasProfile = await hasCurrentProfile();
    const profile = hasProfile ? await getCurrentProfile() : null;
    const stats = await getResumeStats();

    return NextResponse.json({
      success: true,
      hasResume,
      hasProfile,
      profile,
      stats,
    });
  } catch (error) {
    console.error('Error getting profile status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get profile status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
