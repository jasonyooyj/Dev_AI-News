# End-to-End Tests for AI News Dashboard

This directory contains comprehensive end-to-end tests for the AI News Dashboard application using Playwright.

## Overview

The E2E test suite covers:

1. **Home Page** - News list display, stats cards, navigation
2. **News Detail Modal** - Content viewing, tab navigation, content generation
3. **API Routes** - OpenAI, RSS, and scrape endpoints
4. **AI Provider Selection** - OpenAI vs DeepSeek provider switching
5. **User Workflows** - Complete user journeys through the application

## Test Files

### Page Objects (`/pages`)

- **`base.ts`** - Base page class with common utilities
- **`home.ts`** - HomePage object for home page interactions
- **`news-detail.ts`** - NewsDetailPage object for modal interactions

### Test Suites

- **`home.spec.ts`** - Home page and news list tests
- **`news-detail.spec.ts`** - News detail modal tests
- **`api.spec.ts`** - API endpoint tests
- **`ai-provider.spec.ts`** - AI provider selection tests
- **`user-workflows.spec.ts`** - Complete user journey tests

### Configuration & Utilities

- **`fixtures.ts`** - Custom test fixtures and utilities
- **`playwright.config.ts`** - Playwright configuration

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### With UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### Specific Browser
```bash
npm run test:e2e:chrome
npm run test:e2e:firefox
npm run test:e2e:webkit
```

### Specific Test File
```bash
npx playwright test e2e/home.spec.ts
```

### Specific Test
```bash
npx playwright test -g "should display stats cards"
```

## Test Structure

Each test follows the **Arrange-Act-Assert** pattern:

```typescript
test('should do something', async ({ page }) => {
  // Arrange: Set up test data and navigate
  const homePage = new HomePage(page);

  // Act: Perform user actions
  await homePage.viewFirstNews();

  // Assert: Verify outcomes
  expect(await homePage.isNewsDetailVisible()).toBe(true);
});
```

## Key Test Scenarios

### Home Page Tests
- Display stats cards with correct values
- Navigate between News Feed and Collect News tabs
- Display news cards with title, source, and date
- Handle empty state gracefully
- Responsive design on mobile, tablet, desktop

### News Detail Modal Tests
- Open and close modal
- Navigate between Summary, Full Article, and Generate Content tabs
- Display summary bullets and category
- Select and switch platforms
- Display and apply style templates
- Generate content (requires mocking)
- Submit feedback and regenerate

### API Tests
- Get provider status endpoint
- Generate summaries (summarize mode)
- Generate platform-specific content (generate mode)
- Analyze writing style (analyze-style mode)
- Regenerate with feedback (regenerate mode)
- Fetch RSS feeds
- Scrape web pages

### AI Provider Tests
- Detect available providers (OpenAI, DeepSeek)
- Generate content with OpenAI
- Generate content with DeepSeek
- Provider fallback behavior
- Client-side provider preference storage
- Concurrent requests handling

### User Workflow Tests
- News discovery workflow
- Content generation workflow
- News management (delete, open original)
- Data persistence across page reloads
- Error handling
- Responsive behavior across devices
- Accessibility features
- Performance metrics

## Fixtures

### Custom Fixtures

- **`setupApp()`** - Initialize app for testing
- **`clearLocalStorage()`** - Clear browser storage
- **`mockOpenAIProvider()`** - Mock OpenAI provider responses
- **`mockDeepSeekProvider()`** - Mock DeepSeek provider responses

Usage:
```typescript
test('my test', async ({ page, clearLocalStorage, setupApp }) => {
  await clearLocalStorage();
  await setupApp();
  // Test code
});
```

## Page Objects

Page Objects encapsulate selectors and interactions, making tests more maintainable:

```typescript
const homePage = new HomePage(page);
await homePage.viewFirstNews();
const count = await homePage.getTotalNewsCount();
```

### HomePage Methods
- `goto()` - Navigate to home
- `getTotalNewsCount()` - Get total news stat
- `getSummarizedCount()` - Get summarized count
- `getPendingCount()` - Get pending count
- `getActiveSourcesCount()` - Get active sources count
- `getNewsCardCount()` - Count visible news cards
- `getNewsCardTitles()` - Get all news titles
- `viewFirstNews()` - Open first news detail
- `viewNewsByTitle(title)` - Open specific news
- `deleteFirstNews()` - Delete first news item
- `switchToNewsFeed()` - Switch to News Feed tab
- `switchToCollectNews()` - Switch to Collect News tab

