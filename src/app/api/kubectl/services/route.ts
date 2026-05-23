import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const namespace = searchParams.get('namespace') || 'default';

    // Get services
    const command = `kubectl get services -n ${namespace} --no-headers`;
    const { stdout, stderr } = await execAsync(command, { timeout: 10000 });

    if (stderr && !stdout) {
      throw new Error(stderr);
    }

    // Parse kubectl output into structured data
    const services = await Promise.all(
      stdout
        .trim()
        .split('\n')
        .filter(line => line.trim())
        .map(async (line) => {
          const parts = line.trim().split(/\s+/);
          const serviceName = parts[0];

          // Get pods for this service using label selector
          try {
            const podsCmd = `kubectl get pods -n ${namespace} -l app=${serviceName} --no-headers`;
            const { stdout: podsOut } = await execAsync(podsCmd, { timeout: 5000 });

            const pods = podsOut
              .trim()
              .split('\n')
              .filter(line => line.trim())
              .map(podLine => {
                const podParts = podLine.trim().split(/\s+/);
                return {
                  name: podParts[0],
                  ready: podParts[1],
                  status: podParts[2],
                  restarts: parseInt(podParts[3]) || 0,
                  age: podParts[4],
                };
              });

            return {
              name: serviceName,
              namespace: namespace,
              type: parts[1] || 'ClusterIP',
              clusterIP: parts[2] || 'None',
              externalIP: parts[3] || '<none>',
              ports: parts[4] || '',
              age: parts[5] || '',
              podCount: pods.length,
              pods: pods,
            };
          } catch (podError) {
            console.error(`Failed to get pods for service ${serviceName}:`, podError);
            return {
              name: serviceName,
              namespace: namespace,
              type: parts[1] || 'ClusterIP',
              clusterIP: parts[2] || 'None',
              externalIP: parts[3] || '<none>',
              ports: parts[4] || '',
              age: parts[5] || '',
              podCount: 0,
              pods: [],
            };
          }
        })
    );

    return NextResponse.json({ services });
  } catch (error: any) {
    console.error('Error getting services:', error);

    // Return mock data if kubectl is not configured
    const searchParams = request.nextUrl.searchParams;
    const namespace = searchParams.get('namespace') || 'default';

    const mockServices = [
      {
        name: `${namespace}-api`,
        namespace: namespace,
        type: 'ClusterIP',
        clusterIP: '10.0.0.1',
        externalIP: '<none>',
        ports: '8080/TCP',
        age: '30d',
        podCount: 3,
        pods: [
          { name: `${namespace}-api-pod-1`, ready: '1/1', status: 'Running', restarts: 0, age: '10d' },
          { name: `${namespace}-api-pod-2`, ready: '1/1', status: 'Running', restarts: 0, age: '8d' },
          { name: `${namespace}-api-pod-3`, ready: '1/1', status: 'Running', restarts: 1, age: '5d' },
        ],
      },
      {
        name: `${namespace}-web`,
        namespace: namespace,
        type: 'LoadBalancer',
        clusterIP: '10.0.0.2',
        externalIP: '35.1.2.3',
        ports: '80:30080/TCP',
        age: '25d',
        podCount: 2,
        pods: [
          { name: `${namespace}-web-pod-1`, ready: '1/1', status: 'Running', restarts: 0, age: '12d' },
          { name: `${namespace}-web-pod-2`, ready: '1/1', status: 'Running', restarts: 0, age: '10d' },
        ],
      },
    ];

    return NextResponse.json({
      services: mockServices,
      note: 'Using mock data. Configure kubectl for real services.'
    });
  }
}
