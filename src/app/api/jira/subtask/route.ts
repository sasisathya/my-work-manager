import { NextRequest, NextResponse } from 'next/server';
import { jiraService } from '@/lib/jira';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parentIssueKey, summary, description } = body;

    if (!parentIssueKey || !summary) {
      return NextResponse.json(
        { error: 'parentIssueKey and summary are required' },
        { status: 400 }
      );
    }

    const result = await jiraService.createSubtask(
      parentIssueKey,
      summary,
      description || ''
    );

    return NextResponse.json({
      success: true,
      subtask: result,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subtask' },
      { status: 500 }
    );
  }
}
