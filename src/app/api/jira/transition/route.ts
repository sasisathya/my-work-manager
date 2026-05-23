import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueKey, transitionId } = body;

    if (!issueKey || !transitionId) {
      return NextResponse.json(
        { error: 'Issue key and transition ID are required' },
        { status: 400 }
      );
    }

    const config = getConfig();

    // Perform the transition
    const response = await fetch(
      `${config.jira.baseUrl}/rest/api/2/issue/${issueKey}/transitions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.jira.apiToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transition: {
            id: transitionId,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jira transition error:', errorText);
      return NextResponse.json(
        { error: 'Failed to perform transition' },
        { status: response.status }
      );
    }

    // Jira returns 204 No Content on success
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error performing transition:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
