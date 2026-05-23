import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { namespace, requestId, pods } = await request.json();

    if (!namespace || !requestId || !pods || !Array.isArray(pods)) {
      return NextResponse.json(
        { error: 'Namespace, requestId, and pods array are required' },
        { status: 400 }
      );
    }

    // Search logs in parallel across all pods
    const searchPromises = pods.map(async (podName) => {
      try {
        // Get pod status first (like the bash script does)
        const statusCommand = `kubectl get pod ${podName} -n ${namespace} -o jsonpath='{.status.phase}'`;
        const { stdout: podStatus } = await execAsync(statusCommand, { timeout: 5000 });

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

        console.log(`Searching pod ${podName} (status: ${podStatus}, container: ${containerName})`);

        // Get recent logs from the pod - using --all-containers flag to search all containers
        // This matches the bash script's --all-containers option
        const logsCommand = `kubectl logs ${podName} -n ${namespace} --all-containers=true --tail=50000`;
        const { stdout } = await execAsync(logsCommand, {
          timeout: 60000, // Increased timeout for larger logs
          maxBuffer: 1024 * 1024 * 50, // 50MB buffer for large logs
        });

        // Search for request ID in logs (case-insensitive like grep -i)
        const lines = stdout.split('\n');
        const matchingLines = lines.filter(line =>
          line.toLowerCase().includes(requestId.toLowerCase())
        );

        console.log(`Pod ${podName}: Found ${matchingLines.length} matches`);

        return {
          podName,
          podStatus: podStatus.trim(),
          containerName,
          matchCount: matchingLines.length,
          logs: matchingLines.length > 0 ? matchingLines.join('\n') : null,
          hasMatch: matchingLines.length > 0,
        };
      } catch (error: any) {
        console.error(`Error searching pod ${podName}:`, error.message);
        return {
          podName,
          podStatus: 'Unknown',
          matchCount: 0,
          logs: null,
          hasMatch: false,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(searchPromises);

    // Filter to only show pods with matches and sort by match count
    const matchingResults = results
      .filter(r => r.hasMatch)
      .sort((a, b) => b.matchCount - a.matchCount);

    return NextResponse.json({
      results: matchingResults,
      totalPods: pods.length,
      podsWithMatches: matchingResults.length,
      totalMatches: matchingResults.reduce((sum, r) => sum + r.matchCount, 0),
    });
  } catch (error: any) {
    console.error('Error searching logs:', error);
    return NextResponse.json(
      { error: 'Failed to search logs', details: error.message },
      { status: 500 }
    );
  }
}
