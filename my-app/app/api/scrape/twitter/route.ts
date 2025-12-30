import { NextRequest, NextResponse } from 'next/server';
import { scrapeTwitter, TwitterScrapeResult } from '@/lib/browserless';

/**
 * POST /api/scrape/twitter
 *
 * Twitter/X 트윗 스크래핑 API
 * 공개 트윗의 내용, 미디어, 참여 지표를 추출합니다.
 *
 * Request Body:
 *   { url: "https://x.com/user/status/123" }
 *
 * Response:
 *   {
 *     author: "@username",
 *     authorName: "Display Name",
 *     content: "트윗 내용",
 *     mediaUrls: ["이미지URL1", "영상URL"],
 *     timestamp: "2025-12-31T...",
 *     likes: 123,
 *     retweets: 45
 *   }
 */
export async function POST(request: NextRequest): Promise<NextResponse<TwitterScrapeResult | { error: string }>> {
  try {
    const body = await request.json();
    const { url } = body;

    // URL 필수 검증
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // URL 형식 검증
    if (typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL must be a string' },
        { status: 400 }
      );
    }

    // Twitter/X URL 패턴 검증
    const urlPattern = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/;
    if (!urlPattern.test(url)) {
      return NextResponse.json(
        { error: 'Invalid Twitter/X URL format. Expected: https://x.com/user/status/123...' },
        { status: 400 }
      );
    }

    // BROWSERLESS_TOKEN 환경변수 확인
    if (!process.env.BROWSERLESS_TOKEN) {
      console.error('BROWSERLESS_TOKEN is not configured');
      return NextResponse.json(
        { error: 'Scraping service is not configured' },
        { status: 503 }
      );
    }

    // 트윗 스크래핑 실행
    const result = await scrapeTwitter(url);

    // 결과 검증 (최소한 author 또는 content가 있어야 함)
    if (!result.author && !result.content) {
      return NextResponse.json(
        { error: 'Failed to extract tweet data. The tweet might be private or deleted.' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Twitter scraping error:', error);

    // 에러 유형에 따른 응답
    if (error instanceof Error) {
      // 타임아웃 에러
      if (error.message.includes('Timeout') || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Request timeout - Twitter page took too long to load' },
          { status: 408 }
        );
      }

      // Browserless 연결 에러
      if (error.message.includes('BROWSERLESS_TOKEN') || error.message.includes('connect')) {
        return NextResponse.json(
          { error: 'Failed to connect to scraping service' },
          { status: 503 }
        );
      }

      // URL 형식 에러
      if (error.message.includes('Invalid Twitter/X URL')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    // 일반 에러
    return NextResponse.json(
      { error: 'Failed to scrape Twitter post' },
      { status: 500 }
    );
  }
}
