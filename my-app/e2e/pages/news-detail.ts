import { Page, expect } from '@playwright/test';
import { BasePage } from './base';

/**
 * News Detail Modal Page Object
 * Handles interactions with the news detail modal and content generation
 */
export class NewsDetailPage extends BasePage {
  // Selectors for modal
  readonly modalContent = this.page.locator('[role="dialog"]');
  readonly closeButton = this.page.locator('button:has-text("Close")');
  readonly viewOriginalButton = this.page.locator('button:has-text("View Original")');

  // Tab selectors
  readonly summaryTab = this.page.locator('button:has-text("Summary")');
  readonly fullArticleTab = this.page.locator('button:has-text("Full Article")');
  readonly generateContentTab = this.page.locator('button:has-text("Generate Content")');

  // Summary tab content
  readonly categoryBadge = this.page.locator('[class*="Badge"]').first();
  readonly summaryBullets = this.page.locator('li').filter({ hasText: /^/ });

  // Generate content tab selectors
  readonly platformButtons = {
    twitter: this.page.locator('button:has-text("X (Twitter)")'),
    threads: this.page.locator('button:has-text("Threads")'),
    instagram: this.page.locator('button:has-text("Instagram")'),
    linkedin: this.page.locator('button:has-text("LinkedIn")'),
  };

  readonly styleTemplateDropdown = this.page.locator('button:has-text("Default Style")').first();
  readonly generateButton = this.page.locator('button:has-text(/Generate for/i)').or(
    this.page.locator('button:has-text("Generate for X")'),
  );

  readonly platformPreview = this.page.locator('[class*="prose"]');
  readonly generatedContent = this.page.locator('[class*="prose"] p').first();

  // Feedback buttons
  readonly thumbsUpButton = this.page.locator('button[aria-label*="like"]').or(
    this.page.locator('button:has-text("👍")'),
  );
  readonly regenerateButton = this.page.locator('button:has-text("Regenerate")').or(
    this.page.locator('button:has-text("Regenerate with Feedback")'),
  );

  readonly generatingSpinner = this.page.locator('.animate-spin');
  readonly metaInfo = this.page.locator('[class*="flex"]').filter({ hasText: /Processed|Pending/ });

  constructor(page: Page) {
    super(page);
  }

  /**
   * Check if modal is visible
   */
  async isModalVisible(): Promise<boolean> {
    return this.modalContent.isVisible();
  }

  /**
   * Close the modal
   */
  async close() {
    await this.closeButton.click();
    // Wait for modal to disappear
    await this.modalContent.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Get modal title (news headline)
   */
  async getTitle(): Promise<string> {
    const titleLocator = this.page.locator('[role="dialog"] h2').or(
      this.page.locator('[role="dialog"]').locator('div').first(),
    );
    const text = await titleLocator.textContent();
    return text ?? '';
  }

  /**
   * Click on summary tab
   */
  async goToSummaryTab() {
    await this.summaryTab.click();
  }

  /**
   * Click on full article tab
   */
  async goToFullArticleTab() {
    await this.fullArticleTab.click();
  }

  /**
   * Click on generate content tab
   */
  async goToGenerateContentTab() {
    await this.generateContentTab.click();
  }

  /**
   * Get summary bullets
   */
  async getSummaryBullets(): Promise<string[]> {
    const bullets = await this.page
      .locator('[role="dialog"] li')
      .filter({ hasText: /^/ })
      .allTextContents();
    return bullets.map((b) => b.trim()).filter((b) => b.length > 0);
  }

  /**
   * Get news category
   */
  async getCategory(): Promise<string> {
    const text = await this.categoryBadge.textContent();
    return text ?? '';
  }

  /**
   * Get full article content
   */
  async getFullArticleContent(): Promise<string> {
    const text = await this.page
      .locator('[role="dialog"]')
      .locator('[class*="prose"] p')
      .first()
      .textContent();
    return text ?? '';
  }

  /**
   * Select a platform for content generation
   */
  async selectPlatform(platform: 'twitter' | 'threads' | 'instagram' | 'linkedin') {
    await this.platformButtons[platform].click();
    // Wait for selection to register
    await this.page.waitForTimeout(300);
  }

  /**
   * Select a style template
   */
  async selectStyleTemplate(templateName: string) {
    await this.styleTemplateDropdown.click();
    // Wait for dropdown to open
    await this.page.waitForTimeout(200);

    if (templateName === 'Default Style') {
      await this.page.locator('button:has-text("Default Style")').last().click();
    } else {
      await this.page.locator(`button:has-text("${templateName}")`).click();
    }

    // Wait for dropdown to close
    await this.page.waitForTimeout(200);
  }

  /**
   * Generate content for selected platform
   */
  async generateContent() {
    await this.generateButton.click();
    // Wait for content generation
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for content generation to complete
   */
  async waitForGenerationComplete(timeout = 30000) {
    const isGenerating = await this.generatingSpinner.isVisible().catch(() => false);
    if (isGenerating) {
      await this.generatingSpinner.waitFor({ state: 'hidden', timeout });
    }
    // Wait for content to appear
    await expect(this.generatedContent).toBeVisible({ timeout: 5000 });
  }

  /**
   * Get generated content text
   */
  async getGeneratedContent(): Promise<string> {
    const text = await this.generatedContent.textContent();
    return text ?? '';
  }

  /**
   * Check if generated content is visible
   */
  async isGeneratedContentVisible(): Promise<boolean> {
    return this.generatedContent.isVisible();
  }

  /**
   * Click thumbs up for generated content
   */
  async submitPositiveFeedback() {
    await this.thumbsUpButton.click();
  }

  /**
   * Submit feedback and regenerate
   */
  async regenerateWithFeedback(feedback: string) {
    await this.regenerateButton.click();
    // Look for feedback input if available
    const feedbackInput = this.page.locator('input[placeholder*="feedback"]').or(
      this.page.locator('textarea[placeholder*="feedback"]'),
    );

    if (await feedbackInput.isVisible().catch(() => false)) {
      await feedbackInput.fill(feedback);
    }

    // Click regenerate/submit
    const submitButton = this.page.locator('button:has-text(/Submit|Regenerate|Update/)').last();
    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click();
    }

    // Wait for regeneration
    await this.waitForGenerationComplete();
  }

  /**
   * View original article link
   */
  async viewOriginal() {
    await this.viewOriginalButton.click();
  }

  /**
   * Get meta information (status, source, date)
   */
  async getMetaInfo(): Promise<string> {
    const text = await this.metaInfo.textContent();
    return text ?? '';
  }

  /**
   * Check if news is processed
   */
  async isProcessed(): Promise<boolean> {
    const metaText = await this.getMetaInfo();
    return metaText.includes('Processed');
  }
}
