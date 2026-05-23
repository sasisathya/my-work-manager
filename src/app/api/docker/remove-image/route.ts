import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Remove Docker image
    console.log(`Removing Docker image: ${imageId}`);
    const { stdout } = await execAsync(`docker rmi ${imageId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully removed image: ${imageId}`,
      output: stdout
    });
  } catch (error: any) {
    console.error('Docker remove image error:', error);

    if (error.message.includes('Cannot connect to the Docker daemon')) {
      return NextResponse.json(
        { error: 'Docker is not running. Please start Docker Desktop.' },
        { status: 503 }
      );
    }

    if (error.message.includes('image is being used')) {
      return NextResponse.json(
        { error: 'Cannot remove image. It is being used by one or more containers. Stop and remove containers first.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to remove Docker image' },
      { status: 500 }
    );
  }
}
