import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Whitelist of allowed commands for security
const ALLOWED_COMMANDS = [
  'kubectl get',
  'kubectl describe',
  'kubectl logs',
  'kubectl top',
  'kubectl exec',
  'gcloud projects',
  'gcloud config',
  'gcloud container',
];

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'Invalid command' },
        { status: 400 }
      );
    }

    // Security check: only allow whitelisted commands
    const isAllowed = ALLOWED_COMMANDS.some(allowed =>
      command.trim().toLowerCase().startsWith(allowed.toLowerCase())
    );

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Command not allowed. Only kubectl and gcloud read-only commands are permitted.' },
        { status: 403 }
      );
    }

    // Execute command with timeout
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000, // 30 second timeout
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });

    return NextResponse.json({
      output: stdout || stderr,
      success: !stderr || stdout.length > 0,
    });
  } catch (error: any) {
    console.error('Error executing command:', error);
    return NextResponse.json(
      { error: 'Failed to execute command', output: error.message },
      { status: 500 }
    );
  }
}
