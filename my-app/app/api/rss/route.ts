import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'AI-News-Dashboard/1.0',
  },
});

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const feed = await parser.parseURL(url);

    return NextResponse.json({
      title: feed.title,
      description: feed.description,
      items: feed.items.slice(0, 20).map((item) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        content: item.content,
        contentSnippet: item.contentSnippet,
      })),
    });
  } catch (error) {
    console.error('RSS parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse RSS feed' },
      { status: 500 }
    );
  }
}
