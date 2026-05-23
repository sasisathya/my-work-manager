import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const namespace = searchParams.get('namespace') || 'default';

    const command = `kubectl get pods -n ${namespace} --no-headers`;
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stdout) {
      throw new Error(stderr);
    }

    // Parse kubectl output into structured data
    const pods = stdout
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          name: parts[0],
          namespace: namespace,
          ready: parts[1],
          status: parts[2],
          restarts: parseInt(parts[3]) || 0,
          age: parts[4],
        };
      });

    return NextResponse.json({ pods });
  } catch (error: any) {
    console.error('Error getting pods:', error);

    // Return mock data if kubectl is not configured
    const searchParams = request.nextUrl.searchParams;
    const namespace = searchParams.get('namespace') || 'default';

    // Generate mock pods based on namespace
    const mockPods = Array.from({ length: 5 }, (_, i) => ({
      name: `${namespace}-pod-${i + 1}-${Math.random().toString(36).substring(7)}`,
      namespace: namespace,
      ready: '1/1',
      status: 'Running',
      restarts: Math.floor(Math.random() * 3),
      age: `${Math.floor(Math.random() * 30) + 1}d`,
    }));

    return NextResponse.json({
      pods: mockPods,
      note: 'Using mock data. Configure kubectl for real pods.'
    });
  }
}
