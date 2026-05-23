import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { pageUrl } = await request.json();

    if (!pageUrl) {
      return NextResponse.json(
        { error: 'Page URL is required', success: false },
        { status: 400 }
      );
    }

    // Load Confluence config
    const config = loadConfig();
    const confluenceUrl = config.confluence?.baseUrl;
    const confluenceToken = config.confluence?.token;
    const confluenceEmail = config.confluence?.email;

    if (!confluenceUrl || !confluenceToken) {
      return NextResponse.json(
        { error: 'Confluence is not configured. Please configure Confluence in Settings first.', success: false },
        { status: 400 }
      );
    }

    // Parse the page URL to extract page ID
    // Format: https://your-domain.atlassian.net/wiki/spaces/SPACE/pages/123456789/Page+Title
    const pageIdMatch = pageUrl.match(/\/pages\/(\d+)/);

    if (!pageIdMatch) {
      return NextResponse.json(
        { error: 'Invalid Confluence page URL. Could not extract page ID.', success: false },
        { status: 400 }
      );
    }

    const pageId = pageIdMatch[1];

    console.log('Fetching Confluence page:', { pageId, pageUrl });

    // Determine if it's cloud or server instance
    const isCloudInstance = confluenceUrl.includes('.atlassian.net');

    // Build API endpoint
    let apiUrl;
    if (isCloudInstance) {
      apiUrl = `${confluenceUrl}/wiki/rest/api/content/${pageId}?expand=body.storage,version,space`;
    } else {
      // Server/Data Center
      apiUrl = `${confluenceUrl}/rest/api/content/${pageId}?expand=body.storage,version,space`;
    }

    // Try Bearer token first (for Server/Data Center)
    let response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${confluenceToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log('First attempt (Bearer token):', { status: response.status });

    // If Bearer fails with 401, try Basic Auth (for Cloud)
    if (!response.ok && response.status === 401 && confluenceEmail) {
      console.log('Bearer token failed, trying Basic Auth...');
      const authHeader = Buffer.from(`${confluenceEmail}:${confluenceToken}`).toString('base64');
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      console.log('Second attempt (Basic Auth):', { status: response.status });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Confluence fetch error:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl,
        error: errorText.substring(0, 500),
      });

      let errorMessage = `Failed to fetch Confluence page: ${response.status} ${response.statusText}`;

      if (response.status === 401) {
        errorMessage = 'Unauthorized. Please check your Confluence credentials in Settings.';
      } else if (response.status === 403) {
        errorMessage = 'Access forbidden. You may not have permission to view this page.';
      } else if (response.status === 404) {
        errorMessage = 'Page not found. Please check the URL.';
      }

      return NextResponse.json(
        { error: errorMessage, success: false },
        { status: response.status }
      );
    }

    const pageData = await response.json();

    console.log('Confluence page fetched successfully:', {
      pageId: pageData.id,
      title: pageData.title,
      space: pageData.space?.name,
    });

    // Extract content
    const htmlContent = pageData.body?.storage?.value || '';
    const title = pageData.title || 'Untitled';
    const space = pageData.space?.name || 'Unknown';
    const version = pageData.version?.number || 1;

    return NextResponse.json({
      success: true,
      content: htmlContent,
      metadata: {
        title,
        space,
        version,
        pageId: pageData.id,
        pageUrl: pageUrl,
        lastModified: pageData.version?.when || null,
      },
    });

  } catch (error: any) {
    console.error('Confluence fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Confluence page', success: false },
      { status: 500 }
    );
  }
}
