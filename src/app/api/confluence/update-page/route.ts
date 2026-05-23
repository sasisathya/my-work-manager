import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { pageUrl, content } = await request.json();

    if (!pageUrl) {
      return NextResponse.json(
        { error: 'Page URL is required' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Extract page ID from URL
    const pageIdMatch = pageUrl.match(/\/pages\/(\d+)/);
    if (!pageIdMatch) {
      return NextResponse.json(
        { error: 'Invalid Confluence page URL format' },
        { status: 400 }
      );
    }

    const pageId = pageIdMatch[1];

    // Read Confluence credentials from .secret file
    const secretPath = path.join(process.cwd(), '..', '.secret');
    let confluenceUrl = '';
    let confluenceToken = '';

    if (fs.existsSync(secretPath)) {
      const secretContent = fs.readFileSync(secretPath, 'utf-8');
      const lines = secretContent.split('\n');

      for (const line of lines) {
        if (line.startsWith('CONFLUENCE_BASE_URL=')) {
          confluenceUrl = line.substring('CONFLUENCE_BASE_URL='.length).trim();
        } else if (line.startsWith('CONFLUENCE_ACCESS_TOKEN=')) {
          confluenceToken = line.substring('CONFLUENCE_ACCESS_TOKEN='.length).trim();
        }
      }
    }

    if (!confluenceUrl || !confluenceToken) {
      return NextResponse.json(
        { error: 'Confluence credentials not configured. Please configure in Settings.' },
        { status: 400 }
      );
    }

    // Auto-detect cloud vs server instance
    const isCloudInstance = confluenceUrl.includes('.atlassian.net');

    // First, get the current page to retrieve its version
    const getPageUrl = isCloudInstance
      ? `${confluenceUrl}/wiki/rest/api/content/${pageId}?expand=version`
      : `${confluenceUrl}/rest/api/content/${pageId}?expand=version`;

    console.log('Fetching current page version:', { pageId, getPageUrl });

    const getResponse = await fetch(getPageUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${confluenceToken}`,
        'Accept': 'application/json',
      },
    });

    if (!getResponse.ok) {
      console.error('Failed to fetch current page:', {
        status: getResponse.status,
        statusText: getResponse.statusText,
      });
      return NextResponse.json(
        { error: `Failed to fetch current page version: ${getResponse.status} ${getResponse.statusText}` },
        { status: getResponse.status }
      );
    }

    const currentPage = await getResponse.json();
    const currentVersion = currentPage.version.number;
    const nextVersion = currentVersion + 1;

    console.log('Current page version:', currentVersion, 'Next version:', nextVersion);

    // Update the page with new content
    const updatePageUrl = isCloudInstance
      ? `${confluenceUrl}/wiki/rest/api/content/${pageId}`
      : `${confluenceUrl}/rest/api/content/${pageId}`;

    const updatePayload = {
      version: {
        number: nextVersion,
      },
      title: currentPage.title,
      type: 'page',
      body: {
        storage: {
          value: content,
          representation: 'storage',
        },
      },
    };

    console.log('Updating Confluence page:', { pageId, nextVersion, updatePageUrl });

    const updateResponse = await fetch(updatePageUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${confluenceToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update Confluence page:', {
        status: updateResponse.status,
        statusText: updateResponse.statusText,
        error: errorText,
      });
      return NextResponse.json(
        { error: `Failed to update page: ${updateResponse.status} ${updateResponse.statusText}` },
        { status: updateResponse.status }
      );
    }

    const updatedPage = await updateResponse.json();

    console.log('Confluence page updated successfully:', {
      pageId: updatedPage.id,
      title: updatedPage.title,
      version: updatedPage.version.number,
    });

    return NextResponse.json({
      success: true,
      pageId: updatedPage.id,
      title: updatedPage.title,
      version: updatedPage.version.number,
      message: 'Page updated successfully',
    });
  } catch (error: any) {
    console.error('Confluence update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update Confluence page' },
      { status: 500 }
    );
  }
}
