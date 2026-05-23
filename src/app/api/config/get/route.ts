import { NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

export async function GET() {
  try {
    const config = loadConfig();

    // Return non-sensitive config data
    // For password fields, return a flag indicating if a value exists
    return NextResponse.json({
      jira: {
        baseUrl: config.jira.baseUrl,
        email: config.jira.email,
        defaultProject: config.jira.defaultProject,
        hasToken: !!config.jira.apiToken, // Boolean flag indicating token exists
      },
      github: {
        hasToken: !!config.github?.token, // Boolean flag indicating GitHub token exists
      },
      ai: {
        provider: config.ai.provider,
        enabled: config.ai.enabled,
        hasApiKey: !!config.ai.apiKey, // Boolean flag indicating API key exists
      },
      confluence: {
        baseUrl: config.confluence?.baseUrl || '',
        email: config.confluence?.email || '',
        hasToken: !!config.confluence?.token, // Boolean flag indicating token exists
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    );
  }
}
