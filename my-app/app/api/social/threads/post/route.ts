import { NextRequest, NextResponse } from 'next/server';
import { createThreadsClient } from '@/lib/social/threads';

/**
 * POST /api/social/threads/post
 *
 * Create a post on Threads
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, userId, text, imageUrl, replyToId } = body;

    // Validate required fields
    if (!accessToken || !userId) {
      return NextResponse.json(
        { error: 'Missing credentials: accessToken and userId required' },
        { status: 400 }
      );
    }

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid text content' },
        { status: 400 }
      );
    }

    // Validate text length (Threads limit is 500 characters)
    if (text.length > 500) {
      return NextResponse.json(
        { error: `Text too long: ${text.length} characters (max 500)` },
        { status: 400 }
      );
    }

    // Create client and post
    const client = createThreadsClient({
      accessToken,
      userId,
    });

    const result = await client.createPost({
      text,
      mediaType: imageUrl ? 'IMAGE' : 'TEXT',
      imageUrl,
      replyToId,
    });

    return NextResponse.json({
      success: true,
      post: {
        id: result.id,
        postUrl: result.postUrl,
      },
    });
  } catch (error) {
    console.error('Threads post error:', error);

    const message = error instanceof Error ? error.message : 'Failed to create post';

    // Determine appropriate status code
    let status = 500;
    if (message.includes('Invalid') || message.includes('expired')) {
      status = 401;
    }

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
