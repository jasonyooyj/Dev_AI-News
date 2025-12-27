import { Page, expect } from '@playwright/test';

/**
 * Base page object class
 * Contains common methods and properties used across all pages
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    // Wait for main layout or body to be visible
    await expect(this.page.locator('body')).toBeVisible({ timeout: 10000 });
    // Wait for any loading spinners to disappear
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return this.page.locator(selector).isVisible();
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout = 5000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Get text content
   */
  async getText(selector: string): Promise<string> {
    const text = await this.page.locator(selector).textContent();
    return text ?? '';
  }

  /**
   * Click element
   */
  async click(selector: string) {
    await this.page.locator(selector).click();
  }

  /**
   * Fill input field
   */
  async fill(selector: string, text: string) {
    await this.page.locator(selector).fill(text);
  }

  /**
   * Clear local storage
   */
  async clearStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}
