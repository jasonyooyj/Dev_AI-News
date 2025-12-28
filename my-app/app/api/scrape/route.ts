import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Modern browser User-Agent rotation pool (updated for 2025)
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getRealisticHeaders(userAgent: string): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
  };

  if (userAgent.includes('Chrome')) {
    headers['Sec-Ch-Ua'] = '"Chromium";v="131", "Not_A Brand";v="24"';
    headers['Sec-Ch-Ua-Mobile'] = '?0';
    headers['Sec-Ch-Ua-Platform'] = userAgent.includes('Windows') ? '"Windows"' : '"macOS"';
    headers['Sec-Fetch-Dest'] = 'document';
    headers['Sec-Fetch-Mode'] = 'navigate';
    headers['Sec-Fetch-Site'] = 'none';
    headers['Sec-Fetch-User'] = '?1';
  }

  return headers;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const userAgent = getRandomUserAgent();
    const headers = getRealisticHeaders(userAgent);

    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, and unnecessary elements
    $('script, style, nav, header, footer, aside, .sidebar, .menu, .navigation').remove();

    // Try to find the main content
    const title = $('title').text().trim() ||
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      'Untitled';

    // Try to find article content
    let content = '';
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      'main',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length) {
        content = element.text().trim();
        break;
      }
    }

    // Fallback to body if no content found
    if (!content) {
      content = $('body').text().trim();
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .substring(0, 10000);

    const description = $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      content.substring(0, 200);

    return NextResponse.json({
      title,
      content,
      description,
      url,
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape URL' },
      { status: 500 }
    );
  }
}
