import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { podName, namespace } = await request.json();

    if (!podName || !namespace) {
      return NextResponse.json(
        { error: 'Pod name and namespace are required' },
        { status: 400 }
      );
    }

    const command = `kubectl describe pod ${podName} -n ${namespace}`;
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10,
    });

    return NextResponse.json({
      output: stdout || stderr,
      success: !stderr || stdout.length > 0,
    });
  } catch (error: any) {
    console.error('Error describing pod:', error);
    return NextResponse.json(
      { error: 'Failed to describe pod', output: error.message },
      { status: 500 }
    );
  }
}
