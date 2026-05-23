import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { podName, namespace, tail, follow } = await request.json();

    if (!podName || !namespace) {
      return NextResponse.json(
        { error: 'Pod name and namespace are required' },
        { status: 400 }
      );
    }

    // Get container names for this pod
    const containersCommand = `kubectl get pod ${podName} -n ${namespace} -o jsonpath='{.spec.containers[*].name}'`;
    const { stdout: containersOut } = await execAsync(containersCommand, { timeout: 5000 });

    const containers = containersOut.trim().split(' ');
    // Filter out sidecar containers (istio-proxy, envoy, etc.)
    const mainContainers = containers.filter(c =>
      !c.includes('istio') &&
      !c.includes('envoy') &&
      !c.includes('proxy') &&
      !c.includes('sidecar')
    );

    // Use the first main container, or first container if no main found
    const containerName = mainContainers.length > 0 ? mainContainers[0] : containers[0];

    const tailLines = tail || 5000; // Increased default from 500 to 5000
    const command = `kubectl logs ${podName} -n ${namespace} -c ${containerName} --tail=${tailLines}`;

    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000,
      maxBuffer: 1024 * 1024 * 50,
    });

    return NextResponse.json({
      output: stdout || stderr || 'No logs available',
      containerName,
      success: true,
    });
  } catch (error: any) {
    console.error('Error getting logs:', error);
    return NextResponse.json(
      { error: 'Failed to get logs', output: error.message },
      { status: 500 }
    );
  }
}
