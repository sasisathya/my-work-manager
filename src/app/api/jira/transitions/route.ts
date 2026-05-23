import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issueKey = searchParams.get('issueKey');

    if (!issueKey) {
      return NextResponse.json(
        { error: 'Issue key is required' },
        { status: 400 }
      );
    }

    const config = getConfig();

    // Get available transitions from Jira
    const response = await fetch(
      `${config.jira.baseUrl}/rest/api/2/issue/${issueKey}/transitions`,
      {
        headers: {
          'Authorization': `Bearer ${config.jira.apiToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jira API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch transitions' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ transitions: data.transitions || [] });
  } catch (error: any) {
    console.error('Error fetching transitions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
