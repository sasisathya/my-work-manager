import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
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

    // Check if file exists
    try {
      await fs.access(resolvedPath);
    } catch {
      return NextResponse.json(
        { error: `File not found: ${filePath}` },
        { status: 404 }
      );
    }

    // Get file extension
    const ext = path.extname(resolvedPath).toLowerCase();

    // Supported text-based file extensions
    const textExtensions = ['.md', '.markdown', '.html', '.htm', '.txt'];

    // Check if it's a text-based file that can be read as text
    if (textExtensions.includes(ext)) {
      // Read text-based files
      const content = await fs.readFile(resolvedPath, 'utf-8');
      const fileName = path.basename(resolvedPath);

      return NextResponse.json({
        success: true,
        content,
        fileName,
        filePath: resolvedPath,
        fileType: 'text',
      });
    }

    // For binary files (PDF, Excel, Word), read as buffer and convert to base64
    const binaryExtensions = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv'];

    if (binaryExtensions.includes(ext)) {
      // Read the binary file
      const buffer = await fs.readFile(resolvedPath);
      const base64Data = buffer.toString('base64');
      const fileName = path.basename(resolvedPath);

      return NextResponse.json({
        success: true,
        fileName,
        filePath: resolvedPath,
        fileType: 'binary',
        data: base64Data,
        extension: ext,
      });
    }

    // Unsupported file type
    return NextResponse.json(
      { error: `Unsupported file type: ${ext}. Supported types: .md, .markdown, .html, .htm, .pdf, .docx, .xlsx` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Read file error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to read file' },
      { status: 500 }
    );
  }
}
