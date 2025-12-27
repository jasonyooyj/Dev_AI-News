# Quick Start - E2E Testing

## Installation (2 minutes)

```bash
cd C:\Users\basqu\Documents\GitHub\Dev_AI-News\my-app

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Run Tests (5 minutes)

### Option 1: Interactive UI (Recommended First Time)
```bash
npm run test:e2e:ui
```
- Visual test runner
- Click to run specific tests
- See results in real-time
- Debug easily

### Option 2: All Tests Headless
```bash
npm run test:e2e
```
- Runs all 100+ tests in background
- Fast execution
- Generates HTML report

### Option 3: See Browser
```bash
npm run test:e2e:headed
```
- Watch browser automation
- Useful for debugging
- Slower but educational

## View Results

```bash
# Open HTML report
npx playwright show-report
```

## Test Coverage

```
HOME PAGE TESTS (16)
├── Stats cards display
├── Tab navigation
├── News card listing
├── Summary display
├── Responsive design
└── Empty state handling

NEWS DETAIL MODAL (25)
├── Modal interaction
├── Tab navigation
├── Content generation
├── Style templates
├── Feedback/regenerate
└── Accessibility

API TESTS (18)
├── Provider status
├── Content generation
├── RSS fetching
├── Web scraping
└── Error handling

AI PROVIDER TESTS (20)
├── OpenAI selection
├── DeepSeek selection
├── Provider fallback
├── Preference storage
└── Concurrent requests

USER WORKFLOWS (21)
├── News discovery
├── Content generation
├── News management
├── Data persistence
└── Performance

TOTAL: 100+ TESTS
```

## Key Commands

```bash
# Run all tests
npm run test:e2e

# Interactive mode (best for learning)
npm run test:e2e:ui

# Debug with inspector
npm run test:e2e:debug

# See browser while running
npm run test:e2e:headed

# Run specific browser
npm run test:e2e:chrome
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run specific test
npx playwright test -g "should display stats"

# View test report
npx playwright show-report
```

## File Structure

```
C:\Users\basqu\Documents\GitHub\Dev_AI-News\my-app\
├── playwright.config.ts          # Configuration
├── package.json                  # Scripts & dependencies
├── e2e/
│   ├── README.md                 # Full documentation
│   ├── fixtures.ts               # Test utilities
│   ├── test-data.ts              # Sample data
│   ├── home.spec.ts              # Home page tests
│   ├── news-detail.spec.ts       # Modal tests
│   ├── api.spec.ts               # API tests
│   ├── ai-provider.spec.ts       # Provider tests
│   ├── user-workflows.spec.ts    # Workflow tests
│   └── pages/
│       ├── base.ts               # Base utilities
│       ├── home.ts               # Home page object
│       ├── news-detail.ts        # Modal page object
│       └── index.ts              # Exports
├── E2E_TESTING_GUIDE.md          # Comprehensive guide
├── TESTING_SUMMARY.md            # Implementation summary
├── IMPLEMENTATION_CHECKLIST.md   # Completion checklist
└── QUICK_START.md               # This file
```

## What Gets Tested

### Home Page
- Stats cards (Total, Summarized, Pending, Sources)
- Tab switching (News Feed / Collect News)
- News cards display with source, title, date
- View Details, Delete, Open Original actions
- Responsive design (mobile/tablet/desktop)

### News Detail Modal
- Open and close modal
- Navigate between tabs (Summary, Article, Generate)
- Display summary bullets and category
- Generate content for 4 platforms
- Apply style templates
- Submit feedback
- Regenerate content

### Content Generation
- Select platform (Twitter, Threads, Instagram, LinkedIn)
- Choose style template
- Generate platform-specific content
- Verify character limits
- Regenerate with feedback

### AI Provider Selection
- Detect available providers (OpenAI, DeepSeek)
- Generate content with each provider
- Provider preference storage
- Fallback behavior
- Error handling

### API Endpoints
- GET /api/openai (provider status)
- POST /api/openai (all modes: summarize, generate, analyze, regenerate)
- POST /api/rss (RSS feed fetching)
- POST /api/scrape (web scraping)

## Example Test

```typescript
test('should generate Twitter content', async ({ page }) => {
  // Navigate to home
  const homePage = new HomePage(page);
  await homePage.goto();

  // View first news
  if (await homePage.getNewsCardCount() > 0) {
    await homePage.viewFirstNews();

    // Generate content
    const newsDetail = new NewsDetailPage(page);
    await newsDetail.goToGenerateContentTab();
    await newsDetail.selectPlatform('twitter');
    await newsDetail.generateContent();

    // Verify
    expect(await newsDetail.isGeneratedContentVisible()).toBe(true);
  }
});
```

## Expected Output

```
Running 100 tests using 1 worker