### NewsDetailPage Methods
- `isModalVisible()` - Check if modal is open
- `close()` - Close the modal
- `getTitle()` - Get modal title
- `goToSummaryTab()` - Switch to summary
- `goToFullArticleTab()` - Switch to full article
- `goToGenerateContentTab()` - Switch to generate
- `getSummaryBullets()` - Get summary bullets
- `selectPlatform(platform)` - Select platform
- `selectStyleTemplate(name)` - Select style template
- `generateContent()` - Generate content
- `waitForGenerationComplete()` - Wait for generation
- `getGeneratedContent()` - Get generated text
- `regenerateWithFeedback(feedback)` - Regenerate with feedback

## Environment Setup

### Prerequisites
- Node.js 18+
- Next.js development server running on `http://localhost:3000`

### Installation
```bash
npm install
npx playwright install
```

### Environment Variables
Create `.env.local` if needed:
```
OPENAI_API_KEY=your-key-here
DEEPSEEK_API_KEY=your-key-here
AI_PROVIDER=openai
```

## Configuration

### Playwright Config (`playwright.config.ts`)

Key settings:
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit
- **Devices**: Desktop, Mobile Chrome, Mobile Safari
- **Retries**: 0 (local), 2 (CI)
- **Reports**: HTML, JSON, JUnit
- **Web Server**: Auto-starts Next.js dev server

## Best Practices

### 1. Use Page Objects
```typescript
// Good
const homePage = new HomePage(page);
await homePage.viewFirstNews();

// Avoid
await page.locator('button:has-text("View Details")').click();
```

### 2. Wait for Elements Properly
```typescript
// Good
await expect(element).toBeVisible({ timeout: 5000 });
await page.waitForLoadState('networkidle');

// Avoid
await page.waitForTimeout(1000); // Hard-coded delays
```

### 3. Use Data Attributes for Selectors
```typescript
// Good
page.locator('[data-testid="news-card"]')

// Less reliable
page.locator('[class*="card"]')
```

### 4. Test User Behavior
```typescript
// Good - Tests what user sees
await expect(page.locator('text=/Total News/')).toBeVisible();

// Less useful - Tests implementation
await expect(page.locator('[data-stat="total"]')).toBeVisible();
```

### 5. Clear Data Between Tests
```typescript
test.beforeEach(async ({ clearLocalStorage }) => {
  await clearLocalStorage(); // Clean start
});
```

## Debugging

### View Test Failures
```bash
npm run test:e2e -- --headed
```

### Step Through Tests
```bash
npm run test:e2e:debug
```

### Generate Test Report
```bash
npx playwright show-report
```

### Watch Specific Test
```bash
npx playwright test -g "test name" --headed
```

## Continuous Integration

The tests are configured for CI/CD:

```bash
# In CI environment
CI=true npm run test:e2e
```

Features:
- Single worker execution
- Automatic retries (2x)
- Screenshots on failure
- Video on failure
- HTML report generation

## Adding New Tests

1. **Create test file** in `e2e/` directory
2. **Import fixtures** from `./fixtures`
3. **Organize with `test.describe`** blocks
4. **Use Page Objects** for interactions
5. **Follow naming conventions** - `should [action] [expected outcome]`

Example:
```typescript
import { test, expect } from './fixtures';
import { HomePage } from './pages';

test.describe('Feature Name', () => {
  test('should do something', async ({ page, clearLocalStorage }) => {
    await clearLocalStorage();

    const homePage = new HomePage(page);
    await homePage.goto();

    // Act & Assert
    expect(await homePage.getTotalNewsCount()).toBeGreaterThanOrEqual(0);
  });
});
```

## Troubleshooting

### Tests timeout
- Increase timeout: `test.setTimeout(30000)`
- Check if element exists before waiting
- Verify network requests complete

### Element not found
- Check if element is on page (might be hidden)
- Use `isVisible()` with proper error handling
- Verify selector matches current DOM

### Flaky tests
- Use proper waits instead of `waitForTimeout`
- Wait for network idle: `await page.waitForLoadState('networkidle')`
- Ensure test isolation (clear storage, fresh navigation)

### API failures in tests
- Check if API keys are configured
- Mock API responses in tests
- Verify API endpoint URLs
- Check network connectivity

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Debugging](https://playwright.dev/docs/debug)
