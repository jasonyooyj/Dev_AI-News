import { NextRequest, NextResponse } from 'next/server';
import { getLinkedInAuthUrl } from '@/lib/social/linkedin';

/**
 * GET /api/social/linkedin/auth
 *
 * Generate a LinkedIn OAuth authorization URL.
 * Returns the URL and state for CSRF protection.
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

    if (!clientId) {
      return NextResponse.json(
        { error: 'LinkedIn client ID is not configured' },
        { status: 500 }
      );
    }

    if (!redirectUri) {
      return NextResponse.json(
        { error: 'LinkedIn redirect URI is not configured' },
        { status: 500 }
      );
    }

    // Generate state for CSRF protection
    const state = crypto.randomUUID();

    // Generate the authorization URL
    const authUrl = getLinkedInAuthUrl({
      clientId,
      redirectUri,
      state,
    });

    return NextResponse.json({
      authUrl,
      state,
    });
  } catch (error) {
    console.error('Error generating LinkedIn auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}
