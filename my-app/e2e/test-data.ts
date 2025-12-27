/**
 * Test data and utilities for E2E tests
 */

export const TEST_NEWS_ITEMS = [
  {
    id: '1',
    title: 'OpenAI Releases GPT-4 Turbo with Extended Context',
    content:
      'OpenAI has released GPT-4 Turbo, featuring a 128K context window and improved performance. The new model is available to API users and shows significant improvements in reasoning and code generation tasks.',
    url: 'https://example.com/news/1',
    summary: {
      bullets: [
        'GPT-4 Turbo released with 128K context window',
        'Improved performance in reasoning tasks',
        'Available to all API users',
      ],
      category: 'announcement' as const,
    },
  },
  {
    id: '2',
    title: 'DeepSeek Achieves New Benchmarks in Language Understanding',
    content:
      'DeepSeek announced new achievements in language understanding benchmarks, demonstrating competitive performance with leading models while maintaining cost efficiency. The research paper details their optimization techniques.',
    url: 'https://example.com/news/2',
    summary: {
      bullets: [
        'DeepSeek reaches new benchmark records',
        'Competitive performance vs leading models',
        'Cost-efficient implementation',
      ],
      category: 'research' as const,
    },
  },
  {
    id: '3',
    title: 'Anthropic Releases Claude 3 Family of Models',
    content:
      'Anthropic unveiled the Claude 3 family with three variants: Opus, Sonnet, and Haiku. These models show improvements in reasoning, coding, and creative tasks, with better safety features.',
    url: 'https://example.com/news/3',
    summary: {
      bullets: [
        'Claude 3 family released with 3 variants',
        'Improved reasoning and coding capabilities',
        'Enhanced safety features',
      ],
      category: 'product' as const,
    },
  },
];

export const TEST_PLATFORMS = ['twitter', 'threads', 'instagram', 'linkedin'] as const;

export const PLATFORM_LIMITS = {
  twitter: 280,
  threads: 500,
  instagram: 2200,
  linkedin: 3000,
};

export const VALID_CATEGORIES = ['product', 'update', 'research', 'announcement', 'other'] as const;

export const MOCK_GENERATED_CONTENT = {
  twitter: {
    content:
      'Exciting news! OpenAI just released GPT-4 Turbo with 128K context window. Perfect for long documents and complex tasks. #AI #OpenAI',
    charCount: 110,
    hashtags: ['#AI', '#OpenAI'],
  },
  threads: {
    content:
      "OpenAI's new GPT-4 Turbo model is a game changer. With 128K context window, you can now work with documents that are as long as entire books. The improvements in reasoning are impressive too! #AINews",
    charCount: 200,
  },
  instagram: {
    content: `
🚀 OpenAI Releases GPT-4 Turbo!

Just announced: GPT-4 Turbo features a massive 128K context window - perfect for analyzing long documents and complex projects.

What's new:
✨ 128K context window (4x previous)
🧠 Enhanced reasoning abilities
⚡ Better code generation
💰 More cost-effective

Ready to level up your AI experience? Check the link in bio!

#AI #OpenAI #GPT4 #ArtificialIntelligence #MachineLearning #TechNews #Innovation #FutureOfAI
    `,
    charCount: 350,
    hashtags: [
      '#AI',
      '#OpenAI',
      '#GPT4',
      '#ArtificialIntelligence',
      '#MachineLearning',
      '#TechNews',
    ],
  },
  linkedin: {
    content: `
Transformative Update: OpenAI Launches GPT-4 Turbo with 128K Context Window

I'm excited to share that OpenAI has released GPT-4 Turbo, a significant advancement in AI capabilities that will impact professionals across industries.

Key Highlights:
• 128K Context Window: Process documents and code that are substantially longer than before
• Enhanced Reasoning: Improved performance on complex reasoning tasks
• Better Code Generation: More accurate and efficient code suggestions
• Cost Efficiency: Better value for organizations leveraging AI

What This Means for Professionals:
This update opens new possibilities for knowledge workers, developers, and analysts. You can now leverage AI for more complex, nuanced tasks that require understanding longer contexts.

The future of AI-assisted work is here. Are you ready to leverage these capabilities in your organization?

#AI #OpenAI #ArtificialIntelligence #ProductUpdate #Innovation #FutureOfWork
    `,
    charCount: 600,
    hashtags: ['#AI', '#OpenAI', '#ArtificialIntelligence', '#ProductUpdate', '#Innovation'],
  },
};

