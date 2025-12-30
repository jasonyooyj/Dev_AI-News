import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

type SourceType = 'youtube' | 'twitter' | 'threads';

interface ScrapeResult {
  success: boolean;
  title?: string;
  content?: string;
  author?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  error?: string;
}

// User-Agent for scraping
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// YouTube URL 패턴 분석
function parseYouTubeUrl(url: string): { type: 'video' | 'channel' | 'shorts'; id: string } | null {
  const patterns = [
    // 일반 비디오 URL
    { regex: /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/, type: 'video' as const },
    // Shorts
    { regex: /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/, type: 'shorts' as const },
    // 채널 URL
    { regex: /youtube\.com\/@([^\/\?]+)/, type: 'channel' as const },
    { regex: /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/, type: 'channel' as const },
  ];

  for (const { regex, type } of patterns) {
    const match = url.match(regex);
    if (match) {
      return { type, id: match[1] };
    }
  }
  return null;
}

// X/Twitter URL 패턴 분석
function parseTwitterUrl(url: string): { type: 'post' | 'profile'; username: string; postId?: string } | null {
  // 포스트 URL
  const postMatch = url.match(/(?:twitter\.com|x\.com)\/([^\/]+)\/status\/(\d+)/);
  if (postMatch) {
    return { type: 'post', username: postMatch[1], postId: postMatch[2] };
  }

  // 프로필 URL
  const profileMatch = url.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/);
  if (profileMatch && !['home', 'explore', 'notifications', 'messages', 'search', 'settings', 'i'].includes(profileMatch[1])) {
    return { type: 'profile', username: profileMatch[1] };
  }

  return null;
}

// Threads URL 패턴 분석
function parseThreadsUrl(url: string): { type: 'post' | 'profile'; username: string; postId?: string } | null {
  // 포스트 URL
  const postMatch = url.match(/threads\.net\/@([^\/]+)\/post\/([a-zA-Z0-9_-]+)/);
  if (postMatch) {
    return { type: 'post', username: postMatch[1], postId: postMatch[2] };
  }

  // 프로필 URL
  const profileMatch = url.match(/threads\.net\/@([^\/\?]+)/);
  if (profileMatch) {
    return { type: 'profile', username: profileMatch[1] };
  }

  return null;
}

