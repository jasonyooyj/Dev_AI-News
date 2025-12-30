import { NextRequest, NextResponse } from 'next/server';
import { createLinkedInClient } from '@/lib/social/linkedin';

/**
 * POST /api/social/linkedin/post
 *
 * Create a post on LinkedIn.
 *
 * Request body:
 * - accessToken: string
 * - personUrn: string (urn:li:person:{sub})
 * - text: string (max 3,000 characters)
 * - articleUrl?: string (optional URL to attach)
 * - articleTitle?: string (optional title for the article)
 * - articleDescription?: string (optional description)
 * - visibility?: 'PUBLIC' | 'CONNECTIONS'
 *
 * Response:
 * - success: boolean
 * - post: { id, postUrl }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      accessToken,
      personUrn,
      text,
      articleUrl,
      articleTitle,
      articleDescription,
      visibility = 'PUBLIC',
    } = body;

    // Validate required fields
    if (!accessToken || !personUrn) {
      return NextResponse.json(
        { error: 'LinkedIn credentials are required' },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: 'Post text is required' },
        { status: 400 }
      );
    }

    if (text.length > 3000) {
      return NextResponse.json(
        { error: 'Post text cannot exceed 3,000 characters' },
        { status: 400 }
      );
    }

    // Create LinkedIn client
    const client = createLinkedInClient({
      accessToken,
      personUrn,
    });

    // Create the post
    const result = await client.createPost({
      text,
      articleUrl,
      articleTitle,
      articleDescription,
      visibility,
    });

    return NextResponse.json({
      success: true,
      post: {
        id: result.id,
        postUrl: result.postUrl,
      },
    });
  } catch (error) {
    console.error('LinkedIn post error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create LinkedIn post';

    let status = 500;
    if (message.includes('Invalid') || message.includes('expired') || message.includes('Unauthorized')) {
      status = 401;
    }

    return NextResponse.json({ error: message }, { status });
  }
}
