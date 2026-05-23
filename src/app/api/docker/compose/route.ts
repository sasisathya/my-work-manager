import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getConfig } from '@/lib/config';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { action, composePath, serviceName } = await request.json();

    if (!action || !composePath) {
      return NextResponse.json(
        { error: 'Action and composePath are required' },
        { status: 400 }
      );
    }

    let command = '';

    switch (action) {
      case 'up':
        command = `docker-compose -f "${composePath}" up -d`;
        break;
      case 'down':
        command = `docker-compose -f "${composePath}" down`;
        break;
      case 'restart':
        command = `docker-compose -f "${composePath}" restart`;
        break;
      case 'ps':
        command = `docker-compose -f "${composePath}" ps`;
        break;
      case 'logs':
        command = serviceName
          ? `docker-compose -f "${composePath}" logs --tail=100 ${serviceName}`
          : `docker-compose -f "${composePath}" logs --tail=100`;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: up, down, restart, ps, or logs' },
          { status: 400 }
        );
    }

    // Prepare environment variables
    const env = { ...process.env };

    // If this is a Kafka service, inject credentials from config
    if (composePath.includes('kafka-tools')) {
      const config = getConfig();
      if (config.kafka) {
        if (config.kafka.bootstrapServers) {
          env.KAFKA_BOOTSTRAP_SERVERS = config.kafka.bootstrapServers;
        }
        if (config.kafka.apiKey) {
          env.KAFKA_API_KEY = config.kafka.apiKey;
        }
        if (config.kafka.apiSecret) {
          env.KAFKA_API_SECRET = config.kafka.apiSecret;
        }
      }
    }

    console.log(`Running: ${command}`);
    const { stdout, stderr } = await execAsync(command, {
      cwd: composePath.substring(0, composePath.lastIndexOf('/')),
      timeout: 60000, // 60 second timeout
      env
    });

    return NextResponse.json({
      success: true,
      message: `Successfully executed ${action}`,
      output: stdout,
      stderr: stderr
    });
  } catch (error: any) {
    console.error('Docker compose error:', error);

    if (error.message.includes('Cannot connect to the Docker daemon')) {
      return NextResponse.json(
        { error: 'Docker is not running. Please start Docker Desktop.' },
        { status: 503 }
      );
    }

    if (error.message.includes('not found') || error.message.includes('No such file')) {
      return NextResponse.json(
        { error: 'Docker compose file not found. Please check the path.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to execute docker-compose command' },
      { status: 500 }
    );
  }
}
