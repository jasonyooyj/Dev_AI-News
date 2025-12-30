import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForToken,
  createLinkedInClient,
  toPersonUrn,
} from '@/lib/social/linkedin';

/**
 * POST /api/social/linkedin/callback
 *
 * Exchange an authorization code for access token and fetch user profile.
 *
 * Request body:
 * - code: string (authorization code from OAuth callback)
 *
 * Response:
 * - success: boolean
 * - profile: { sub, name, email, picture }
 * - credentials: { accessToken, personUrn, expiresAt, refreshToken }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: 'LinkedIn credentials are not configured' },
        { status: 500 }
      );
    }

    // Exchange code for access token
    const tokenResult = await exchangeCodeForToken(code, {
      clientId,
      clientSecret,
      redirectUri,
    });

    // Calculate token expiration
    const expiresAt = new Date(
      Date.now() + tokenResult.expiresIn * 1000
    ).toISOString();

    // Create client to fetch profile
    // We need to get the profile first to get the person URN
    const tempClient = createLinkedInClient({
      accessToken: tokenResult.accessToken,
      personUrn: '', // Will be filled after profile fetch
    });

    const profile = await tempClient.getProfile();
    const personUrn = toPersonUrn(profile.sub);

    return NextResponse.json({
      success: true,
      profile: {
        sub: profile.sub,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
        givenName: profile.givenName,
        familyName: profile.familyName,
      },
      credentials: {
        accessToken: tokenResult.accessToken,
        personUrn,
        expiresAt,
        refreshToken: tokenResult.refreshToken,
      },
    });
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to complete LinkedIn authorization';

    let status = 500;
    if (message.includes('Invalid') || message.includes('expired')) {
      status = 401;
    }

    return NextResponse.json({ error: message }, { status });
  }
}
