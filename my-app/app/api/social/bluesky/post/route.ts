import { NextRequest, NextResponse } from 'next/server';
import { createBlueskyClient } from '@/lib/social/bluesky';

/**
 * POST /api/social/bluesky/post
 *
 * Create a post on Bluesky
 * Requires credentials to be passed with each request (stateless)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, appPassword, text, linkUrl, replyTo } = body;

    // Validate required fields
    if (!identifier || !appPassword) {
      return NextResponse.json(
        { error: 'Missing credentials: identifier and appPassword required' },
        { status: 400 }
      );
    }

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid text content' },
        { status: 400 }
      );
    }

    // Validate text length (Bluesky limit is 300 characters)
    if (text.length > 300) {
      return NextResponse.json(
        { error: `Text too long: ${text.length} characters (max 300)` },
        { status: 400 }
      );
    }

    // Create client and authenticate
    const client = createBlueskyClient();

    await client.login({
      identifier,
      appPassword,
    });

    // Create the post
    const result = await client.createPost({
      text,
      linkUrl,
      replyTo,
    });

    return NextResponse.json({
      success: true,
      post: {
        uri: result.uri,
        cid: result.cid,
        postUrl: result.postUrl,
      },
    });
  } catch (error) {
    console.error('Bluesky post error:', error);

    const message = error instanceof Error ? error.message : 'Failed to create post';

    // Determine appropriate status code
    let status = 500;
    if (message.includes('Invalid') || message.includes('not found')) {
      status = 401;
    } else if (message.includes('Not authenticated')) {
      status = 401;
    }

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
