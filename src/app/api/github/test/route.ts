import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { githubToken: newToken, useExistingToken } = body;

    // Determine which token to use
    let token = newToken;
    if (useExistingToken) {
      const config = getConfig();
      token = config.github?.token;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'GitHub token is required' },
        { status: 400 }
      );
    }

    // Test the GitHub API connection by fetching the authenticated user
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid GitHub token. Please check your token and try again.'
          },
          { status: 401 }
        );
      }

      if (response.status === 403) {
        return NextResponse.json(
          {
            success: false,
            error: 'GitHub API rate limit exceeded or token lacks required permissions.'
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: errorData.message || `GitHub API error: ${response.statusText}`
        },
        { status: response.status }
      );
    }

    const userData = await response.json();

    return NextResponse.json({
      success: true,
      message: `Successfully connected to GitHub as ${userData.login}`,
      user: {
        login: userData.login,
        name: userData.name,
        email: userData.email,
        avatar_url: userData.avatar_url,
      },
    });

  } catch (error: any) {
    console.error('GitHub test connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to test GitHub connection'
      },
      { status: 500 }
    );
  }
}
