import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { text, mode } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const validModes = ['professional', 'bullet', 'concise', 'expand'];
    const enhancementMode = mode && validModes.includes(mode) ? mode : 'professional';

    const enhanced = await aiService.enhanceText(text, enhancementMode as any);

    return NextResponse.json({ enhanced });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enhance text' },
      { status: 500 }
    );
  }
}
