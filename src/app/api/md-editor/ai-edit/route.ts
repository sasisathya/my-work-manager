import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { content, prompt } = await request.json();

    if (!content || !prompt) {
      return NextResponse.json(
        { error: 'Content and prompt are required' },
        { status: 400 }
      );
    }

    // Check if AI is configured
    const config = loadConfig();
    const hasAI = config.ai.apiKey && config.ai.apiKey.length > 0;

    if (!hasAI) {
      return NextResponse.json(
        { error: 'AI is not configured. Please configure AI settings first.' },
        { status: 400 }
      );
    }

    // Use AI to edit the content
    const editedContent = await editWithAI(content, prompt, config);

    return NextResponse.json({
      success: true,
      editedContent,
    });

  } catch (error: any) {
    console.error('AI edit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to edit with AI' },
      { status: 500 }
    );
  }
}

async function editWithAI(content: string, userPrompt: string, config: any) {
  const systemPrompt = `You are an expert markdown editor. Your task is to edit the provided markdown content based on the user's instructions.

IMPORTANT RULES:
1. Maintain the original markdown structure and formatting
2. Keep all headings, lists, code blocks, and links intact unless specifically asked to change them
3. Only make changes that directly relate to the user's instructions
4. Return ONLY the edited markdown content, no additional commentary or explanations
5. Preserve the original file's intent and meaning

User's editing instructions: ${userPrompt}

Original content:
${content}

Provide the edited markdown content below:`;

  // Use configured AI provider
  if (config.ai.provider === 'openai') {
    return await editWithOpenAI(systemPrompt, config.ai.apiKey);
  } else if (config.ai.provider === 'claude') {
    return await editWithClaude(systemPrompt, config.ai.apiKey, config.ai.baseUrl);
  } else {
    throw new Error('Invalid AI provider configured');
  }
}

async function editWithOpenAI(prompt: string, apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert markdown editor. Return only the edited markdown content without any additional commentary.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function editWithClaude(prompt: string, apiKey: string, configBaseUrl?: string) {
  // Auto-detect endpoint based on key format
  let apiEndpoint = 'https://api.anthropic.com/v1/messages';
  let modelsEndpoint = 'https://api.anthropic.com/v1/models';
  let isInternalEndpoint = false;

  // Custom/Internal proxy: Short keys (< 50 chars) or config has baseUrl
  if (apiKey.length < 50 || configBaseUrl) {
    const baseUrl = configBaseUrl || 'https://api.anthropic.com';
    apiEndpoint = `${baseUrl}/v1/messages`;
    modelsEndpoint = `${baseUrl}/v1/models`;
    isInternalEndpoint = !!configBaseUrl;
  }
  // Anthropic Public: Long keys starting with sk-ant-
  else if (apiKey.startsWith('sk-ant-')) {
    apiEndpoint = 'https://api.anthropic.com/v1/messages';
    modelsEndpoint = 'https://api.anthropic.com/v1/models';
    isInternalEndpoint = false;
  }

  console.log('Using Claude endpoint for AI edit:', apiEndpoint);

  // First, fetch available models for internal endpoint
  let modelName = 'claude-3-5-sonnet-20241022';

  if (isInternalEndpoint) {
    try {
      const modelsResponse = await fetch(modelsEndpoint, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        console.log('Available models for AI edit:', modelsData);

        // Try to find a Claude 3.5 Sonnet model
        if (modelsData.data && Array.isArray(modelsData.data)) {
          const claudeModel = modelsData.data.find((m: any) =>
            m.id && (m.id.includes('claude') || m.id.includes('sonnet'))
          );
          if (claudeModel) {
            modelName = claudeModel.id;
            console.log('Selected model for AI edit:', modelName);
          }
        }
      }
    } catch (err) {
      console.log('Could not fetch models for AI edit, using default');
    }
  }

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelName,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.content[0].text;
}
