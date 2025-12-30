/**
 * Instagram API Client
 *
 * Uses Instagram Business Login (Graph API) for Business/Creator accounts.
 * Note: Instagram requires images for all posts - text-only posts are not supported.
 *
 * OAuth Flow:
 * 1. Redirect to Instagram authorization URL
 * 2. User grants permissions
 * 3. Exchange code for short-lived token
 * 4. Exchange short-lived token for long-lived token (60 days)
 *
 * Posting Flow (2-step container process):
 * 1. Create media container with image URL and caption
 * 2. Publish the container
 *
 * Required Scopes:
 * - instagram_business_basic
 * - instagram_business_content_publish
 *
 * @see https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
 */

// Instagram OAuth configuration
export interface InstagramAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// Instagram credentials stored after OAuth
export interface InstagramCredentials {
  accessToken: string;
  userId: string;
  expiresAt?: string;
}

// Instagram user profile
export interface InstagramProfile {
  id: string;
  username: string;
  name?: string;
  profilePictureUrl?: string;
  accountType?: 'BUSINESS' | 'CREATOR' | 'MEDIA_CREATOR';
}

// Token exchange result
export interface InstagramTokenResult {
  accessToken: string;
  userId: string;
  expiresIn: number;
}

// Post options
export interface InstagramPostOptions {
  imageUrl: string; // Required - publicly accessible image URL
  caption: string;
  locationId?: string;
  userTags?: Array<{
    username: string;
    x: number;
    y: number;
  }>;
}

// Post result
export interface InstagramPostResult {
  id: string;
  postUrl: string;
}

// API base URLs
const INSTAGRAM_AUTH_URL = 'https://www.instagram.com/oauth/authorize';
const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';

/**
 * Generate Instagram OAuth authorization URL
 */
export function getInstagramAuthUrl(config: InstagramAuthConfig): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'instagram_business_basic,instagram_business_content_publish',
  });

  return `${INSTAGRAM_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for short-lived access token
 */
export async function exchangeCodeForToken(
  code: string,
  config: InstagramAuthConfig
): Promise<InstagramTokenResult> {
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
    code,
  });

  const response = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error_message || `Token exchange failed: ${response.status}`
    );
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    userId: data.user_id.toString(),
    expiresIn: 3600, // Short-lived token: 1 hour
  };
}

/**
 * Exchange short-lived token for long-lived token (60 days)
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  config: InstagramAuthConfig
): Promise<InstagramTokenResult> {
  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: config.clientSecret,
    access_token: shortLivedToken,
  });

  const response = await fetch(
    `${INSTAGRAM_GRAPH_URL}/access_token?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `Long-lived token exchange failed: ${response.status}`
    );
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    userId: '', // Not returned in this response
    expiresIn: data.expires_in, // ~60 days in seconds
  };
}

/**
 * Refresh long-lived token (before expiry)
 */
export async function refreshLongLivedToken(
  token: string
): Promise<InstagramTokenResult> {
  const params = new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: token,
  });

  const response = await fetch(
    `${INSTAGRAM_GRAPH_URL}/refresh_access_token?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `Token refresh failed: ${response.status}`
    );
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    userId: '',
    expiresIn: data.expires_in,
  };
}

/**
 * Instagram API Client
 */
class InstagramClient {
  private accessToken: string;
  private userId: string;

  constructor(credentials: InstagramCredentials) {
    this.accessToken = credentials.accessToken;
    this.userId = credentials.userId;
  }

  /**
   * Get user profile information
   */
  async getProfile(): Promise<InstagramProfile> {
    const params = new URLSearchParams({
      fields: 'id,username,name,profile_picture_url,account_type',
      access_token: this.accessToken,
    });

    const response = await fetch(
      `${INSTAGRAM_GRAPH_URL}/me?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `Failed to get profile: ${response.status}`
      );
    }

    const data = await response.json();

    return {
      id: data.id,
      username: data.username,
      name: data.name,
      profilePictureUrl: data.profile_picture_url,
      accountType: data.account_type,
    };
  }

  /**
   * Create a media container (Step 1 of posting)
   * @returns Container ID
   */
  private async createMediaContainer(
    options: InstagramPostOptions
  ): Promise<string> {
    // Validate caption length
    if (options.caption.length > 2200) {
      throw new Error('Caption exceeds 2,200 character limit');
    }

    const params = new URLSearchParams({
      image_url: options.imageUrl,
      caption: options.caption,
      access_token: this.accessToken,
    });

    // Add optional location
    if (options.locationId) {
      params.append('location_id', options.locationId);
    }

    // Add user tags if provided
    if (options.userTags && options.userTags.length > 0) {
      const userTags = options.userTags.map((tag) => ({
        username: tag.username,
        x: tag.x,
        y: tag.y,
      }));
      params.append('user_tags', JSON.stringify(userTags));
    }

    const response = await fetch(
      `${INSTAGRAM_GRAPH_URL}/${this.userId}/media?${params.toString()}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `Failed to create container: ${response.status}`
      );
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Check container status
   */
  private async checkContainerStatus(
    containerId: string
  ): Promise<'IN_PROGRESS' | 'FINISHED' | 'ERROR'> {
    const params = new URLSearchParams({
      fields: 'status_code',
      access_token: this.accessToken,
    });

    const response = await fetch(
      `${INSTAGRAM_GRAPH_URL}/${containerId}?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('Failed to check container status');
    }

    const data = await response.json();
    return data.status_code;
  }

  /**
   * Publish media container (Step 2 of posting)
   */
  private async publishContainer(containerId: string): Promise<string> {
    const params = new URLSearchParams({
      creation_id: containerId,
      access_token: this.accessToken,
    });

    const response = await fetch(
      `${INSTAGRAM_GRAPH_URL}/${this.userId}/media_publish?${params.toString()}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `Failed to publish: ${response.status}`
      );
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Wait for container to be ready
   */
  private async waitForContainer(
    containerId: string,
    maxAttempts: number = 10
  ): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.checkContainerStatus(containerId);

      if (status === 'FINISHED') {
        return;
      }

      if (status === 'ERROR') {
        throw new Error('Container processing failed');
      }

      // Wait 2 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error('Container processing timeout');
  }

  /**
   * Create a post (full flow)
   * Note: Image URL must be publicly accessible
   */
  async createPost(options: InstagramPostOptions): Promise<InstagramPostResult> {
    // Step 1: Create media container
    const containerId = await this.createMediaContainer(options);

    // Wait for container to be processed
    await this.waitForContainer(containerId);

    // Step 2: Publish the container
    const mediaId = await this.publishContainer(containerId);

    // Get the post permalink
    const params = new URLSearchParams({
      fields: 'permalink',
      access_token: this.accessToken,
    });

    const response = await fetch(
      `${INSTAGRAM_GRAPH_URL}/${mediaId}?${params.toString()}`
    );

    let postUrl = `https://www.instagram.com/p/${mediaId}`;

    if (response.ok) {
      const data = await response.json();
      if (data.permalink) {
        postUrl = data.permalink;
      }
    }

    return {
      id: mediaId,
      postUrl,
    };
  }
}

/**
 * Create Instagram client instance
 */
export function createInstagramClient(
  credentials: InstagramCredentials
): InstagramClient {
  return new InstagramClient(credentials);
}

/**
 * Helper to calculate token expiration date
 */
export function calculateExpiresAt(expiresIn: number): string {
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
  return expiresAt.toISOString();
}

export default InstagramClient;
