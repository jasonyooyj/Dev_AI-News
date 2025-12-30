import { NextRequest, NextResponse } from 'next/server';
import { createBlueskyClient } from '@/lib/social/bluesky';

/**
 * POST /api/social/bluesky/connect
 *
 * Verify Bluesky credentials and return profile info
 * This endpoint validates the credentials without storing them
 * (storage is handled client-side via Firestore)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, appPassword } = body;

    // Validate required fields
    if (!identifier || !appPassword) {
      return NextResponse.json(
        { error: 'Missing required fields: identifier and appPassword' },
        { status: 400 }
      );
    }

    // Validate identifier format
    if (!identifier.includes('.') && !identifier.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid identifier format. Use your handle (e.g., user.bsky.social) or email.' },
        { status: 400 }
      );
    }

    // Create client and attempt login
    const client = createBlueskyClient();

    const profile = await client.login({
      identifier,
      appPassword,
    });

    return NextResponse.json({
      success: true,
      profile: {
        did: profile.did,
        handle: profile.handle,
        displayName: profile.displayName,
        avatar: profile.avatar,
      },
    });
  } catch (error) {
    console.error('Bluesky connect error:', error);

    const message = error instanceof Error ? error.message : 'Connection failed';

    return NextResponse.json(
      { error: message },
      { status: 401 }
    );
  }
}
