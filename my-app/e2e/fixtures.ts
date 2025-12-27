import { test as base, expect } from '@playwright/test';
import type { Route } from '@playwright/test';

/**
 * Mock response data for AI API
 */
const mockResponses = {
  summarize: {
    bullets: [
      'AI technology breakthrough announced',
      'New model improves performance by 50%',
      'Available for developers next month',
    ],
    category: 'product',
  },
  generate: {
    content: 'This is a mock generated content for testing purposes. #AI #Tech',
    charCount: 65,
    hashtags: ['#AI', '#Tech', '#Innovation'],
  },
  'analyze-style': {
    tone: 'Professional yet approachable with technical depth',
    characteristics: [
      'Uses emojis sparingly',
      'Includes relevant hashtags',
      'Clear and concise language',
      'Technical accuracy',
    ],
  },
  regenerate: {
    content: 'This is regenerated content based on feedback. #AI #Updated',
    charCount: 58,
  },
};

/**
 * Handle mock API response based on request mode
 */
async function handleMockAPIResponse(route: Route) {
  const request = route.request();

  if (request.method() === 'POST') {
    try {
      const body = request.postDataJSON();
      const mode = body?.mode as keyof typeof mockResponses;

      if (mode && mockResponses[mode]) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponses[mode]),
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid mode' }),
        });
      }
    } catch {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Mock API error' }),
      });
    }
    return;
  }

  await route.continue();
}

/**
 * Test data for localStorage seeding
 */
const testNewsData = [
  {
    id: 'test-news-1',
    sourceId: 'test-source-1',
    title: 'AI Breakthrough: New Language Model Released',
    originalContent: 'A major AI company has released a new language model with improved capabilities. The model shows significant improvements in reasoning and code generation tasks.',
    url: 'https://example.com/news/ai-breakthrough',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    quickSummary: {
      bullets: [
        'New AI model with enhanced reasoning',
        'Improved code generation capabilities',
        'Available for developers today'
      ],
      category: 'product',
      createdAt: new Date().toISOString()
    }
  },
  {
    id: 'test-news-2',
    sourceId: 'test-source-1',
    title: 'Tech Industry Updates: Latest Developments',
    originalContent: 'The tech industry continues to evolve rapidly with new developments in cloud computing, AI, and cybersecurity.',
    url: 'https://example.com/news/tech-updates',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

const testSourceData = [
  {
    id: 'test-source-1',
    name: 'Tech News',
    rssUrl: 'https://example.com/rss',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

/**
 * Extended test fixtures with auto-mocking
 */
export const test = base.extend<{
  autoMock: void;
  seedTestData: void;
  clearLocalStorage: () => Promise<void>;
}>({
  /**
   * Automatically mock all APIs before each test
   */
  autoMock: [async ({ page }, use) => {
    // Mock AI API (DeepSeek)
    await page.route('**/api/openai', async (route) => {
      await handleMockAPIResponse(route);
    });

    // Mock RSS API
    await page.route('**/api/rss', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'mock-1',
              title: 'Mock News Article 1',
              content: 'This is mock content for testing.',
              url: 'https://example.com/news/1',
              source: 'Mock Source',
              publishedAt: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    // Mock Scrape API
    await page.route('**/api/scrape', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Scraped Article Title',
          content: 'This is scraped content for testing purposes.',
          url: 'https://example.com/article',
        }),
      });
    });

    await use();
  }, { auto: true }],

  /**
   * Seed test data in localStorage before tests
   */
  seedTestData: [async ({ page }, use) => {
    // Use correct storage keys from lib/constants.ts
    await page.addInitScript((data) => {
      localStorage.setItem('ai-news-items', JSON.stringify(data.news));
      localStorage.setItem('ai-news-sources', JSON.stringify(data.sources));
    }, { news: testNewsData, sources: testSourceData });

    await use();
  }, { auto: true }],

  /**
   * Clear browser storage between tests
   */
  clearLocalStorage: async ({ page }, use) => {
    await use(async () => {
      await page.evaluate(() => localStorage.clear());
      await page.evaluate(() => sessionStorage.clear());
    });
  },
});

export { expect };
