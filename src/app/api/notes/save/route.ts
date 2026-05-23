import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const NOTES_DIR = path.join(process.cwd(), 'data', 'notes');

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const note: Note = await request.json();

    // Validate note data
    if (!note.id || !note.title) {
      return NextResponse.json(
        { error: 'Invalid note data: id and title are required' },
        { status: 400 }
      );
    }

    // Ensure notes directory exists
    if (!fs.existsSync(NOTES_DIR)) {
      fs.mkdirSync(NOTES_DIR, { recursive: true });
    }

    // Save note to file
    const fileName = `${note.id}.json`;
    const filePath = path.join(NOTES_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(note, null, 2), 'utf-8');

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error('Error saving note:', error);
    return NextResponse.json(
      { error: 'Failed to save note', details: error.message },
      { status: 500 }
    );
  }
}
