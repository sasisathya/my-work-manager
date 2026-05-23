import { NextRequest, NextResponse } from 'next/server';
import { jiraService } from '@/lib/jira';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const issueKey = formData.get('issueKey') as string;
    const comment = formData.get('comment') as string;
    const transitionToInProgress = formData.get('transitionToInProgress') === 'true';
    const files = formData.getAll('files') as File[];

    if (!issueKey) {
      return NextResponse.json({ error: 'Issue key is required' }, { status: 400 });
    }

    // Add comment if provided
    if (comment && comment.trim()) {
      await jiraService.addComment(issueKey, comment);
    }

    // Upload attachments if provided
    if (files && files.length > 0) {
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        await jiraService.uploadAttachment(issueKey, buffer, file.name);
      }
    }

    // Transition to "In Progress" if requested
    if (transitionToInProgress) {
      const transitionId = await jiraService.findInProgressTransition(issueKey);
      if (transitionId) {
        await jiraService.transitionIssue(issueKey, transitionId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update issue' },
      { status: 500 }
    );
  }
}
