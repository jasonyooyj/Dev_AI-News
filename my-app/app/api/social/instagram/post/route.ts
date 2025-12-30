import { NextRequest, NextResponse } from 'next/server';
import { createInstagramClient } from '@/lib/social/instagram';

interface PostRequestBody {
  accessToken: string;
  userId: string;
  imageUrl: string;
  caption: string;
  locationId?: string;
  userTags?: Array<{
    username: string;
    x: number;
    y: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: PostRequestBody = await request.json();
    const { accessToken, userId, imageUrl, caption, locationId, userTags } = body;

    // Validate required fields
    if (!accessToken || !userId) {
      return NextResponse.json(
        { error: 'Access token and user ID are required' },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required. Instagram does not support text-only posts.' },
        { status: 400 }
      );
    }

    if (!caption) {
      return NextResponse.json(
        { error: 'Caption is required' },
        { status: 400 }
      );
    }

    // Validate caption length
    if (caption.length > 2200) {
      return NextResponse.json(
        { error: 'Caption exceeds 2,200 character limit' },
        { status: 400 }
      );
    }

    // Validate image URL is HTTPS and accessible
    if (!imageUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Image URL must use HTTPS' },
        { status: 400 }
      );
    }

    const client = createInstagramClient({
      accessToken,
      userId,
    });

    const result = await client.createPost({
      imageUrl,
      caption,
      locationId,
      userTags,
    });

    return NextResponse.json({
      success: true,
      post: {
        id: result.id,
        postUrl: result.postUrl,
      },
    });
  } catch (error) {
    console.error('Instagram post error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create Instagram post',
      },
      { status: 500 }
    );
  }
}
