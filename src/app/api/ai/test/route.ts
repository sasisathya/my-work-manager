import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { aiApiKey: newApiKey, aiProvider: newProvider, useExistingKey } = await request.json();

    let apiKey = newApiKey;
    let provider = newProvider;

    // If using existing key, load from config
    if (useExistingKey) {
      const config = loadConfig();
      apiKey = config.ai?.apiKey;
      provider = config.ai?.provider || 'openai';
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI API key is required for testing', success: false },
        { status: 400 }
      );
    }

    if (!provider) {
      provider = 'openai';
    }

    // Test the API key with the respective provider
    let testResult;
    if (provider === 'openai') {
      testResult = await testOpenAI(apiKey);
    } else if (provider === 'claude') {
      testResult = await testClaude(apiKey);
    } else {
      return NextResponse.json(
        { error: 'Invalid AI provider. Use "openai" or "claude"', success: false },
        { status: 400 }
      );
    }

    if (testResult.success) {
      return NextResponse.json({
        success: true,
        message: testResult.message,
        details: testResult.details,
      });
    } else {
      return NextResponse.json(
        { error: testResult.error, success: false },
        { status: 401 }
      );
    }

  } catch (error: any) {
    console.error('AI test error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to test AI connection', success: false },
      { status: 500 }
    );
  }
}

async function testOpenAI(apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return {
          success: false,
          error: 'Invalid OpenAI API key. Please check your key and try again.',
        };
      } else if (response.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Your API key is valid but you have too many requests.',
        };
      } else {
        return {
          success: false,
          error: `OpenAI API error: ${errorData.error?.message || response.statusText}`,
        };
      }
    }

    const data = await response.json();
    const availableModels = data.data?.length || 0;

    return {
      success: true,
      message: `✓ OpenAI API key is valid! Connected successfully.`,
      details: {
        provider: 'OpenAI',
        modelsAvailable: availableModels,
        status: 'Active',
      },
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Failed to connect to OpenAI: ${error.message}`,
    };
  }
}

async function testClaude(apiKey: string) {
  try {
    // Load config to get base URL
    const config = loadConfig();
    const configBaseUrl = config.ai?.baseUrl;

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

    console.log('Testing Claude API:', { endpoint: apiEndpoint, keyLength: apiKey.length, isInternal: isInternalEndpoint });

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
          console.log('Available models:', modelsData);

          // Try to find a Claude 3.5 Sonnet model
          if (modelsData.data && Array.isArray(modelsData.data)) {
            const claudeModel = modelsData.data.find((m: any) =>
              m.id && (m.id.includes('claude') || m.id.includes('sonnet'))
            );
            if (claudeModel) {
              modelName = claudeModel.id;
              console.log('Selected model:', modelName);
            }
          }
        }
      } catch (err) {
        console.log('Could not fetch models, using default');
      }
    }

    // Test with a minimal message to validate the API key
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hi',
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Claude API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        endpoint: apiEndpoint,
        errorData,
      });

      if (response.status === 401) {
        return {
          success: false,
          error: `Invalid Claude API key. Please check your key and try again. (Endpoint: ${isInternalEndpoint ? 'Custom Proxy' : 'Public Anthropic'})`,
        };
      } else if (response.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Your API key is valid but you have too many requests.',
        };
      } else {
        return {
          success: false,
          error: `Claude API error (${response.status}): ${errorData.error?.message || errorData.message || response.statusText}`,
        };
      }
    }

    const data = await response.json();

    return {
      success: true,
      message: `✓ Claude API key is valid! Connected successfully.`,
      details: {
        provider: 'Claude (Anthropic)',
        model: data.model || 'claude-3-5-sonnet-20241022',
        status: 'Active',
      },
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Failed to connect to Claude: ${error.message}`,
    };
  }
}
