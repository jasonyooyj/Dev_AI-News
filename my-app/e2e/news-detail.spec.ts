import { test, expect } from './fixtures';

/**
 * News Detail Modal Tests
 * Tests use real Firebase authentication and Firestore data
 */
test.describe('News Detail Modal', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if there's news data to test with
    const viewButtons = page.getByRole('button', { name: 'View Details' });
    const count = await viewButtons.count();

    if (count > 0) {
      // Open modal for tests
      await viewButtons.first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should display modal', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should have Summary tab', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /Summary/i })).toBeVisible();
  });

  test('should have Full Article tab', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /Full Article/i })).toBeVisible();
  });

  test('should have Generate Content tab', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: 'Generate Content' })).toBeVisible();
  });

  test('should have Generate Image tab', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: 'Generate Image' })).toBeVisible();
  });

  test('should switch to Full Article tab', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Full Article/i }).click();
    // Should still be in modal
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should switch to Generate Content tab', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'Generate Content' }).click();
    // Should still be in modal (tab switched)
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should show platform buttons in Generate Content tab', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'Generate Content' }).click();
    await expect(page.getByText('Threads', { exact: false })).toBeVisible();
    await expect(page.getByText('LinkedIn', { exact: false })).toBeVisible();
  });

  test('should close modal', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'Close modal' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should display content in modal', async ({ authenticatedPage: page }) => {
    // Modal should have some content
    const dialog = page.getByRole('dialog');
    const text = await dialog.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(10);
  });
});
