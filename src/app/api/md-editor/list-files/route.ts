import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modified?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { folderPath } = await request.json();

    if (!folderPath) {
      return NextResponse.json(
        { error: 'Folder path is required' },
        { status: 400 }
      );
    }

    // Handle file:// URLs
    let cleanPath = folderPath;
    if (folderPath.startsWith('file://')) {
      // Remove file:// prefix and decode URI components
      cleanPath = decodeURIComponent(folderPath.replace('file://', ''));
    }

    // Resolve the path and prevent directory traversal attacks
    const resolvedPath = path.resolve(cleanPath);

    // Basic security check - ensure the resolved path is within user's home directory or /tmp
    const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp';
    if (!resolvedPath.startsWith(homeDir) && !resolvedPath.startsWith('/tmp')) {
      return NextResponse.json(
        { error: 'Access denied: Can only access files in home directory or /tmp' },
        { status: 403 }
      );
    }

    // Check if directory exists
    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json(
        { error: 'Directory does not exist' },
        { status: 404 }
      );
    }

    const stats = fs.statSync(resolvedPath);
    if (!stats.isDirectory()) {
      return NextResponse.json(
        { error: 'Path is not a directory' },
        { status: 400 }
      );
    }

    // Read directory contents
    const files = fs.readdirSync(resolvedPath);

    const fileList: FileItem[] = files
      .map(file => {
        const filePath = path.join(resolvedPath, file);
        try {
          const fileStats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            isDirectory: fileStats.isDirectory(),
            size: fileStats.size,
            modified: fileStats.mtime.toISOString(),
          } as FileItem;
        } catch (err) {
          // Skip files we can't stat
          return null;
        }
      })
      .filter((item): item is FileItem => item !== null)
      .sort((a: FileItem, b: FileItem) => {
        // Directories first, then alphabetically
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({
      success: true,
      folderPath: resolvedPath,
      files: fileList,
    });
  } catch (error: any) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list files' },
      { status: 500 }
    );
  }
}
