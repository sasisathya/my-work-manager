import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

    // Create profiles directory if it doesn't exist
    const profilesDir = path.join(process.cwd(), 'data', 'profiles');
    await mkdir(profilesDir, { recursive: true });

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `resume_${timestamp}.pdf`;
    const filepath = path.join(profilesDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Call parse API to extract data from PDF
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:2999'}/api/profile/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        filePath: filepath,
      }),
    });

    const parseResult = await response.json();

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse resume', details: parseResult.error },
        { status: 400 }
      );
    }

    // Save extracted profile data
    const profilePath = path.join(profilesDir, `profile_${timestamp}.json`);
    await writeFile(profilePath, JSON.stringify(parseResult.profile, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
      profile: parseResult.profile,
      filename,
      profilePath,
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
