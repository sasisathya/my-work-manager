import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { filePath, content } = await request.json();

    if (!filePath || content === undefined) {
      return NextResponse.json(
        { error: 'File path and content are required' },
        { status: 400 }
      );
    }

    // Handle file:// URLs
    let cleanPath = filePath;
    if (filePath.startsWith('file://')) {
      // Remove file:// prefix and decode URI components
      cleanPath = decodeURIComponent(filePath.replace('file://', ''));
    }

    // Resolve the file path
    const resolvedPath = path.resolve(cleanPath);

    // Get file extension
    const ext = path.extname(resolvedPath).toLowerCase();

    // Supported text-based file extensions for saving
    const textExtensions = ['.md', '.markdown', '.html', '.htm', '.txt'];

    // Check if it's a text-based file that can be saved
    if (!textExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `Cannot save binary files. Supported types for saving: .md, .markdown, .html, .htm, .txt` },
        { status: 400 }
      );
    }

    // Ensure directory exists
    const directory = path.dirname(resolvedPath);
    await fs.mkdir(directory, { recursive: true });

    // Write the file
    await fs.writeFile(resolvedPath, content, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'File saved successfully',
      filePath: resolvedPath,
    });

  } catch (error: any) {
    console.error('Save file error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save file' },
      { status: 500 }
    );
  }
}
