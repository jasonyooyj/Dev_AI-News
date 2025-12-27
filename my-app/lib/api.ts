import { Platform, QuickSummary, PlatformContent, StyleTemplate } from '@/types/news';

export type AIProvider = 'openai' | 'deepseek';

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

interface ProviderStatusResponse {
  providers: { openai: boolean; deepseek: boolean };
  defaultProvider: AIProvider | null;
  models: { openai: string; deepseek: string };
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
  // AI Provider
  provider: {
    getStatus: async (): Promise<ProviderStatusResponse> => {
      const response = await fetch('/api/openai');
      return handleResponse<ProviderStatusResponse>(response);
    },
  },

  // OpenAI endpoints
  ai: {
    summarize: async (
      title: string,
      content: string,
      provider?: AIProvider
    ): Promise<SummarizeResponse> => {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'summarize', title, content, provider }),
      });
      return handleResponse<SummarizeResponse>(response);
    },

    generate: async (
      title: string,
      content: string,
      platform: Platform,
      options?: {
        url?: string;
        provider?: AIProvider;
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

    analyzeStyle: async (
      examples: string[],
      provider?: AIProvider
    ): Promise<AnalyzeStyleResponse> => {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'analyze-style', examples, provider }),
      });
      return handleResponse<AnalyzeStyleResponse>(response);
    },

    regenerate: async (
      previousContent: string,
      feedback: string,
      platform: Platform,
      provider?: AIProvider
    ): Promise<GenerateResponse> => {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'regenerate',
          previousContent,
          feedback,
          platform,
          provider,
        }),
      });
      return handleResponse<GenerateResponse>(response);
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
  },
};

export { ApiError };
export type {
  SummarizeResponse,
  GenerateResponse,
  AnalyzeStyleResponse,
  ProviderStatusResponse,
  RssItem,
  RssResponse,
  ScrapeResponse,
};
