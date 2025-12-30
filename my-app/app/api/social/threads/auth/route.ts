import { NextRequest, NextResponse } from 'next/server';
import { getThreadsAuthUrl } from '@/lib/social/threads';

/**
 * GET /api/social/threads/auth
 *
 * Generate OAuth authorization URL for Threads
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.THREADS_APP_ID;
    const redirectUri = process.env.THREADS_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: 'Threads API not configured. Please set THREADS_APP_ID and THREADS_REDIRECT_URI.' },
        { status: 500 }
      );
    }

    // Generate a state parameter for CSRF protection
    const state = crypto.randomUUID();

    const authUrl = getThreadsAuthUrl({
      clientId,
      redirectUri,
      state,
    });

    return NextResponse.json({
      authUrl,
      state,
    });
  } catch (error) {
    console.error('Threads auth URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
