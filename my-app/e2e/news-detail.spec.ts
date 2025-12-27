import { test, expect } from './fixtures';

/**
 * News Detail Modal Tests
 * Tests use seeded test data from fixtures
 */
test.describe('News Detail Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for news cards to appear and open the modal
    const viewButton = page.getByRole('button', { name: 'View Details' }).first();
    await expect(viewButton).toBeVisible({ timeout: 10000 });
    await viewButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should display modal', async ({ page }) => {
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
  });

  test('should have Summary tab', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Summary/i })).toBeVisible();
  });

  test('should have Full Article tab', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Full Article/i })).toBeVisible();
  });

  test('should have Generate tab', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Generate/i })).toBeVisible();
  });

  test('should switch to Full Article tab', async ({ page }) => {
    await page.getByRole('button', { name: /Full Article/i }).click();
    // Should still be in modal
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should switch to Generate tab', async ({ page }) => {
    await page.getByRole('button', { name: /Generate/i }).click();
    // Should still be in modal (tab switched)
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should show platform buttons in Generate tab', async ({ page }) => {
    await page.getByRole('button', { name: /Generate/i }).click();
    await expect(page.getByText('Threads', { exact: false })).toBeVisible();
    await expect(page.getByText('LinkedIn', { exact: false })).toBeVisible();
  });

  test('should close modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Close modal' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should display content in modal', async ({ page }) => {
    // Modal should have some content
    const dialog = page.getByRole('dialog');
    const text = await dialog.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(10);
  });
});
