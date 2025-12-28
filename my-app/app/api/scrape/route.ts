import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Modern browser User-Agent rotation pool
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8초 타임아웃

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const userAgent = getRandomUserAgent();

    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unnecessary elements
    $('script, style, nav, header, footer, aside, .sidebar, .menu, .navigation, .ads, .advertisement, .social-share, .comments').remove();

    // Get title
    const title = $('title').text().trim() ||
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      'Untitled';

    // Try to find article content with better selectors
    let content = '';
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.article-body',
      '.entry-content',
      '.post-body',
      '.content-body',
      'main article',
      'main',
      '.content',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length && element.text().trim().length > 200) {
        // Get HTML and convert to cleaner text with paragraph breaks
        const paragraphs: string[] = [];
        element.find('p, h1, h2, h3, h4, h5, h6, li').each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > 0) {
            paragraphs.push(text);
          }
        });
        content = paragraphs.join('\n\n');
        break;
      }
    }

    // Fallback: extract paragraphs from body
    if (!content || content.length < 200) {
      const paragraphs: string[] = [];
      $('body p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 30) {
          paragraphs.push(text);
        }
      });
      content = paragraphs.join('\n\n');
    }

    // Final fallback
    if (!content) {
      content = $('body').text().trim().replace(/\s+/g, ' ').substring(0, 5000);
    }

    // Limit content length
    content = content.substring(0, 8000);

    return NextResponse.json({
      title,
      content,
      url,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - site took too long to respond' },
        { status: 408 }
      );
    }

    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape URL' },
      { status: 500 }
    );
  }
}
