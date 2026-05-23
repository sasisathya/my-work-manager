import { NextRequest, NextResponse } from 'next/server';
import { updateConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { jiraUrl, jiraEmail, jiraToken, jiraProject, githubToken, aiProvider, aiApiKey, confluenceUrl, confluenceEmail, confluenceToken } = body;

    // Build update object dynamically based on what's provided
    const updates: any = {};

    // Update Jira config if provided
    if (jiraUrl || jiraEmail || jiraToken || jiraProject !== undefined) {
      updates.jira = {};
      if (jiraUrl) updates.jira.baseUrl = jiraUrl.trim();
      if (jiraEmail) updates.jira.email = jiraEmail.trim();
      if (jiraToken) updates.jira.apiToken = jiraToken.trim();
      if (jiraProject !== undefined) updates.jira.defaultProject = jiraProject.trim();
    }

    // Update GitHub config if provided
    if (githubToken !== undefined) {
      updates.github = {
        token: githubToken.trim(),
      };
    }

    // Update AI config if provided
    if (aiProvider || aiApiKey !== undefined) {
      updates.ai = {};
      if (aiProvider) {
        updates.ai.provider = aiProvider;
        updates.ai.model = aiProvider === 'claude' ? 'claude-3-5-sonnet-20241022' : 'gpt-4-turbo-preview';
      }
      if (aiApiKey !== undefined) {
        updates.ai.apiKey = aiApiKey.trim();
        updates.ai.enabled = !!aiApiKey.trim();
      }
    }

    // Update Confluence config if provided
    if (confluenceUrl || confluenceEmail || confluenceToken !== undefined) {
      updates.confluence = {};
      if (confluenceUrl) updates.confluence.baseUrl = confluenceUrl.trim();
      if (confluenceEmail) updates.confluence.email = confluenceEmail.trim();
      if (confluenceToken !== undefined) updates.confluence.token = confluenceToken.trim();
    }

    // Update configuration
    const updated = updateConfig(updates);

    return NextResponse.json({ success: true, config: updated });
  } catch (error: any) {
    console.error('Config save error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
