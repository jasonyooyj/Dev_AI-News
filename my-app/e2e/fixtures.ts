import { test as base, expect } from '@playwright/test';
import type { Page, Route, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test credentials - should match a real user in Firebase
 */
const TEST_USER = {
  email: 'admin@admin.com',
  password: 'admin123',
};

/**
 * Path for storing authentication state
 */
const AUTH_STATE_PATH = path.join(__dirname, '../playwright/.auth/user.json');

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
 * Check if we have a valid saved auth state
 */
function hasValidAuthState(): boolean {
  try {
    if (!fs.existsSync(AUTH_STATE_PATH)) return false;
    const stats = fs.statSync(AUTH_STATE_PATH);
    // Auth state is valid for 30 minutes
    const thirtyMinutes = 30 * 60 * 1000;
    return Date.now() - stats.mtimeMs < thirtyMinutes;
  } catch {
    return false;
  }
}

/**
 * Save browser storage state for reuse
 */
async function saveAuthState(context: BrowserContext): Promise<void> {
  const dir = path.dirname(AUTH_STATE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  await context.storageState({ path: AUTH_STATE_PATH });
  console.log('Auth state saved');
}

/**
 * Login helper function with retries
 */
async function login(page: Page, context: BrowserContext, maxRetries = 3) {
  // Enable console logging for debugging - capture all logs during test
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' ||
        text.includes('Firebase') ||
        text.includes('Firestore') ||
        text.includes('subscription') ||
        text.includes('loading')) {
      console.log(`Browser [${msg.type()}]: ${text}`);
    }
  });

  // Also log any page errors
  page.on('pageerror', error => {
    console.log(`Page error: ${error.message}`);
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Login attempt ${attempt}/${maxRetries}`);

      // Navigate to login page
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check if already logged in (redirected to /)
      if (page.url().endsWith('/') || page.url().includes('localhost:3000/')) {
        const isHome = await page.getByText('Total News').isVisible({ timeout: 5000 }).catch(() => false);
        if (isHome) {
          console.log('Already logged in');
          await saveAuthState(context);
          return;
        }
      }

      // Wait for the login form to be visible
      await page.locator('#email').waitFor({ state: 'visible', timeout: 10000 });

      // Fill in credentials using input IDs
      await page.locator('#email').fill(TEST_USER.email);
      await page.locator('#password').fill(TEST_USER.password);

      // Submit form
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Wait for either:
      // 1. Successful navigation to home page with content loaded
      // 2. Error message on login form
      await Promise.race([
        page.waitForURL('/', { timeout: 30000 }),
        page.waitForSelector('.text-red-600, .text-red-400', { timeout: 30000 })
          .then(async () => {
            const errorText = await page.locator('.text-red-600, .text-red-400').textContent();
            throw new Error(`Login failed: ${errorText}`);
          }),
      ]);

      console.log('Login succeeded, URL changed to /');

      // Now wait for actual content to load (Firestore data)
      // This might take longer as Firestore subscriptions need to fire
      await page.waitForSelector(':is(:text("Total News"), :text("News Feed"))', { timeout: 60000 });
      console.log('Home page content loaded');

      // Handle migration dialog if it appears - click Skip
      const skipButton = page.getByRole('button', { name: 'Skip' });
      if (await skipButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }

      // Save auth state for future tests
      await saveAuthState(context);
      return;

    } catch (e) {
      lastError = e as Error;
      console.log(`Login attempt ${attempt} failed: ${lastError.message}`);

      if (attempt < maxRetries) {
        // Clear cookies and storage before retry
        try {
          await context.clearCookies();
          await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
          });
        } catch {
          // Context might be closed, ignore
        }
        await page.waitForTimeout(2000);
      }
    }
  }

  // All retries failed
  await page.screenshot({ path: 'test-results/login-debug.png' }).catch(() => {});
  throw lastError || new Error('Login failed after all retries');
}

/**
 * Extended test fixtures with real Firebase auth
 */
export const test = base.extend<{
  authenticatedPage: Page;
  mockAPIs: void;
}>({
  /**
   * Provides an authenticated page (logs in before test)
   */
  authenticatedPage: async ({ page, context }, use) => {
    // Mock AI APIs to avoid real API calls
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

    // Login with retry logic
    await login(page, context);

    await use(page);
  },

  /**
   * Mock external APIs (AI, RSS, Scrape) without auth
   */
  mockAPIs: [async ({ page }, use) => {
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
});

export { expect };
