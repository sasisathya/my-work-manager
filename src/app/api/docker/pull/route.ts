import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image name is required' },
        { status: 400 }
      );
    }

    // Pull Docker image
    console.log(`Pulling Docker image: ${image}`);
    const { stdout, stderr } = await execAsync(`docker pull ${image}`);

    return NextResponse.json({
      success: true,
      message: `Successfully pulled image: ${image}`,
      output: stdout
    });
  } catch (error: any) {
    console.error('Docker pull error:', error);

    if (error.message.includes('Cannot connect to the Docker daemon')) {
      return NextResponse.json(
        { error: 'Docker is not running. Please start Docker Desktop.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to pull Docker image' },
      { status: 500 }
    );
  }
}
