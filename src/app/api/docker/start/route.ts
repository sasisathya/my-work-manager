import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { containerId } = await request.json();

    if (!containerId) {
      return NextResponse.json(
        { error: 'Container ID is required' },
        { status: 400 }
      );
    }

    // Start Docker container
    console.log(`Starting Docker container: ${containerId}`);
    const { stdout } = await execAsync(`docker start ${containerId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully started container: ${containerId}`,
      output: stdout
    });
  } catch (error: any) {
    console.error('Docker start error:', error);

    if (error.message.includes('Cannot connect to the Docker daemon')) {
      return NextResponse.json(
        { error: 'Docker is not running. Please start Docker Desktop.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to start Docker container' },
      { status: 500 }
    );
  }
}
