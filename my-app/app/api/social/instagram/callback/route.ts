import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  createInstagramClient,
  calculateExpiresAt,
} from '@/lib/social/instagram';

export async function POST(request: NextRequest) {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: 'Instagram API credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    const config = {
      clientId,
      clientSecret,
      redirectUri,
    };

    // Step 1: Exchange code for short-lived token
    const shortLivedResult = await exchangeCodeForToken(code, config);

    // Step 2: Exchange for long-lived token (60 days)
    const longLivedResult = await exchangeForLongLivedToken(
      shortLivedResult.accessToken,
      config
    );

    // Get user profile
    const client = createInstagramClient({
      accessToken: longLivedResult.accessToken,
      userId: shortLivedResult.userId,
    });

    const profile = await client.getProfile();

    // Calculate expiration date
    const expiresAt = calculateExpiresAt(longLivedResult.expiresIn);

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        username: profile.username,
        name: profile.name,
        profilePictureUrl: profile.profilePictureUrl,
        accountType: profile.accountType,
      },
      credentials: {
        accessToken: longLivedResult.accessToken,
        userId: shortLivedResult.userId,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Instagram callback error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to complete Instagram authentication',
      },
      { status: 500 }
    );
  }
}
