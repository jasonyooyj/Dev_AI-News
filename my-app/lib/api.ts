import { Platform, SocialPlatform } from '@/types/news';

// API Response types
interface SummarizeResponse {
  bullets: string[];
  category: string;
}

interface GenerateResponse {
  content: string;
  charCount: number;
  hashtags?: string[];
}

interface RssItem {
  title: string;
  link: string;
  content?: string;
  contentSnippet?: string;
  pubDate?: string;
  isoDate?: string;
}

interface RssResponse {
  items: RssItem[];
}

interface ScrapeResponse {
  title: string;
  content: string;
  url?: string;
}

interface ScrapedArticle {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
}

interface ScrapeSourceResponse {
  articles: ScrapedArticle[];
  count: number;
  url: string;
}

interface ScrapeConfig {
  articleSelector: string;
  titleSelector: string;
  linkSelector: string;
  descriptionSelector?: string;
  dateSelector?: string;
}

// Threads Profile API types
interface ThreadsPost {
  postUrl: string;
  content: string;
  author: string;
  authorName: string;
  timestamp: string | null;
  mediaUrls: string[];
  likes: number | null;
  replies: number | null;
}

interface ThreadsProfileResponse {
  username: string;
  displayName: string;
  bio: string | null;
  profilePicture: string | null;
  posts: ThreadsPost[];
  postsCount: number;
}

// YouTube Channel API types
interface YouTubeVideo {
  videoId: string;
  title: string;
  link: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
}

interface YouTubeChannelResponse {
  channelId: string;
  channelTitle: string;
  videos: YouTubeVideo[];
  videosCount: number;
}

// Social Media API types
interface BlueskyConnectResponse {
  success: boolean;
  profile: {
    did: string;
    handle: string;
    displayName?: string;
    avatar?: string;
  };
}

interface BlueskyPostResponse {
  success: boolean;
  post: {
    uri: string;
    cid: string;
    postUrl: string;
  };
}

interface SocialPostRequest {
  identifier: string;
  appPassword: string;
  text: string;
  linkUrl?: string;
}

// Threads API types
interface ThreadsCallbackResponse {
  success: boolean;
  profile: {
    id: string;
    username: string;
    name?: string;
    profilePictureUrl?: string;
  };
  credentials: {
    accessToken: string;
    userId: string;
    expiresAt: string;
  };
}

interface ThreadsPostRequest {
  accessToken: string;
  userId: string;
  text: string;
  imageUrl?: string;
}

interface ThreadsPostResponse {
  success: boolean;
  post: {
    id: string;
    postUrl: string;
  };
}

// LinkedIn API types
interface LinkedInCallbackResponse {
  success: boolean;
  profile: {
    sub: string;
    name: string;
    email: string;
    picture?: string;
    givenName: string;
    familyName: string;
  };
  credentials: {
    accessToken: string;
    personUrn: string;
    expiresAt: string;
    refreshToken?: string;
  };
}

interface LinkedInPostRequest {
  accessToken: string;
  personUrn: string;
  text: string;
  articleUrl?: string;
  articleTitle?: string;
  articleDescription?: string;
  visibility?: 'PUBLIC' | 'CONNECTIONS';
}

interface LinkedInPostResponse {
  success: boolean;
  post: {
    id: string;
    postUrl: string;
  };
}

// Instagram API types
interface InstagramCallbackResponse {
  success: boolean;
  profile: {
    id: string;
    username: string;
    name?: string;
    profilePictureUrl?: string;
    accountType?: 'BUSINESS' | 'CREATOR' | 'MEDIA_CREATOR';
  };
  credentials: {
    accessToken: string;
    userId: string;
    expiresAt: string;
  };
}

interface InstagramPostRequest {
  accessToken: string;
  userId: string;
  imageUrl: string; // Required - Instagram doesn't support text-only posts
  caption: string;
  locationId?: string;
  userTags?: Array<{
    username: string;
    x: number;
    y: number;
  }>;
}

interface InstagramPostResponse {
  success: boolean;
  post: {
    id: string;
    postUrl: string;
  };
}