// YouTube 콘텐츠 스크래핑
async function scrapeYouTube(url: string): Promise<ScrapeResult> {
  const parsed = parseYouTubeUrl(url);
  if (!parsed) {
    return { success: false, error: 'Invalid YouTube URL format' };
  }

  try {
    // oEmbed API 사용 (비디오/Shorts)
    if (parsed.type === 'video' || parsed.type === 'shorts') {
      const videoUrl = parsed.type === 'shorts'
        ? `https://www.youtube.com/shorts/${parsed.id}`
        : `https://www.youtube.com/watch?v=${parsed.id}`;

      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;

      const response = await fetch(oembedUrl, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (!response.ok) {
        throw new Error(`YouTube oEmbed API error: ${response.status}`);
      }

      const data = await response.json();

      // 비디오 페이지에서 설명 가져오기
      let description = '';
      try {
        const pageResponse = await fetch(videoUrl, {
          headers: { 'User-Agent': USER_AGENT },
        });
        const html = await pageResponse.text();

        // meta description 추출
        const descMatch = html.match(/<meta name="description" content="([^"]*)">/);
        if (descMatch) {
          description = descMatch[1];
        }
      } catch (e) {
        console.log('[YouTube] Could not fetch description:', e);
      }

      return {
        success: true,
        title: data.title,
        content: description || `YouTube ${parsed.type === 'shorts' ? 'Shorts' : 'Video'} by ${data.author_name}`,
        author: data.author_name,
        thumbnailUrl: data.thumbnail_url,
      };
    }

    // 채널 페이지 스크래핑
    if (parsed.type === 'channel') {
      const channelUrl = url.includes('@')
        ? `https://www.youtube.com/@${parsed.id}`
        : `https://www.youtube.com/channel/${parsed.id}`;

      const response = await fetch(channelUrl, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch channel: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // 채널명 추출
      const channelName = $('meta[property="og:title"]').attr('content') || parsed.id;
      const description = $('meta[name="description"]').attr('content') || '';

      return {
        success: true,
        title: `YouTube Channel: ${channelName}`,
        content: description,
        author: channelName,
      };
    }

    return { success: false, error: 'Unsupported YouTube URL type' };
  } catch (error) {
    console.error('[YouTube] Scrape error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape YouTube'
    };
  }
}

// X/Twitter 콘텐츠 스크래핑
async function scrapeTwitter(url: string): Promise<ScrapeResult> {
  const parsed = parseTwitterUrl(url);
  if (!parsed) {
    return { success: false, error: 'Invalid X/Twitter URL format' };
  }

  try {
    // 포스트 스크래핑
    if (parsed.type === 'post' && parsed.postId) {
      // syndication API 사용
      const syndicationUrl = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${parsed.username}`;

      // 먼저 페이지에서 메타데이터 추출 시도
      const pageUrl = `https://x.com/${parsed.username}/status/${parsed.postId}`;
      const response = await fetch(pageUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch post: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // OpenGraph 메타데이터 추출
      const title = $('meta[property="og:title"]').attr('content') || '';
      const description = $('meta[property="og:description"]').attr('content') || '';
      const image = $('meta[property="og:image"]').attr('content');

      // 트윗 내용 추출 시도
      let tweetContent = description;

      // data-testid 기반 추출 (로그인 없이 접근 가능한 경우)
      const tweetText = $('[data-testid="tweetText"]').first().text();
      if (tweetText) {
        tweetContent = tweetText;
      }

      return {
        success: true,
        title: title || `Post by @${parsed.username}`,
        content: tweetContent || description,
        author: `@${parsed.username}`,
        thumbnailUrl: image,
      };
    }

    // 프로필 스크래핑
    if (parsed.type === 'profile') {
      const profileUrl = `https://x.com/${parsed.username}`;
      const response = await fetch(profileUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const title = $('meta[property="og:title"]').attr('content') || parsed.username;
      const description = $('meta[property="og:description"]').attr('content') || '';
      const image = $('meta[property="og:image"]').attr('content');

      return {
        success: true,
        title: `X Profile: ${title}`,
        content: description,
        author: `@${parsed.username}`,
        thumbnailUrl: image,
      };
    }

    return { success: false, error: 'Unsupported X/Twitter URL type' };
  } catch (error) {
    console.error('[Twitter] Scrape error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape X/Twitter'
    };
  }
}

// Threads 콘텐츠 스크래핑
async function scrapeThreads(url: string): Promise<ScrapeResult> {
  const parsed = parseThreadsUrl(url);
  if (!parsed) {
    return { success: false, error: 'Invalid Threads URL format' };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // OpenGraph 메타데이터 추출
    const title = $('meta[property="og:title"]').attr('content') || '';
    const description = $('meta[property="og:description"]').attr('content') || '';
    const image = $('meta[property="og:image"]').attr('content');

    if (parsed.type === 'post') {
      return {
        success: true,
        title: title || `Threads post by @${parsed.username}`,
        content: description,
        author: `@${parsed.username}`,
        thumbnailUrl: image,
      };
    }

    // 프로필
    return {
      success: true,
      title: `Threads Profile: ${title || parsed.username}`,
      content: description,
      author: `@${parsed.username}`,
      thumbnailUrl: image,
    };
  } catch (error) {
    console.error('[Threads] Scrape error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape Threads'
    };
  }
}

// 소스 타입 자동 감지
function detectSourceType(url: string): SourceType | null {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/twitter\.com|x\.com/i.test(url)) return 'twitter';
  if (/threads\.net/i.test(url)) return 'threads';
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { url, type: requestedType } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 소스 타입 결정 (명시적 타입 또는 자동 감지)
    const sourceType = requestedType || detectSourceType(url);

    if (!sourceType) {
      return NextResponse.json(
        { error: 'Could not determine source type. Please provide a valid YouTube, X, or Threads URL.' },
        { status: 400 }
      );
    }

    console.log(`[Scrape-Social] Scraping ${sourceType}: ${url}`);

    let result: ScrapeResult;

    switch (sourceType) {
      case 'youtube':
        result = await scrapeYouTube(url);
        break;
      case 'twitter':
        result = await scrapeTwitter(url);
        break;
      case 'threads':
        result = await scrapeThreads(url);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported source type: ${sourceType}` },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to scrape content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sourceType,
      title: result.title,
      content: result.content,
      author: result.author,
      publishedAt: result.publishedAt,
      thumbnailUrl: result.thumbnailUrl,
      url,
    });
  } catch (error) {
    console.error('[Scrape-Social] Error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape social content' },
      { status: 500 }
    );
  }
}
