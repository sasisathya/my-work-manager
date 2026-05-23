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

    if (!config.github.token || !config.github.repository) {
      return NextResponse.json({ pr: null });
    }

    const repo = config.github.repository;

    // Search for PRs with branch name containing the issue key
    const searchQuery = `is:pr repo:${repo} head:${issueKey}`;

    const response = await fetch(
      `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}`,
      {
        headers: {
          'Authorization': `Bearer ${config.github.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      console.error('GitHub API error:', await response.text());
      return NextResponse.json({ pr: null });
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const pr = data.items[0];
      return NextResponse.json({
        pr: {
          number: pr.number,
          title: pr.title,
          url: pr.html_url,
          state: pr.state,
          branch: pr.pull_request?.head?.ref,
        },
      });
    }

    return NextResponse.json({ pr: null });
  } catch (error: any) {
    console.error('Error searching for PR:', error);
    return NextResponse.json({ pr: null });
  }
}
