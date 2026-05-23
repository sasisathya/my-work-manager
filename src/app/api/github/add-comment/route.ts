import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { owner, repo, prNumber, comment, path, line, side } = await request.json();

    if (!owner || !repo || !prNumber || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields: owner, repo, prNumber, comment' },
        { status: 400 }
      );
    }

    const config = loadConfig();
    const githubToken = config.github?.token || process.env.GITHUB_TOKEN;

    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub token not configured. Please configure in settings.' },
        { status: 401 }
      );
    }

    // If path and line are provided, create a review comment (inline comment)
    // Otherwise, create a regular issue comment
    let apiUrl: string;
    let body: any;

    if (path && line) {
      // Create review comment (inline comment on specific line)
      apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`;
      body = {
        body: comment,
        path: path,
        line: parseInt(line),
        side: side || 'RIGHT', // RIGHT = new code, LEFT = old code
      };
    } else {
      // Create regular PR comment
      apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
      body = {
        body: comment,
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 422) {
        return NextResponse.json(
          {
            error: 'Unable to add comment. The line may have been changed or the diff is outdated.',
            details: errorData.message
          },
          { status: 422 }
        );
      }

      return NextResponse.json(
        {
          error: errorData.message || `Failed to add comment: ${response.statusText}`,
          details: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      commentUrl: data.html_url,
      commentId: data.id,
    });

  } catch (error: any) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add comment' },
      { status: 500 }
    );
  }
}
