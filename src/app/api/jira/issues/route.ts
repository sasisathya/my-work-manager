import { NextResponse } from 'next/server';
import { jiraService } from '@/lib/jira';

export async function GET() {
  try {
    const issues = await jiraService.getMyOpenIssues();

    return NextResponse.json({ issues });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}
