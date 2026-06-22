import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';

export async function GET(request: NextRequest) {
  try {
    const filePath = request.nextUrl.searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Decode the path
    const decodedPath = decodeURIComponent(filePath);
    const resolvedPath = path.resolve(decodedPath);

    // Basic security check - ensure the resolved path is within user's home directory or /tmp
    const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp';
    if (!resolvedPath.startsWith(homeDir) && !resolvedPath.startsWith('/tmp')) {
      return NextResponse.json(
        { error: 'Access denied: Can only access files in home directory or /tmp' },
        { status: 403 }
      );
    }

    // Check if file exists
    try {
      await fs.access(resolvedPath);
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read the file
    const fileContent = await fs.readFile(resolvedPath);

    // Determine MIME type
    const ext = path.extname(resolvedPath).toLowerCase();
    const mimeType = mime.lookup(ext) || 'application/octet-stream';

    // Return the file with appropriate headers
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Serve file error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to serve file' },
      { status: 500 }
    );
  }
}
