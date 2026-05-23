import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Return all available clusters statically without making gcloud calls
  // Data will be fetched on-demand when user clicks on a cluster
  const clusters = [
    { name: 'tlk-dev01-eng01-gke', location: 'us-central1-a', status: 'RUNNING' },
    { name: 'tlk-perf01-eng01-gke', location: 'us-east1-b', status: 'RUNNING' },
    { name: 'tlk-intgrn01-eng01-gke', location: 'us-west1-a', status: 'RUNNING' },
  ];

  return NextResponse.json({ clusters });
}
