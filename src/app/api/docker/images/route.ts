import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    // Get list of Docker images
    const { stdout } = await execAsync('docker images --format "{{.Repository}}|{{.Tag}}|{{.ID}}|{{.CreatedSince}}|{{.Size}}"');

    const images = stdout
      .trim()
      .split('\n')
      .filter(line => line)
      .map(line => {
        const [repository, tag, imageId, created, size] = line.split('|');
        return {
          repository,
          tag,
          imageId,
          created,
          size
        };
      });

    return NextResponse.json({ images });
  } catch (error: any) {
    console.error('Docker images error:', error);

    if (error.message.includes('Cannot connect to the Docker daemon')) {
      return NextResponse.json(
        { error: 'Docker is not running. Please start Docker Desktop.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch Docker images' },
      { status: 500 }
    );
  }
}
