import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jiraUrl, jiraEmail, jiraToken, useExistingToken } = body;

    // If useExistingToken flag is set, load token from config
    let actualToken = jiraToken;
    if (useExistingToken) {
      const config = loadConfig();
      actualToken = config.jira.apiToken;

      if (!actualToken) {
        return NextResponse.json(
          { success: false, error: 'No saved token found. Please enter a new token.' },
          { status: 400 }
        );
      }
    }

    if (!jiraUrl || !jiraEmail || !actualToken) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Test connection by trying to get current user
    // Use Bearer token for Jira Server/Data Center
    const response = await fetch(`${jiraUrl}/rest/api/2/myself`, {
      headers: {
        'Authorization': `Bearer ${actualToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to connect to Jira';

      if (response.status === 401) {
        errorMessage = 'Invalid credentials. Please check your email and API token.';
      } else if (response.status === 404) {
        errorMessage = 'Invalid Jira URL. Please check your Jira instance URL.';
      } else {
        errorMessage = `Jira API error: ${response.status} - ${errorText}`;
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      );
    }

    const userData = await response.json();

    return NextResponse.json({
      success: true,
      message: `Successfully connected to Jira as ${userData.displayName}`,
      user: {
        displayName: userData.displayName,
        emailAddress: userData.emailAddress,
        accountId: userData.accountId,
      },
    });
  } catch (error: any) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to test Jira connection'
      },
      { status: 500 }
    );
  }
}
