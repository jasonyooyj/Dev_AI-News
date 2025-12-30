import { BskyAgent, RichText } from '@atproto/api';

// Bluesky API Client
// Documentation: https://docs.bsky.app/

export interface BlueskyCredentials {
  identifier: string;  // handle (e.g., user.bsky.social) or email
  appPassword: string; // App Password from Settings > Privacy > App Passwords
}

export interface BlueskyProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

export interface BlueskyPostResult {
  uri: string;      // at://did:plc:xxx/app.bsky.feed.post/xxx
  cid: string;      // Content ID
  postUrl: string;  // https://bsky.app/profile/xxx/post/xxx
}

export interface BlueskyPostOptions {
  text: string;
  // Optional: URL to create a link card
  linkUrl?: string;
  // Optional: Reply to another post
  replyTo?: {
    uri: string;
    cid: string;
  };
}

class BlueskyClient {
  private agent: BskyAgent;
  private isAuthenticated: boolean = false;

  constructor() {
    this.agent = new BskyAgent({
      service: 'https://bsky.social',
    });
  }

  /**
   * Authenticate with Bluesky using App Password
   * Users can create an App Password at: Settings > Privacy and Security > App Passwords
   */
  async login(credentials: BlueskyCredentials): Promise<BlueskyProfile> {
    try {
      const response = await this.agent.login({
        identifier: credentials.identifier,
        password: credentials.appPassword,
      });

      this.isAuthenticated = true;

      // The login response data type may not include displayName/avatar
      // Cast to access these optional properties
      const data = response.data as {
        did: string;
        handle: string;
        displayName?: string;
        avatar?: string;
      };

      return {
        did: data.did,
        handle: data.handle,
        displayName: data.displayName,
        avatar: data.avatar,
      };
    } catch (error) {
      this.isAuthenticated = false;
      if (error instanceof Error) {
        if (error.message.includes('Invalid identifier or password')) {
          throw new Error('Invalid handle or app password. Please check your credentials.');
        }
        if (error.message.includes('Account not found')) {
          throw new Error('Account not found. Please check your handle.');
        }
        throw new Error(`Authentication failed: ${error.message}`);
      }
      throw new Error('Authentication failed. Please try again.');
    }
  }

  /**
   * Resume a session with existing credentials
   */
  async resumeSession(credentials: BlueskyCredentials): Promise<BlueskyProfile> {
    return this.login(credentials);
  }

  /**
   * Create a post on Bluesky
   * Supports rich text with mentions, links, and hashtags
   */
  async createPost(options: BlueskyPostOptions): Promise<BlueskyPostResult> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.');
    }

    // Create rich text to parse mentions, links, and hashtags
    const richText = new RichText({ text: options.text });
    await richText.detectFacets(this.agent);

    try {
      // Use the agent's post method which handles the record structure
      const response = await this.agent.post({
        text: richText.text,
        facets: richText.facets,
        createdAt: new Date().toISOString(),
      });

      // Extract post ID from URI for URL construction
      const uriParts = response.uri.split('/');
      const postId = uriParts[uriParts.length - 1];
      const handle = this.agent.session?.handle || '';

      return {
        uri: response.uri,
        cid: response.cid,
        postUrl: `https://bsky.app/profile/${handle}/post/${postId}`,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create post: ${error.message}`);
      }
      throw new Error('Failed to create post. Please try again.');
    }
  }

  /**
   * Delete a post
   */
  async deletePost(uri: string): Promise<void> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.');
    }

    try {
      await this.agent.deletePost(uri);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete post: ${error.message}`);
      }
      throw new Error('Failed to delete post. Please try again.');
    }
  }

  /**
   * Get the current session profile
   */
  getProfile(): BlueskyProfile | null {
    if (!this.agent.session) {
      return null;
    }

    // Cast session to access optional properties
    const session = this.agent.session as {
      did: string;
      handle: string;
      displayName?: string;
      avatar?: string;
    };

    return {
      did: session.did,
      handle: session.handle,
      displayName: session.displayName,
      avatar: session.avatar,
    };
  }

  /**
   * Check if the client is authenticated
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated && !!this.agent.session;
  }

  /**
   * Logout and clear the session
   */
  logout(): void {
    this.isAuthenticated = false;
    // Note: BskyAgent doesn't have a logout method, but we clear our state
  }
}

// Export a factory function to create new client instances
export function createBlueskyClient(): BlueskyClient {
  return new BlueskyClient();
}

// Export types
export type { BlueskyClient };
