import { Page, expect } from '@playwright/test';
import { BasePage } from './base';

/**
 * Home Page Object
 * Handles interactions with the home page and news list
 */
export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Stats card selectors - based on actual CardContent structure
  get statsGrid() {
    return this.page.locator('.grid.grid-cols-1.md\\:grid-cols-4');
  }

  get totalNewsText() {
    return this.page.getByText('Total News');
  }

  get summarizedText() {
    return this.page.getByText('Summarized');
  }

  get pendingText() {
    return this.page.getByText('Pending');
  }

  get activeSourcesText() {
    return this.page.getByText('Active Sources');
  }

  // Tab buttons
  get newsFeedTab() {
    return this.page.getByRole('button', { name: 'News Feed' });
  }

  get collectNewsTab() {
    return this.page.getByRole('button', { name: 'Collect News' });
  }

  // News cards - NewsCard component structure
  get newsCards() {
    return this.page.locator('.group.hover\\:shadow-md');
  }

  get viewDetailsButtons() {
    return this.page.getByRole('button', { name: 'View Details' });
  }

  get deleteButtons() {
    return this.page.getByRole('button', { name: 'Delete news' });
  }

  get openOriginalButtons() {
    return this.page.getByRole('button', { name: 'Open original article' });
  }

  // Modal
  get modal() {
    return this.page.getByRole('dialog');
  }

  // Loading spinner
  get loadingSpinner() {
    return this.page.locator('.animate-spin');
  }

  // Empty state
  get emptyState() {
    return this.page.getByText('No news found');
  }

  /**
   * Navigate to home page
   */
  async goto() {
    await super.goto('/');
    await this.waitForLoading();
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoading() {
    // Wait for page to be ready
    await this.page.waitForLoadState('domcontentloaded');
    // If spinner is visible, wait for it to disappear
    const spinner = this.loadingSpinner;
    if (await spinner.isVisible().catch(() => false)) {
      await spinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    }
  }

  /**
   * Get stat value by label
   */
  async getStatValue(label: string): Promise<number> {
    const card = this.page.locator(`text=${label}`).locator('..');
    const value = await card.locator('.text-2xl.font-bold').textContent();
    return parseInt(value || '0', 10);
  }

  /**
   * Get total news count from stats card
   */
  async getTotalNewsCount(): Promise<number> {
    return this.getStatValue('Total News');
  }

  /**
   * Get summarized news count
   */
  async getSummarizedCount(): Promise<number> {
    return this.getStatValue('Summarized');
  }

  /**
   * Get pending news count
   */
  async getPendingCount(): Promise<number> {
    return this.getStatValue('Pending');
  }

  /**
   * Get active sources count
   */
  async getActiveSourcesCount(): Promise<number> {
    return this.getStatValue('Active Sources');
  }

  /**
   * Check if stats grid is visible
   */
  async areStatsCardsVisible(): Promise<boolean> {
    return this.totalNewsText.isVisible();
  }

  /**
   * Switch to News Feed tab
   */
  async switchToNewsFeed() {
    await this.newsFeedTab.click();
  }

  /**
   * Switch to Collect News tab
   */
  async switchToCollectNews() {
    await this.collectNewsTab.click();
  }

  /**
   * Get news card count
   */
  async getNewsCardCount(): Promise<number> {
    // Count by view details buttons since they're unique per card
    return this.viewDetailsButtons.count();
  }

  /**
   * Get all news card titles
   */
  async getNewsCardTitles(): Promise<string[]> {
    const cards = this.newsCards;
    const count = await cards.count();
    const titles: string[] = [];
    for (let i = 0; i < count; i++) {
      const title = await cards.nth(i).locator('h3').textContent();
      if (title) titles.push(title);
    }
    return titles;
  }

  /**
   * View first news item
   */
  async viewFirstNews() {
    const button = this.viewDetailsButtons.first();
    await button.click();
    await expect(this.modal).toBeVisible({ timeout: 5000 });
  }

  /**
   * Delete first news item
   */
  async deleteFirstNews() {
    await this.deleteButtons.first().click();
  }

  /**
   * Open original article
   */
  async openOriginalArticle() {
    await this.openOriginalButtons.first().click();
  }

  /**
   * Check if empty state is shown
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  /**
   * Check if News Feed tab is active
   */
  async isNewsFeedTabActive(): Promise<boolean> {
    const classes = await this.newsFeedTab.getAttribute('class');
    return classes?.includes('primary') || classes?.includes('bg-') || false;
  }
}
