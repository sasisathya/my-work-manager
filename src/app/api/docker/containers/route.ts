import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    // Get list of Docker containers (including stopped ones)
    const { stdout } = await execAsync('docker ps -a --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.State}}|{{.Ports}}|{{.CreatedAt}}"');

    const containers = stdout
      .trim()
      .split('\n')
      .filter(line => line)
      .map(line => {
        const [id, name, image, status, state, ports, created] = line.split('|');
        return {
          id,
          name,
          image,
          status,
          state,
          ports,
          created
        };
      });

    return NextResponse.json({ containers });
  } catch (error: any) {
    console.error('Docker containers error:', error);

    if (error.message.includes('Cannot connect to the Docker daemon')) {
      return NextResponse.json(
        { error: 'Docker is not running. Please start Docker Desktop.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch Docker containers' },
      { status: 500 }
    );
  }
}
