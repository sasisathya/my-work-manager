import { NextRequest, NextResponse } from 'next/server';
import {
  saveCurrentResume,
  saveCurrentProfile,
  getResumeStats,
  getCurrentResumePath,
} from '@/lib/resume-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save as current resume (archives old one if exists)
    await saveCurrentResume(buffer);

    // Get the full path to the saved resume file
    const resumePath = getCurrentResumePath();

    // Call parse API to extract data from PDF
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:2999'}/api/profile/parse`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: resumePath,
        }),
      }
    );

    const parseResult = await response.json();

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse resume',
          details: parseResult.error,
        },
        { status: 400 }
      );
    }

    // Save extracted profile data as current (archives old one if exists)
    await saveCurrentProfile(parseResult.profile);

    // Get updated stats
    const stats = await getResumeStats();

    return NextResponse.json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
      profile: parseResult.profile,
      stats,
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload resume',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
