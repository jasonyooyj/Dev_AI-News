import { NextResponse } from 'next/server';
import { getInstagramAuthUrl } from '@/lib/social/instagram';

export async function GET() {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Instagram API credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const authUrl = getInstagramAuthUrl({
      clientId,
      clientSecret: '', // Not needed for auth URL
      redirectUri,
    });

    // Generate state for CSRF protection
    const state = crypto.randomUUID();

    // Add state to the auth URL
    const urlWithState = `${authUrl}&state=${state}`;

    return NextResponse.json({
      authUrl: urlWithState,
      state,
    });
  } catch (error) {
    console.error('Instagram auth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}