// Error handling
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || `Request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json();
}

// API Client
export const api = {
  // AI endpoints (DeepSeek)
  ai: {
    summarize: async (
      title: string,
      content: string
    ): Promise<SummarizeResponse> => {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'summarize', title, content }),
      });
      return handleResponse<SummarizeResponse>(response);
    },

    generate: async (
      title: string,
      content: string,
      platform: Platform,
      options?: {
        url?: string;
        sourceName?: string;
      }
    ): Promise<GenerateResponse> => {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'generate',
          title,
          content,
          platform,
          ...options,
        }),
      });
      return handleResponse<GenerateResponse>(response);
    },

    regenerate: async (
      previousContent: string,
      feedback: string,
      platform: Platform
    ): Promise<GenerateResponse> => {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'regenerate',
          previousContent,
          feedback,
          platform,
        }),
      });
      return handleResponse<GenerateResponse>(response);
    },

    translate: async (
      title: string,
      content: string
    ): Promise<{ title: string; content: string; isTranslated: boolean }> => {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'translate', title, content }),
      });
      return handleResponse<{ title: string; content: string; isTranslated: boolean }>(response);
    },
  },

  // RSS Feed
  rss: {
    fetch: async (url: string): Promise<RssResponse> => {
      const response = await fetch('/api/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      return handleResponse<RssResponse>(response);
    },
  },

  // Web Scraping
  scrape: {
    fetch: async (url: string): Promise<ScrapeResponse> => {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      return handleResponse<ScrapeResponse>(response);
    },

    // Scrape news list from source website
    fetchSource: async (url: string, scrapeConfig?: ScrapeConfig): Promise<ScrapeSourceResponse> => {
      const response = await fetch('/api/scrape-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, scrapeConfig }),
      });
      return handleResponse<ScrapeSourceResponse>(response);
    },

    // Scrape Threads profile feed
    fetchThreadsProfile: async (url: string, limit?: number): Promise<ThreadsProfileResponse> => {
      const response = await fetch('/api/scrape/threads/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, limit: limit || 10 }),
      });
      return handleResponse<ThreadsProfileResponse>(response);
    },

    // Fetch YouTube channel videos
    fetchYouTubeChannel: async (url: string, limit?: number): Promise<YouTubeChannelResponse> => {
      const response = await fetch('/api/youtube/channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, limit: limit || 10 }),
      });
      return handleResponse<YouTubeChannelResponse>(response);
    },
  },

  // Social Media
  social: {
    bluesky: {
      // Verify credentials and get profile
      connect: async (
        identifier: string,
        appPassword: string
      ): Promise<BlueskyConnectResponse> => {
        const response = await fetch('/api/social/bluesky/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, appPassword }),
        });
        return handleResponse<BlueskyConnectResponse>(response);
      },

      // Create a post
      post: async (request: SocialPostRequest): Promise<BlueskyPostResponse> => {
        const response = await fetch('/api/social/bluesky/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
        return handleResponse<BlueskyPostResponse>(response);
      },
    },

    threads: {
      // Exchange OAuth code for tokens
      callback: async (code: string): Promise<ThreadsCallbackResponse> => {
        const response = await fetch('/api/social/threads/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        return handleResponse<ThreadsCallbackResponse>(response);
      },

      // Create a post
      post: async (request: ThreadsPostRequest): Promise<ThreadsPostResponse> => {
        const response = await fetch('/api/social/threads/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
        return handleResponse<ThreadsPostResponse>(response);
      },
    },

    linkedin: {
      // Exchange OAuth code for tokens
      callback: async (code: string): Promise<LinkedInCallbackResponse> => {
        const response = await fetch('/api/social/linkedin/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        return handleResponse<LinkedInCallbackResponse>(response);
      },

      // Create a post
      post: async (request: LinkedInPostRequest): Promise<LinkedInPostResponse> => {
        const response = await fetch('/api/social/linkedin/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
        return handleResponse<LinkedInPostResponse>(response);
      },
    },

    instagram: {
      // Exchange OAuth code for tokens
      callback: async (code: string): Promise<InstagramCallbackResponse> => {
        const response = await fetch('/api/social/instagram/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        return handleResponse<InstagramCallbackResponse>(response);
      },

      // Create a post (requires image)
      post: async (request: InstagramPostRequest): Promise<InstagramPostResponse> => {
        const response = await fetch('/api/social/instagram/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
        return handleResponse<InstagramPostResponse>(response);
      },
    },
  },
};

export { ApiError };
export type {
  SummarizeResponse,
  GenerateResponse,
  AnalyzeStyleResponse,
  RssItem,
  RssResponse,
  ScrapeResponse,
  ScrapedArticle,
  ScrapeSourceResponse,
  ScrapeConfig,
  ThreadsPost,
  ThreadsProfileResponse,
  BlueskyConnectResponse,
  BlueskyPostResponse,
  SocialPostRequest,
  ThreadsCallbackResponse,
  ThreadsPostRequest,
  ThreadsPostResponse,
  LinkedInCallbackResponse,
  LinkedInPostRequest,
  LinkedInPostResponse,
  InstagramCallbackResponse,
  InstagramPostRequest,
  InstagramPostResponse,
};
