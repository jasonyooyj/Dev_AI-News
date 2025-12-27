import { test, expect } from './fixtures';

/**
 * User Workflow Tests
 * End-to-end user journey tests with seeded data
 */
test.describe('User Workflows', () => {
  test('user can view news list and open detail', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // User sees stats
    await expect(page.getByText('Total News')).toBeVisible({ timeout: 10000 });

    // User sees news cards
    const viewButton = page.getByRole('button', { name: 'View Details' }).first();
    await expect(viewButton).toBeVisible();

    // User clicks to view details
    await viewButton.click();

    // Modal opens
    await expect(page.getByRole('dialog')).toBeVisible();

    // User closes modal
    await page.getByRole('button', { name: 'Close modal' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('user can navigate between tabs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for page to load
    await expect(page.getByText('Total News')).toBeVisible({ timeout: 10000 });

    // User clicks Collect News tab
    await page.getByRole('button', { name: 'Collect News' }).click();
    await page.waitForTimeout(500);

    // User clicks back to News Feed
    await page.getByRole('button', { name: 'News Feed' }).click();

    // User sees stats again
    await expect(page.getByText('Total News')).toBeVisible();
  });

  test('user can browse modal tabs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for news to load
    const viewButton = page.getByRole('button', { name: 'View Details' }).first();
    await expect(viewButton).toBeVisible({ timeout: 10000 });

    // Open modal
    await viewButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Browse Full Article tab
    await page.getByRole('button', { name: /Full Article/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Browse Generate tab
    await page.getByRole('button', { name: /Generate/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('user data persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check initial state - wait for view buttons
    await expect(page.getByRole('button', { name: 'View Details' }).first()).toBeVisible({ timeout: 10000 });
    const countBefore = await page.getByRole('button', { name: 'View Details' }).count();
    expect(countBefore).toBeGreaterThan(0);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Data should still be there
    await expect(page.getByRole('button', { name: 'View Details' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Stats should still be visible
    await expect(page.getByText('Total News')).toBeVisible({ timeout: 10000 });
  });

  test('page loads quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.getByText('Total News').waitFor({ timeout: 10000 });
    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds (generous for CI)
    expect(loadTime).toBeLessThan(10000);
  });
});
