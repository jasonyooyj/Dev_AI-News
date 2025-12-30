import { test, expect } from './fixtures';

/**
 * API Route Tests - All calls are automatically mocked
 */
test.describe('API Routes', () => {
  test.describe('POST /api/ai - Content Generation', () => {
    test('should handle summarize mode', async ({ page }) => {
      await page.goto('/');

      const data = await page.evaluate(async () => {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'summarize',
            title: 'Test Title',
            content: 'Test content',
          }),
        });
        return response.json();
      });

      expect(data.bullets).toBeDefined();
      expect(data.category).toBeDefined();
    });

    test('should handle generate mode', async ({ page }) => {
      await page.goto('/');

      const data = await page.evaluate(async () => {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'generate',
            title: 'Test',
            content: 'Test',
            platform: 'twitter',
          }),
        });
        return response.json();
      });

      expect(data.content).toBeDefined();
      expect(data.charCount).toBeDefined();
    });

    test('should handle analyze-style mode', async ({ page }) => {
      await page.goto('/');

      const data = await page.evaluate(async () => {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'analyze-style',
            examples: ['Example 1', 'Example 2'],
          }),
        });
        return response.json();
      });

      expect(data.tone).toBeDefined();
      expect(data.characteristics).toBeDefined();
    });

    test('should handle regenerate mode', async ({ page }) => {
      await page.goto('/');

      const data = await page.evaluate(async () => {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'regenerate',
            previousContent: 'Original',
            feedback: 'Improve',
            platform: 'linkedin',
          }),
        });
        return response.json();
      });

      expect(data.content).toBeDefined();
      expect(data.charCount).toBeDefined();
    });

    test('should return error for invalid mode', async ({ page }) => {
      await page.goto('/');

      const result = await page.evaluate(async () => {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'invalid' }),
        });
        return { status: response.status, data: await response.json() };
      });

      expect(result.status).toBe(400);
      expect(result.data.error).toBeDefined();
    });
  });

  test.describe('POST /api/rss - RSS Fetching', () => {
    test('should return RSS items', async ({ page }) => {
      await page.goto('/');

      const data = await page.evaluate(async () => {
        const response = await fetch('/api/rss', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://example.com/rss' }),
        });
        return response.json();
      });

      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
    });
  });

  test.describe('POST /api/scrape - Web Scraping', () => {
    test('should return scraped content', async ({ page }) => {
      await page.goto('/');

      const data = await page.evaluate(async () => {
        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://example.com' }),
        });
        return response.json();
      });

      expect(data.title).toBeDefined();
      expect(data.content).toBeDefined();
    });
  });
});