export const MOCK_STYLE_TEMPLATES = [
  {
    id: 'style-1',
    platform: 'twitter',
    name: 'Casual Tech',
    tone: 'Casual and conversational, with enthusiasm for tech',
    characteristics: ['Uses exclamation marks', 'Casual language', 'Emoji usage'],
    examples: [
      'Just discovered this amazing AI tool! Game changer 🚀',
      'OMG this update is 🔥 Everything you need is here!',
      "Can't believe how much this improved things!",
    ],
  },
  {
    id: 'style-2',
    platform: 'linkedin',
    name: 'Professional Insights',
    tone: 'Professional yet approachable, focused on business value',
    characteristics: ['Formal language', 'Business-focused insights', 'Action-oriented'],
    examples: [
      'Organizations leveraging this technology are seeing significant improvements in efficiency.',
      'This development has major implications for the industry moving forward.',
      'The impact on productivity cannot be overstated.',
    ],
  },
];

/**
 * Utility function to generate random news ID
 */
export function generateNewsId(): string {
  return `news-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Utility to create test news item
 */
export function createTestNewsItem(overrides = {}) {
  return {
    id: generateNewsId(),
    title: 'Test News Item',
    content: 'This is test content for the AI News Dashboard',
    url: 'https://example.com/news',
    sourceId: 'test-source',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isProcessed: false,
    ...overrides,
  };
}

/**
 * Utility to validate generated content structure
 */
export function validateGeneratedContent(content: any, platform: string): boolean {
  // Check required fields
  if (!content || typeof content !== 'object') {
    return false;
  }

  if (!('content' in content) || typeof content.content !== 'string') {
    return false;
  }

  // Platform-specific validation
  if (platform === 'instagram' && !('hashtags' in content)) {
    return false;
  }

  // Check character count doesn't exceed platform limit
  const limit = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS];
  if (limit && content.charCount && content.charCount > limit) {
    return false;
  }

  return true;
}

/**
 * Utility to validate summary structure
 */
export function validateSummary(summary: any): boolean {
  if (!summary || typeof summary !== 'object') {
    return false;
  }

  if (!Array.isArray(summary.bullets) || summary.bullets.length === 0) {
    return false;
  }

  if (!VALID_CATEGORIES.includes(summary.category)) {
    return false;
  }

  // Each bullet should be a non-empty string
  return summary.bullets.every((bullet: any) => typeof bullet === 'string' && bullet.length > 0);
}

/**
 * Delay utility for tests
 */
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Test URLs for scraping/RSS tests
 */
export const TEST_URLS = {
  rss: [
    'https://feeds.arstechnica.com/arstechnica/index', // ArsTechnica tech news
    'https://www.theverge.com/rss/index.xml', // The Verge
    'https://feeds.hackernews.com/newest.xml', // Hacker News
  ],
  scrape: [
    'https://example.com', // Simple test page
    'https://www.wikipedia.org', // Large page
  ],
};

/**
 * Common test selectors
 */
export const SELECTORS = {
  // Stats cards
  totalNewsCard: 'text=/Total News/',
  summarizedCard: 'text=/Summarized/',
  pendingCard: 'text=/Pending/',
  sourcesCard: 'text=/Active Sources/',

  // Tabs
  newsFeedTab: 'button:has-text("News Feed")',
  collectNewsTab: 'button:has-text("Collect News")',

  // News items
  newsCard: '[class*="group"]',
  newsTitle: 'h3[class*="text-base"]',
  viewButton: 'button:has-text("View Details")',
  deleteButton: 'button[aria-label="Delete news"]',
  externalButton: 'button[aria-label="Open original article"]',

  // Modal
  modal: '[role="dialog"]',
  closeButton: 'button:has-text("Close")',

  // Tabs
  summaryTab: 'button:has-text("Summary")',
  fullArticleTab: 'button:has-text("Full Article")',
  generateTab: 'button:has-text("Generate Content")',

  // Platforms
  twitterButton: 'button:has-text("X (Twitter)")',
  threadsButton: 'button:has-text("Threads")',
  instagramButton: 'button:has-text("Instagram")',
  linkedinButton: 'button:has-text("LinkedIn")',

  // Generate
  generateButton: 'button:has-text(/Generate for/i)',
  styleDropdown: 'button:has-text("Default Style")',

  // Loading
  spinner: '.animate-spin',
};
