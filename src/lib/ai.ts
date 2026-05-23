import { getConfig } from './config';

// Dynamic imports for AI SDKs - only loaded when needed
type OpenAI = any;
type Anthropic = any;

export class AIService {
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;
  private enabled: boolean;
  private provider: string;
  private openaiPromise: Promise<any> | null = null;
  private anthropicPromise: Promise<any> | null = null;

  constructor() {
    const config = getConfig();
    this.enabled = config.ai.enabled;
    this.provider = config.ai.provider;
  }

  private async getOpenAIClient(): Promise<OpenAI | null> {
    if (this.openaiClient) return this.openaiClient;

    const config = getConfig();
    if (!this.enabled || !config.ai.apiKey || this.isPlaceholderKey(config.ai.apiKey)) {
      return null;
    }

    if (!this.openaiPromise) {
      this.openaiPromise = import('openai').then((module) => {
        const OpenAI = module.default;
        this.openaiClient = new OpenAI({
          apiKey: config.ai.apiKey,
        });
        return this.openaiClient;
      });
    }

    return this.openaiPromise;
  }

  private async getAnthropicClient(): Promise<Anthropic | null> {
    if (this.anthropicClient) return this.anthropicClient;

    const config = getConfig();
    if (!this.enabled || !config.ai.apiKey || this.isPlaceholderKey(config.ai.apiKey)) {
      return null;
    }

    if (!this.anthropicPromise) {
      this.anthropicPromise = import('@anthropic-ai/sdk').then((module) => {
        const Anthropic = module.default;
        const clientConfig: any = {
          apiKey: config.ai.apiKey,
        };

        // Add baseUrl if configured (for LiteLLM or custom proxies)
        if (config.ai.baseUrl) {
          clientConfig.baseURL = config.ai.baseUrl;
        }

        this.anthropicClient = new Anthropic(clientConfig);
        return this.anthropicClient;
      });
    }

    return this.anthropicPromise;
  }

  private isPlaceholderKey(key: string): boolean {
    return key === 'YOUR_OPENAI_API_KEY_HERE' ||
           key === 'YOUR_CLAUDE_API_KEY_HERE' ||
           key === 'YOUR_API_KEY_HERE';
  }

  async enhanceText(text: string, mode: 'professional' | 'bullet' | 'concise' | 'expand' = 'professional'): Promise<string> {
    if (!this.enabled) {
      return text;
    }

    try {
      if (this.provider === 'openai') {
        const client = await this.getOpenAIClient();
        if (client) {
          return await this.enhanceWithOpenAI(client, text, mode);
        }
      } else if (this.provider === 'claude' || this.provider === 'anthropic') {
        const client = await this.getAnthropicClient();
        if (client) {
          return await this.enhanceWithClaude(client, text, mode);
        }
      }
      return text;
    } catch (error: any) {
      console.error('Error enhancing text:', error.message);
      return text;
    }
  }

  async generateSimpleFormat(text: string): Promise<string> {
    if (!this.enabled) {
      return text;
    }

    try {
      if (this.provider === 'openai') {
        const client = await this.getOpenAIClient();
        if (client) {
          return await this.formatWithOpenAI(client, text);
        }
      } else if (this.provider === 'claude' || this.provider === 'anthropic') {
        const client = await this.getAnthropicClient();
        if (client) {
          return await this.formatWithClaude(client, text);
        }
      }
      return text;
    } catch (error: any) {
      console.error('Error formatting text:', error.message);
      return text;
    }
  }

  private async enhanceWithOpenAI(client: OpenAI, text: string, mode: string = 'professional'): Promise<string> {
    const systemPrompts = {
      professional: `You are a professional communication assistant. Improve the text to be clear, professional, and grammatically correct. Make it suitable for workplace communication. Improve grammar, structure, and clarity significantly.`,
      bullet: `Convert the text into clear, well-organized bullet points. Each bullet should be concise and actionable. Format for Jira comments.`,
      concise: `Make the text as concise as possible while keeping all important information. Remove unnecessary words, redundancy, and filler.`,
      expand: `Expand and elaborate on the text. Add context, details, and explanations to make it more comprehensive and easier to understand.`
    };

    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompts[mode as keyof typeof systemPrompts] || systemPrompts.professional,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || text;
  }

  private async enhanceWithClaude(client: Anthropic, text: string, mode: string = 'professional'): Promise<string> {
    const config = getConfig();

    const prompts = {
      professional: `You are a professional communication assistant. Improve the following text to be clear, professional, and grammatically correct. Make it suitable for workplace communication (Jira comments, emails, documentation). Improve grammar, structure, and clarity significantly. Only return the improved text, nothing else.

Text: ${text}`,

      bullet: `Convert the following text into clear, well-organized bullet points. Each bullet should be concise and actionable. Format for Jira comments. If the text asks for bullet points, provide them. Only return the bullet points, nothing else.

Text: ${text}`,

      concise: `Make the following text as concise as possible while keeping all important information. Remove unnecessary words, redundancy, and filler. Be direct and clear. Only return the concise text, nothing else.

Text: ${text}`,

      expand: `Expand and elaborate on the following text. Add context, details, and explanations to make it more comprehensive and easier to understand. Maintain professional tone. Only return the expanded text, nothing else.

Text: ${text}`
    };

    const response = await client.messages.create({
      model: config.ai.model,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompts[mode as keyof typeof prompts] || prompts.professional,
        },
      ],
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : text;
  }

  private async formatWithOpenAI(client: OpenAI, text: string): Promise<string> {
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a formatting assistant. Convert the given text into a simple, clean format suitable for Jira comments:
- Use bullet points for lists
- Keep sentences short and clear
- Organize information logically
- Remove unnecessary words
- Use proper capitalization and punctuation

Only return the formatted text, nothing else.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || text;
  }

  private async formatWithClaude(client: Anthropic, text: string): Promise<string> {
    const config = getConfig();
    const response = await client.messages.create({
      model: config.ai.model,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Format the following text into a simple, clean format suitable for Jira comments. Use bullet points, keep sentences short, organize logically, and use proper capitalization. Only return the formatted text.

Text: ${text}`,
        },
      ],
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : text;
  }
}

export const aiService = new AIService();
