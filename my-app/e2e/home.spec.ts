import { test, expect } from './fixtures';
import { HomePage } from './pages';

/**
 * Home Page Tests
 * Tests use seeded test data from fixtures (2 news items, 1 source)
 */
test.describe('Home Page', () => {
  test('should display main page content', async ({ page }) => {
    await page.goto('/');

    // Just verify the page loads and has basic structure
    // The page should have either stats or news content
    await page.waitForLoadState('domcontentloaded');

    // Check page has loaded by looking for any main content
    const body = page.locator('body');
    const text = await body.textContent();
    expect(text).toBeTruthy();

    // Page should have News Feed button
    await expect(page.getByRole('button', { name: 'News Feed' })).toBeVisible({ timeout: 30000 });
  });

  test('should display correct stats numbers', async ({ page }) => {
    await page.goto('/');

    const homePage = new HomePage(page);
    const totalNews = await homePage.getTotalNewsCount();

    // We seeded 2 news items
    expect(totalNews).toBe(2);
  });

  test('should have News Feed and Collect News tabs', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'News Feed' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Collect News' })).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click Collect News tab
    await page.getByRole('button', { name: 'Collect News' }).click();

    // Wait a moment for tab content to switch
    await page.waitForTimeout(500);

    // Click back to News Feed
    await page.getByRole('button', { name: 'News Feed' }).click();

    // Verify we're back on News Feed (stats should be visible)
    await expect(page.getByText('Total News')).toBeVisible();
  });

  test('should display news cards', async ({ page }) => {
    await page.goto('/');

    // Should have View Details buttons (one per news card)
    const viewButtons = page.getByRole('button', { name: 'View Details' });
    await expect(viewButtons.first()).toBeVisible();

    // Should have 2 news items (from seeded data)
    const count = await viewButtons.count();
    expect(count).toBe(2);
  });

  test('should display news title', async ({ page }) => {
    await page.goto('/');

    // Check seeded news title is visible
    await expect(page.getByText('AI Breakthrough: New Language Model Released')).toBeVisible();
  });

  test('should display source badge', async ({ page }) => {
    await page.goto('/');

    // Check source badge is visible
    await expect(page.getByText('Tech News').first()).toBeVisible();
  });

  test('should display summary bullets', async ({ page }) => {
    await page.goto('/');

    // First news item has summary, check one of the bullets
    await expect(page.getByText('New AI model with enhanced reasoning')).toBeVisible();
  });

  test('should open news detail modal', async ({ page }) => {
    await page.goto('/');

    // Click first View Details button
    await page.getByRole('button', { name: 'View Details' }).first().click();

    // Modal should appear
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should close news detail modal', async ({ page }) => {
    await page.goto('/');

    // Open modal
    await page.getByRole('button', { name: 'View Details' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Close modal using the X button (aria-label="Close modal")
    await page.getByRole('button', { name: 'Close modal' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should have delete button on card', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Delete news' }).first()).toBeVisible();
  });

  test('should have open original button on card', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Open original article' }).first()).toBeVisible();
  });

  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.getByText('Total News').waitFor();
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
