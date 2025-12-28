import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface ScrapeConfig {
  articleSelector: string;
  titleSelector: string;
  linkSelector: string;
  descriptionSelector?: string;
  dateSelector?: string;
}

interface ScrapedArticle {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
}

// Modern browser User-Agent rotation pool (updated for 2025)
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
];

// Get random User-Agent
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Get realistic headers matching the User-Agent
function getRealisticHeaders(userAgent: string): Record<string, string> {
  const isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edg');
  const isFirefox = userAgent.includes('Firefox');
  const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
  const isEdge = userAgent.includes('Edg');

  const baseHeaders: Record<string, string> = {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
  };

  // Add browser-specific headers
  if (isChrome || isEdge) {
    baseHeaders['Sec-Ch-Ua'] = '"Chromium";v="131", "Not_A Brand";v="24"';
    baseHeaders['Sec-Ch-Ua-Mobile'] = '?0';
    baseHeaders['Sec-Ch-Ua-Platform'] = userAgent.includes('Windows') ? '"Windows"' : '"macOS"';
    baseHeaders['Sec-Fetch-Dest'] = 'document';
    baseHeaders['Sec-Fetch-Mode'] = 'navigate';
    baseHeaders['Sec-Fetch-Site'] = 'none';
    baseHeaders['Sec-Fetch-User'] = '?1';
  }

  if (isFirefox) {
    baseHeaders['Sec-Fetch-Dest'] = 'document';
    baseHeaders['Sec-Fetch-Mode'] = 'navigate';
    baseHeaders['Sec-Fetch-Site'] = 'none';
    baseHeaders['Sec-Fetch-User'] = '?1';
  }

  return baseHeaders;
}

// Random delay to mimic human behavior (500ms - 2000ms)
async function randomDelay(): Promise<void> {
  const delay = Math.floor(Math.random() * 1500) + 500;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Default scrape configs for known sites
const DEFAULT_CONFIGS: Record<string, ScrapeConfig> = {
  'anthropic.com': {
    articleSelector: 'article, .post-card, [class*="NewsCard"], [class*="post"], a[href*="/news/"]',
    titleSelector: 'h2, h3, .title, [class*="title"]',
    linkSelector: 'a[href]',
    descriptionSelector: 'p, .description, .excerpt, [class*="description"]',
    dateSelector: 'time, .date, [class*="date"]',
  },
  'ai.meta.com': {
    articleSelector: '.blog-post, article, [class*="Card"], [class*="post"]',
    titleSelector: 'h2, h3, .title, [class*="title"]',
    linkSelector: 'a[href]',
    descriptionSelector: 'p, .excerpt',
    dateSelector: 'time, .date',
  },
};

function getConfigForUrl(url: string, customConfig?: ScrapeConfig): ScrapeConfig {
  if (customConfig) return customConfig;

  // Try to match known sites
  for (const [domain, config] of Object.entries(DEFAULT_CONFIGS)) {
    if (url.includes(domain)) {
      return config;
    }
  }

  // Generic fallback config
  return {
    articleSelector: 'article, .post, .card, [class*="article"], [class*="post"], [class*="card"], li > a',
    titleSelector: 'h1, h2, h3, .title, [class*="title"], [class*="heading"]',
    linkSelector: 'a[href]',
    descriptionSelector: 'p, .description, .excerpt, .summary',
    dateSelector: 'time, .date, [datetime]',
  };
}

function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, scrapeConfig } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`[Scrape-Source] Fetching: ${url}`);

    // Add small random delay before request
    await randomDelay();

    const userAgent = getRandomUserAgent();
    const headers = getRealisticHeaders(userAgent);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Scrape-Source] HTTP error: ${response.status}`);
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    console.log(`[Scrape-Source] Got HTML: ${html.length} chars`);

    const $ = cheerio.load(html);
    const config = getConfigForUrl(url, scrapeConfig);
    console.log(`[Scrape-Source] Using config:`, JSON.stringify(config));

    const articles: ScrapedArticle[] = [];
    const seenLinks = new Set<string>();

    // First, try to find article containers
    $(config.articleSelector).each((_, element) => {
      const $el = $(element);

      // Find link
      let link = '';
      const $link = $el.is('a') ? $el : $el.find(config.linkSelector).first();
      if ($link.length) {
        link = $link.attr('href') || '';
        link = resolveUrl(url, link);
      }

      // Skip if no link or already seen
      if (!link || seenLinks.has(link)) return;

      // Skip non-article links
      if (link.includes('#') || link.endsWith('.pdf') || link.includes('mailto:')) return;

      seenLinks.add(link);

      // Find title
      let title = '';
      const $title = $el.find(config.titleSelector).first();
      if ($title.length) {
        title = $title.text().trim();
      } else if ($el.is('a')) {
        title = $el.text().trim();
      }

      // Skip if no title or title is too short
      if (!title || title.length < 5) return;

      // Find description
      let description = '';
      if (config.descriptionSelector) {
        const $desc = $el.find(config.descriptionSelector).first();
        if ($desc.length) {
          description = $desc.text().trim().substring(0, 300);
        }
      }

      // Find date
      let pubDate = '';
      if (config.dateSelector) {
        const $date = $el.find(config.dateSelector).first();
        if ($date.length) {
          pubDate = $date.attr('datetime') || $date.text().trim();
        }
      }

      articles.push({
        title,
        link,
        description: description || undefined,
        pubDate: pubDate || undefined,
      });
    });

    // If no articles found with container approach, try finding all links with titles
    if (articles.length === 0) {
      $('a[href]').each((_, element) => {
        const $el = $(element);
        const href = $el.attr('href') || '';
        const link = resolveUrl(url, href);

        // Filter for likely article links
        if (
          !href ||
          href.startsWith('#') ||
          href.includes('mailto:') ||
          seenLinks.has(link) ||
          !/(blog|news|post|article|announcement)/i.test(link)
        ) {
          return;
        }

        seenLinks.add(link);

        const title = $el.text().trim();
        if (title && title.length >= 10 && title.length <= 200) {
          articles.push({
            title,
            link,
          });
        }
      });
    }

    console.log(`[Scrape-Source] Found ${articles.length} articles`);
    if (articles.length > 0) {
      console.log(`[Scrape-Source] First article: ${articles[0].title}`);
    }

    return NextResponse.json({
      articles: articles.slice(0, 20), // Limit to 20 articles
      count: articles.length,
      url,
    });
  } catch (error) {
    console.error('[Scrape-Source] Error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - site took too long to respond' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to scrape source' },
      { status: 500 }
    );
  }
}
