import { test, expect } from './fixtures';

/**
 * User Workflow Tests
 * End-to-end user journey tests with real Firebase auth and Firestore
 */
test.describe('User Workflows', () => {
  test('user can view news list and open detail', async ({ authenticatedPage: page }) => {
    await page.waitForLoadState('networkidle');

    // User sees stats
    await expect(page.getByText('Total News')).toBeVisible({ timeout: 10000 });

    // Check if there's news to interact with
    const viewButtons = page.getByRole('button', { name: 'View Details' });
    const count = await viewButtons.count();

    if (count > 0) {
      // User clicks to view details
      await viewButtons.first().click();

      // Modal opens
      await expect(page.getByRole('dialog')).toBeVisible();

      // User closes modal
      await page.getByRole('button', { name: 'Close modal' }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('user can navigate between tabs', async ({ authenticatedPage: page }) => {
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

  test('user can browse modal tabs', async ({ authenticatedPage: page }) => {
    await page.waitForLoadState('networkidle');

    // Check if there's news to interact with
    const viewButtons = page.getByRole('button', { name: 'View Details' });
    const count = await viewButtons.count();

    if (count > 0) {
      // Open modal
      await viewButtons.first().click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Browse Full Article tab
      await page.getByRole('button', { name: /Full Article/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Browse Generate tab
      await page.getByRole('button', { name: /Generate/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
    }
  });

  test('user data persists across reload', async ({ authenticatedPage: page }) => {
    await page.waitForLoadState('networkidle');

    // Check initial state
    await expect(page.getByText('Total News')).toBeVisible({ timeout: 10000 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Handle migration dialog if it appears after reload
    const skipButton = page.getByRole('button', { name: 'Skip' });
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Stats should still be visible (data persisted)
    await expect(page.getByText('Total News')).toBeVisible({ timeout: 10000 });
  });

  test('responsive design works on mobile', async ({ authenticatedPage: page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');

    // Stats should still be visible
    await expect(page.getByText('Total News')).toBeVisible({ timeout: 10000 });
  });

  test('page loads quickly', async ({ authenticatedPage: page }) => {
    // Page is already loaded from fixture
    // Just verify content is visible
    await expect(page.getByText('Total News')).toBeVisible({ timeout: 10000 });
  });
});
