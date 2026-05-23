import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { confluenceUrl, confluenceEmail, confluenceToken: newToken, useExistingToken } = await request.json();

    let token = newToken;

    // If using existing token, load from config
    if (useExistingToken) {
      const config = loadConfig();
      token = config.confluence?.token;
    }

    if (!confluenceUrl || !token) {
      return NextResponse.json(
        { error: 'Confluence URL and token are required for testing', success: false },
        { status: 400 }
      );
    }

    // Clean up the URL - remove trailing slashes
    let baseUrl = confluenceUrl.replace(/\/$/, '');

    // For internal/server instances, the URL might already include the full path
    // For cloud instances, we need to add /wiki
    const isCloudInstance = baseUrl.includes('.atlassian.net');

    // Determine the REST API endpoint
    let testUrl;
    if (isCloudInstance) {
      // Cloud: https://company.atlassian.net/wiki/rest/api/user/current
      baseUrl = baseUrl.replace(/\/wiki\/?$/, '');
      testUrl = `${baseUrl}/wiki/rest/api/user/current`;
    } else {
      // Server/Data Center: Try multiple possible endpoints
      // Option 1: /rest/api/user/current (most common for server)
      // Option 2: /wiki/rest/api/user/current
      testUrl = `${baseUrl}/rest/api/user/current`;
    }

    console.log('Testing Confluence connection:', { baseUrl, testUrl, isCloudInstance });

    // Try Bearer token authentication first (for Confluence Server PAT)
    let response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log('First attempt (Bearer token):', { status: response.status });

    // If Bearer token fails with 401, try Basic Auth (email:token)
    if (!response.ok && response.status === 401 && confluenceEmail) {
      console.log('Bearer token failed, trying Basic Auth with email:token...');
      const authHeader = Buffer.from(`${confluenceEmail}:${token}`).toString('base64');
      response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      console.log('Second attempt (Basic Auth):', { status: response.status });
    }

    // If first endpoint fails with 404 on server instance, try alternate path
    if (!response.ok && response.status === 404 && !isCloudInstance) {
      console.log('First endpoint failed, trying alternate path with /wiki...');
      testUrl = `${baseUrl}/wiki/rest/api/user/current`;

      // Try Bearer token first
      response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      // If Bearer fails, try Basic Auth
      if (!response.ok && response.status === 401 && confluenceEmail) {
        const authHeader = Buffer.from(`${confluenceEmail}:${token}`).toString('base64');
        response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
      }
    }

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Confluence API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: testUrl,
        responseBody: responseText.substring(0, 500), // First 500 chars
      });

      let errorMessage = `Failed to connect to Confluence: ${response.status} ${response.statusText}`;

      if (response.status === 401) {
        errorMessage = 'Invalid credentials. Please check your email and API token.';
      } else if (response.status === 403) {
        errorMessage = 'Access forbidden. Your credentials may not have the required permissions.';
      } else if (response.status === 404) {
        errorMessage = `Confluence API endpoint not found. Tried: ${testUrl}\n\nPlease check:\n1. Is the Confluence URL correct?\n2. Does your instance use a different API path?`;
      }

      return NextResponse.json(
        {
          error: errorMessage,
          success: false,
          debug: {
            attemptedUrl: testUrl,
            status: response.status,
            isCloudInstance,
          }
        },
        { status: response.status }
      );
    }

    const userData = await response.json();
    console.log('Confluence connection successful:', {
      username: userData.username,
      displayName: userData.displayName,
      usedUrl: testUrl
    });

    return NextResponse.json({
      success: true,
      message: `✓ Connected to Confluence successfully! Welcome, ${userData.displayName || userData.username || 'User'}`,
      details: {
        username: userData.username,
        displayName: userData.displayName,
        email: userData.email,
      },
    });

  } catch (error: any) {
    console.error('Confluence test error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to test Confluence connection', success: false },
      { status: 500 }
    );
  }
}
