import { NextResponse } from 'next/server';
import { isConfigured } from '@/lib/config';

export async function GET() {
  try {
    const configured = isConfigured();
    return NextResponse.json({ configured });
  } catch (error: any) {
    return NextResponse.json({ configured: false, error: error.message });
  }
}
