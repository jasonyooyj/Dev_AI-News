import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForToken,
  getLongLivedToken,
  createThreadsClient,
} from '@/lib/social/threads';

/**
 * POST /api/social/threads/callback
 *
 * Exchange authorization code for access token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    const clientId = process.env.THREADS_APP_ID;
    const clientSecret = process.env.THREADS_APP_SECRET;
    const redirectUri = process.env.THREADS_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: 'Threads API not configured' },
        { status: 500 }
      );
    }

    // Step 1: Exchange code for short-lived token
    const shortLivedResult = await exchangeCodeForToken(code, {
      clientId,
      clientSecret,
      redirectUri,
    });

    // Step 2: Exchange short-lived token for long-lived token (60 days)
    const longLivedResult = await getLongLivedToken(
      shortLivedResult.accessToken,
      clientSecret
    );

    // Step 3: Get user profile
    const client = createThreadsClient({
      accessToken: longLivedResult.accessToken,
      userId: shortLivedResult.userId,
    });

    const profile = await client.getProfile();

    // Calculate expiration date
    const expiresAt = new Date(
      Date.now() + longLivedResult.expiresIn * 1000
    ).toISOString();

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        username: profile.username,
        name: profile.name,
        profilePictureUrl: profile.threadsProfilePictureUrl,
      },
      credentials: {
        accessToken: longLivedResult.accessToken,
        userId: shortLivedResult.userId,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Threads callback error:', error);

    const message = error instanceof Error ? error.message : 'Authentication failed';

    return NextResponse.json(
      { error: message },
      { status: 401 }
    );
  }
}
