// Threads API Client
// Documentation: https://developers.facebook.com/docs/threads

const THREADS_GRAPH_API_BASE = 'https://graph.threads.net/v1.0';
const THREADS_OAUTH_URL = 'https://threads.net/oauth/authorize';

export interface ThreadsCredentials {
  accessToken: string;
  userId: string;
  expiresAt?: string;
}

export interface ThreadsProfile {
  id: string;
  username: string;
  name?: string;
  threadsProfilePictureUrl?: string;
  threadsBiography?: string;
}

export interface ThreadsPostResult {
  id: string;
  postUrl: string;
}

export interface ThreadsPostOptions {
  text: string;
  mediaType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  imageUrl?: string;
  linkUrl?: string;
  replyToId?: string;
}

export interface ThreadsAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Generate OAuth authorization URL for Threads
 */
export function getThreadsAuthUrl(config: {
  clientId: string;
  redirectUri: string;
  state?: string;
}): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'threads_basic,threads_content_publish',
    response_type: 'code',
  });

  if (config.state) {
    params.append('state', config.state);
  }

  return `${THREADS_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  config: ThreadsAuthConfig
): Promise<{
  accessToken: string;
  userId: string;
  expiresIn?: number;
}> {
  const response = await fetch(`${THREADS_GRAPH_API_BASE}/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error_message || 'Failed to exchange code for token');
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    userId: data.user_id,
    expiresIn: data.expires_in,
  };
}

/**
 * Exchange short-lived token for long-lived token (60 days)
 */
export async function getLongLivedToken(
  shortLivedToken: string,
  clientSecret: string
): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    grant_type: 'th_exchange_token',
    client_secret: clientSecret,
    access_token: shortLivedToken,
  });

  const response = await fetch(
    `${THREADS_GRAPH_API_BASE}/access_token?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error_message || 'Failed to get long-lived token');
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Refresh a long-lived token
 */
export async function refreshLongLivedToken(
  accessToken: string
): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    grant_type: 'th_refresh_token',
    access_token: accessToken,
  });

  const response = await fetch(
    `${THREADS_GRAPH_API_BASE}/refresh_access_token?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error_message || 'Failed to refresh token');
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

class ThreadsClient {
  private accessToken: string;
  private userId: string;

  constructor(credentials: ThreadsCredentials) {
    this.accessToken = credentials.accessToken;
    this.userId = credentials.userId;
  }

  /**
   * Get the authenticated user's profile
   */
  async getProfile(): Promise<ThreadsProfile> {
    const fields = 'id,username,name,threads_profile_picture_url,threads_biography';
    const response = await fetch(
      `${THREADS_GRAPH_API_BASE}/me?fields=${fields}&access_token=${this.accessToken}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to get profile');
    }

    const data = await response.json();
    return {
      id: data.id,
      username: data.username,
      name: data.name,
      threadsProfilePictureUrl: data.threads_profile_picture_url,
      threadsBiography: data.threads_biography,
    };
  }

  /**
   * Create a text post on Threads
   * Two-step process: 1. Create container, 2. Publish
   */
  async createPost(options: ThreadsPostOptions): Promise<ThreadsPostResult> {
    // Step 1: Create media container
    const containerId = await this.createMediaContainer(options);

    // Step 2: Publish the container
    const postId = await this.publishContainer(containerId);

    // Construct the post URL
    const postUrl = `https://www.threads.net/@${(await this.getProfile()).username}/post/${postId}`;

    return {
      id: postId,
      postUrl,
    };
  }

  /**
   * Step 1: Create a media container
   */
  private async createMediaContainer(options: ThreadsPostOptions): Promise<string> {
    const params: Record<string, string> = {
      media_type: options.mediaType || 'TEXT',
      text: options.text,
      access_token: this.accessToken,
    };

    if (options.imageUrl && options.mediaType === 'IMAGE') {
      params.image_url = options.imageUrl;
    }

    if (options.replyToId) {
      params.reply_to_id = options.replyToId;
    }

    const response = await fetch(
      `${THREADS_GRAPH_API_BASE}/${this.userId}/threads`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to create media container');
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Step 2: Publish the media container
   */
  private async publishContainer(containerId: string): Promise<string> {
    // Wait a bit for container to be ready (Threads recommends polling)
    await this.waitForContainerReady(containerId);

    const response = await fetch(
      `${THREADS_GRAPH_API_BASE}/${this.userId}/threads_publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          creation_id: containerId,
          access_token: this.accessToken,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to publish thread');
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Wait for container to be ready (poll status)
   */
  private async waitForContainerReady(containerId: string, maxAttempts = 10): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(
        `${THREADS_GRAPH_API_BASE}/${containerId}?fields=status&access_token=${this.accessToken}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'FINISHED') {
          return;
        }
        if (data.status === 'ERROR') {
          throw new Error('Container processing failed');
        }
      }

      // Wait 1 second before next poll
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Proceed anyway after max attempts (might still work)
  }

  /**
   * Get user's threads
   */
  async getThreads(limit = 20): Promise<Array<{
    id: string;
    text?: string;
    timestamp: string;
    permalink: string;
  }>> {
    const fields = 'id,text,timestamp,permalink';
    const response = await fetch(
      `${THREADS_GRAPH_API_BASE}/${this.userId}/threads?fields=${fields}&limit=${limit}&access_token=${this.accessToken}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to get threads');
    }

    const data = await response.json();
    return data.data || [];
  }
}

// Export factory function
export function createThreadsClient(credentials: ThreadsCredentials): ThreadsClient {
  return new ThreadsClient(credentials);
}

// Export class type
export type { ThreadsClient };
