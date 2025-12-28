import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';

// Custom parser to capture more fields
type CustomItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  content?: string;
  contentSnippet?: string;
  description?: string;
  summary?: string;
  'content:encoded'?: string;
};

const parser = new Parser<Record<string, unknown>, CustomItem>({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; AI-News-Dashboard/1.0)',
  },
  customFields: {
    item: [
      ['description', 'description'],
      ['summary', 'summary'],
      ['content:encoded', 'content:encoded'],
    ],
  },
});

// Clean HTML tags from text
function stripHtml(html: string): string {
  return html
    .replace(/<img[^>]*>/gi, '') // Remove img tags
    .replace(/<[^>]+>/g, ' ')    // Remove other tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`[RSS] Fetching: ${url}`);
    const feed = await parser.parseURL(url);
    console.log(`[RSS] Got ${feed.items.length} items`);

    return NextResponse.json({
      title: feed.title,
      description: feed.description,
      items: feed.items.slice(0, 20).map((item) => {
        // Try multiple content sources
        const rawContent =
          item['content:encoded'] ||
          item.content ||
          item.description ||
          item.summary ||
          item.contentSnippet ||
          '';

        // Clean HTML
        const content = stripHtml(rawContent);

        console.log(`[RSS] Item "${item.title?.substring(0, 40)}..." content length: ${content.length}`);

        return {
          title: item.title || '',
          link: item.link || '',
          pubDate: item.pubDate,
          isoDate: item.isoDate || (item.pubDate ? new Date(item.pubDate).toISOString() : null),
          content,
          contentSnippet: item.contentSnippet,
        };
      }),
    });
  } catch (error) {
    console.error('RSS parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse RSS feed' },
      { status: 500 }
    );
  }
}
