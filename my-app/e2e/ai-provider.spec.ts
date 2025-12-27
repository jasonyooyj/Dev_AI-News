import { test, expect } from './fixtures';

/**
 * AI Provider Selection Tests
 * All API calls are automatically mocked
 */
test.describe('AI Provider Selection', () => {
  test.describe('Provider Detection', () => {
    test('should detect available AI providers', async ({ page }) => {
      await page.goto('/');

      // Make API call through page context
      const data = await page.evaluate(async () => {
        const response = await fetch('/api/openai');
        return response.json();
      });

      expect(data.providers).toBeDefined();
      expect(typeof data.providers.openai).toBe('boolean');
      expect(typeof data.providers.deepseek).toBe('boolean');
    });

    test('should return default provider', async ({ page }) => {
      await page.goto('/');

      const data = await page.evaluate(async () => {
        const response = await fetch('/api/openai');
        return response.json();
      });

      expect(data.defaultProvider).toBe('openai');
    });

    test('should provide model information', async ({ page }) => {
      await page.goto('/');

      const data = await page.evaluate(async () => {
        const response = await fetch('/api/openai');
        return response.json();
      });

      expect(data.models).toBeDefined();
      expect(data.models.openai).toBe('gpt-4o-mini');
      expect(data.models.deepseek).toBe('deepseek-reasoner');
    });
  });

  test.describe('Content Generation', () => {
    test('should generate summary content', async ({ page }) => {
      await page.goto('/');

      const data = await page.evaluate(async () => {
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'summarize',
            title: 'Test Article',
            content: 'Test content about AI',
          }),
        });
        return response.json();
      });

      expect(data.bullets).toBeDefined();
      expect(data.category).toBeDefined();
      expect(Array.isArray(data.bullets)).toBe(true);
    });

    test('should generate platform content', async ({ page }) => {
      await page.goto('/');

      const data = await page.evaluate(async () => {
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'generate',
            title: 'Test',
            content: 'Test content',
            platform: 'twitter',
          }),
        });
        return response.json();
      });

      expect(data.content).toBeDefined();
      expect(data.charCount).toBeDefined();
    });

    test('should analyze style from examples', async ({ page }) => {
      await page.goto('/');

      const data = await page.evaluate(async () => {
        const response = await fetch('/api/openai', {
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

    test('should regenerate content with feedback', async ({ page }) => {
      await page.goto('/');

      const data = await page.evaluate(async () => {
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'regenerate',
            previousContent: 'Original',
            feedback: 'Make shorter',
            platform: 'twitter',
          }),
        });
        return response.json();
      });

      expect(data.content).toBeDefined();
      expect(data.charCount).toBeDefined();
    });
  });

  test.describe('Client-Side Provider Selection', () => {
    test('should store provider preference', async ({ page }) => {
      await page.goto('/');

      await page.evaluate(() => {
        localStorage.setItem('ai-provider-preference', 'deepseek');
      });

      const provider = await page.evaluate(() => {
        return localStorage.getItem('ai-provider-preference');
      });

      expect(provider).toBe('deepseek');
    });

    test('should persist provider preference across reload', async ({ page }) => {
      await page.goto('/');

      await page.evaluate(() => {
        localStorage.setItem('ai-provider-preference', 'openai');
      });

      await page.reload();

      const provider = await page.evaluate(() => {
        return localStorage.getItem('ai-provider-preference');
      });

      expect(provider).toBe('openai');
    });
  });

  test.describe('Error Handling', () => {
    test('should return error for invalid mode', async ({ page }) => {
      await page.goto('/');

      const result = await page.evaluate(async () => {
        const response = await fetch('/api/openai', {
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
});
