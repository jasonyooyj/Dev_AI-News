import { Platform, StyleTemplate } from '@/types/news';

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

interface AnalyzeStyleResponse {
  tone: string;
  characteristics: string[];
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
      const response = await fetch('/api/openai', {
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
        styleTemplate?: Pick<StyleTemplate, 'tone' | 'characteristics' | 'examples'>;
      }
    ): Promise<GenerateResponse> => {
      const response = await fetch('/api/openai', {
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

    analyzeStyle: async (examples: string[]): Promise<AnalyzeStyleResponse> => {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'analyze-style', examples }),
      });
      return handleResponse<AnalyzeStyleResponse>(response);
    },

    regenerate: async (
      previousContent: string,
      feedback: string,
      platform: Platform
    ): Promise<GenerateResponse> => {
      const response = await fetch('/api/openai', {
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
      const response = await fetch('/api/openai', {
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
};