✓ Home Page > Page Layout > should display stats cards (0.5s)
✓ Home Page > News List > should display news cards (0.3s)
✓ News Detail > Modal Display > should open modal (0.2s)
✓ API Routes > should return provider status (0.1s)
✓ AI Provider > should detect available providers (0.1s)
✓ User Workflows > should discover news items (1.2s)

... (94 more tests)

100 passed (2m 15s)
```

## Debugging Failures

### Step 1: Run with UI
```bash
npm run test:e2e:ui
```
Shows visual test runner, easy to debug.

### Step 2: Run Single Test
```bash
npx playwright test -g "test name" --headed
```
See browser while test runs.

### Step 3: Debug Mode
```bash
npm run test:e2e:debug
```
Step through code with inspector.

### Step 4: Check Reports
```bash
npx playwright show-report
```
View screenshots and videos of failures.

## Common Issues

### Installation Issues
```bash
# Clear and reinstall
rm -rf node_modules
npm install
npx playwright install
```

### Browser Not Found
```bash
# Reinstall browsers
npx playwright install
```

### Port Already In Use
The dev server will auto-start. If port 3000 is busy:
```bash
# Kill existing process
npx kill-port 3000
```

### Tests Timeout
```bash
# Increase timeout
npx playwright test --timeout 60000
```

## Next Steps

1. **Run the tests:**
   ```bash
   npm run test:e2e:ui
   ```

2. **Review the guide:**
   - Read `E2E_TESTING_GUIDE.md` for details
   - Check `e2e/README.md` for reference

3. **Explore tests:**
   - Open `e2e/home.spec.ts` to see test examples
   - Review `e2e/pages/home.ts` for page objects

4. **Add to CI/CD:**
   - Configure GitHub Actions to run tests
   - Use reports in your workflow

5. **Extend tests:**
   - Add tests for new features
   - Follow the same patterns
   - Use page objects for maintainability

## Documentation

| Document | Purpose |
|----------|---------|
| `E2E_TESTING_GUIDE.md` | Comprehensive implementation guide |
| `TESTING_SUMMARY.md` | Executive summary of what was built |
| `IMPLEMENTATION_CHECKLIST.md` | Detailed completion checklist |
| `e2e/README.md` | Quick reference for test details |
| `QUICK_START.md` | This file - fast getting started |

## Success Criteria

After first run, you should see:
- [x] All browsers launch and close cleanly
- [x] 100+ tests pass or fail with clear messages
- [x] HTML report generated in `playwright-report/`
- [x] Screenshot/video captured for failures
- [x] Console shows clear test names and status

## Support

**Question?** Check these in order:
1. `QUICK_START.md` (this file) - Common questions
2. `e2e/README.md` - Quick reference
3. `E2E_TESTING_GUIDE.md` - Detailed explanation
4. `e2e/*.spec.ts` - Test examples
5. https://playwright.dev - Framework documentation

## Time Estimates

| Task | Time |
|------|------|
| Install dependencies | 2 min |
| Run all tests | 3 min |
| View results | 1 min |
| Read this file | 5 min |
| Explore test code | 10 min |
| **Total** | **~20 min** |

---

**Status**: Ready to Use
**Tests**: 100+
**Framework**: Playwright 1.48.0
**Browsers**: Chrome, Firefox, Safari
**Devices**: Desktop, Mobile

Start with: `npm run test:e2e:ui`
