import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Map clusters to their regions
// Note: All clusters are accessed from the same project (tlk-dev01-eng01-9115)
const CLUSTER_CONFIG: { [key: string]: { project: string; region: string } } = {
  'tlk-dev01-eng01-gke': { project: 'tlk-dev01-eng01-9115', region: 'us-east1' },
  'tlk-perf01-eng01-gke': { project: 'tlk-dev01-eng01-9115', region: 'us-central1' },
  'tlk-intgrn01-eng01-gke': { project: 'tlk-dev01-eng01-9115', region: 'us-east1' },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cluster = searchParams.get('cluster');

    if (cluster && CLUSTER_CONFIG[cluster]) {
      const config = CLUSTER_CONFIG[cluster];

      console.log(`Switching to cluster: ${cluster}, project: ${config.project}, region: ${config.region}`);

      try {
        // Step 1: Set the GCloud project (always use tlk-dev01-eng01-9115)
        const setProjectCmd = `gcloud config set project ${config.project}`;
        await execAsync(setProjectCmd, { timeout: 5000 });

        // Step 2: Get cluster credentials
        const getCredsCmd = `gcloud container clusters get-credentials ${cluster} --region ${config.region}`;
        await execAsync(getCredsCmd, { timeout: 15000 });

        console.log(`Successfully switched to cluster: ${cluster} (region: ${config.region})`);
      } catch (switchError: any) {
        console.error(`Failed to switch to cluster ${cluster}:`, switchError.message);
        // Continue to try getting namespaces with current context
      }
    }

    // Step 3: Get namespaces
    const command = `kubectl get namespaces --no-headers`;
    const { stdout, stderr } = await execAsync(command, { timeout: 10000 });

    if (stderr && !stdout) {
      throw new Error(stderr);
    }

    const namespaces = stdout
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          name: parts[0],
          status: parts[1] || 'Active',
          age: parts[2] || 'Unknown',
        };
      });

    return NextResponse.json({ namespaces });
  } catch (error: any) {
    console.error('Error getting namespaces:', error.message || error);

    // Return mock data if kubectl/gcloud is not configured
    const { searchParams } = new URL(request.url);
    const cluster = searchParams.get('cluster') || 'tlk-dev01-eng01-gke';

    // Mock namespaces for each cluster
    const mockNamespaces: { [key: string]: any[] } = {
      'tlk-dev01-eng01-gke': [
        { name: 'talk-dev', status: 'Active', age: '120d' },
        { name: 'talk-test', status: 'Active', age: '115d' },
        { name: 'notification', status: 'Active', age: '100d' },
        { name: 'notification-test', status: 'Active', age: '95d' },
        { name: 'default', status: 'Active', age: '120d' },
        { name: 'kube-system', status: 'Active', age: '120d' },
      ],
      'tlk-perf01-eng01-gke': [
        { name: 'talk-perf', status: 'Active', age: '90d' },
        { name: 'notification', status: 'Active', age: '85d' },
        { name: 'default', status: 'Active', age: '90d' },
        { name: 'kube-system', status: 'Active', age: '90d' },
      ],
      'tlk-intgrn01-eng01-gke': [
        { name: 'intgrn', status: 'Active', age: '75d' },
        { name: 'notification-intgrn', status: 'Active', age: '70d' },
        { name: 'default', status: 'Active', age: '75d' },
        { name: 'kube-system', status: 'Active', age: '75d' },
      ],
    };

    return NextResponse.json({
      namespaces: mockNamespaces[cluster] || mockNamespaces['tlk-dev01-eng01-gke'],
      note: 'Using mock data. Configure kubectl/gcloud for real namespaces.'
    });
  }
}
