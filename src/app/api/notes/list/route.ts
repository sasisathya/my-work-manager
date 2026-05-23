import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const NOTES_DIR = path.join(process.cwd(), 'data', 'notes');

export async function GET(request: NextRequest) {
  try {
    // Ensure notes directory exists
    if (!fs.existsSync(NOTES_DIR)) {
      fs.mkdirSync(NOTES_DIR, { recursive: true });
    }

    // Read all note files
    const files = fs.readdirSync(NOTES_DIR);
    const notes = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(NOTES_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ notes });
  } catch (error: any) {
    console.error('Error loading notes:', error);
    return NextResponse.json(
      { error: 'Failed to load notes', details: error.message },
      { status: 500 }
    );
  }
}
