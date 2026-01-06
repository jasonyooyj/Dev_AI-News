import { test as base, expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

/**
 * Mock response data for AI API (to avoid calling real DeepSeek API)
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
 * Extended test fixtures (no auth required - public access app)
 */
export const test = base.extend<{
  authenticatedPage: Page;
  mockAPIs: void;
}>({
  /**
   * Provides a page ready for testing (navigates to home page)
   * Note: This app uses public access with DEFAULT_USER_ID, no login required
   */
  authenticatedPage: async ({ page }, use) => {
    // Mock AI APIs to avoid real API calls
    await page.route('**/api/ai', async (route) => {
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

    // Navigate to home page (no login required - public access)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await use(page);
  },

  /**
   * Mock external APIs (AI, RSS, Scrape) without auth
   */
  mockAPIs: [async ({ page }, use) => {
    // Mock AI API (DeepSeek)
    await page.route('**/api/ai', async (route) => {
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
});

export { expect };
