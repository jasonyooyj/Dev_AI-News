/**
 * LinkedIn API Client
 *
 * LinkedIn uses OAuth 2.0 and the Posts API for content creation.
 * Key endpoints:
 * - OAuth: https://www.linkedin.com/oauth/v2/authorization
 * - Token: https://www.linkedin.com/oauth/v2/accessToken
 * - User info: https://api.linkedin.com/v2/userinfo
 * - Posts: https://api.linkedin.com/rest/posts
 *
 * Required scopes: openid, profile, email, w_member_social
 * Token validity: 60 days (access), 1 year (refresh)
 * Max post length: 3,000 characters
 */

// =============================================================================
// Types
// =============================================================================

export interface LinkedInCredentials {
  accessToken: string;
  personUrn: string; // urn:li:person:{sub}
  expiresAt?: string;
  refreshToken?: string;
}

export interface LinkedInAuthConfig {
  clientId: string;
  redirectUri: string;
  state?: string;
}

export interface LinkedInTokenResult {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
  refreshTokenExpiresIn?: number;
  scope: string;
}

export interface LinkedInProfile {
  sub: string; // Member ID
  name: string;
  givenName: string;
  familyName: string;
  email: string;
  emailVerified: boolean;
  picture?: string;
  locale?: {
    country: string;
    language: string;
  };
}

export interface LinkedInPostOptions {
  text: string;
  articleUrl?: string;
  articleTitle?: string;
  articleDescription?: string;
  visibility?: 'PUBLIC' | 'CONNECTIONS';
}

export interface LinkedInPostResult {
  id: string;
  postUrl: string;
}

// =============================================================================
// OAuth Helper Functions
// =============================================================================

/**
 * Generate the LinkedIn OAuth authorization URL
 */
export function getLinkedInAuthUrl(config: LinkedInAuthConfig): string {
  const { clientId, redirectUri, state } = config;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid profile email w_member_social',
    state: state || crypto.randomUUID(),
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  config: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }
): Promise<LinkedInTokenResult> {
  const { clientId, clientSecret, redirectUri } = config;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error_description || error.error || 'Failed to exchange code for token'
    );
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
    refreshTokenExpiresIn: data.refresh_token_expires_in,
    scope: data.scope,
  };
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(
  refreshToken: string,
  config: {
    clientId: string;
    clientSecret: string;
  }
): Promise<LinkedInTokenResult> {
  const { clientId, clientSecret } = config;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error_description || error.error || 'Failed to refresh token'
    );
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
    refreshTokenExpiresIn: data.refresh_token_expires_in,
    scope: data.scope,
  };
}

// =============================================================================
// LinkedIn Client Class
// =============================================================================

class LinkedInClient {
  private accessToken: string;
  private personUrn: string;

  constructor(credentials: LinkedInCredentials) {
    this.accessToken = credentials.accessToken;
    this.personUrn = credentials.personUrn;
  }

  /**
   * Get common headers for LinkedIn API requests
   */
  private getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202411', // YYYYMM format
    };
  }

  /**
   * Get the authenticated user's profile
   */
  async getProfile(): Promise<LinkedInProfile> {
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || error.error || 'Failed to fetch LinkedIn profile'
      );
    }

    const data = await response.json();

    return {
      sub: data.sub,
      name: data.name,
      givenName: data.given_name,
      familyName: data.family_name,
      email: data.email,
      emailVerified: data.email_verified,
      picture: data.picture,
      locale: data.locale,
    };
  }

  /**
   * Create a post on LinkedIn
   */
  async createPost(options: LinkedInPostOptions): Promise<LinkedInPostResult> {
    const { text, articleUrl, articleTitle, articleDescription, visibility = 'PUBLIC' } = options;

    // Validate text length
    if (!text || text.length === 0) {
      throw new Error('Post text is required');
    }

    if (text.length > 3000) {
      throw new Error('Post text cannot exceed 3,000 characters');
    }

    // Build the request body
    const body: Record<string, unknown> = {
      author: this.personUrn,
      commentary: text,
      visibility: visibility,
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    };

    // Add article content if provided
    if (articleUrl) {
      body.content = {
        article: {
          source: articleUrl,
          title: articleTitle || '',
          description: articleDescription || '',
        },
      };
    }

    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || error.error || 'Failed to create LinkedIn post'
      );
    }

    // Get the post ID from the x-restli-id header
    const postUrn = response.headers.get('x-restli-id');

    // Try to get post details from response body
    let postId = '';
    try {
      const data = await response.json();
      postId = data.id || postUrn || '';
    } catch {
      postId = postUrn || '';
    }

    // Extract the share ID from the URN (urn:li:share:123456789)
    const shareId = postId.split(':').pop() || postId;

    // Construct the post URL
    const postUrl = `https://www.linkedin.com/feed/update/${postId}`;

    return {
      id: postId,
      postUrl,
    };
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a LinkedIn client instance
 */
export function createLinkedInClient(credentials: LinkedInCredentials): LinkedInClient {
  return new LinkedInClient(credentials);
}

/**
 * Convert a member sub to a person URN
 */
export function toPersonUrn(sub: string): string {
  if (sub.startsWith('urn:li:person:')) {
    return sub;
  }
  return `urn:li:person:${sub}`;
}
