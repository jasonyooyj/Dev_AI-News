import { NextRequest, NextResponse } from 'next/server';
import { withBrowserPage } from '@/lib/browserless';
import { z } from 'zod';

/**
 * Threads 스크래핑 API
 *
 * POST /api/scrape/threads
 * 공개 Threads 게시물에서 콘텐츠, 미디어, 작성자 정보를 추출
 */

// URL 검증 스키마
const requestSchema = z.object({
  url: z.string().url().refine(
    (url) => url.includes('threads.net'),
    { message: 'URL must be a Threads URL' }
  ),
});

// 응답 타입
interface ThreadsPostData {
  author: string;
  authorName: string;
  content: string;
  mediaUrls: string[];
  timestamp: string | null;
  likes: number | null;
  replies: number | null;
  url: string;
}

// Threads URL 패턴: https://www.threads.net/@username/post/postId
const THREADS_URL_PATTERN = /threads\.net\/@([^/]+)\/post\/([^/?]+)/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // URL 검증
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { url } = validationResult.data;

    // URL 패턴에서 username 추출
    const urlMatch = url.match(THREADS_URL_PATTERN);
    const usernameFromUrl = urlMatch ? `@${urlMatch[1]}` : null;

    // Browserless를 통해 페이지 스크래핑
    const postData = await withBrowserPage<ThreadsPostData>(
      url,
      async (page) => {
        // Threads는 React 기반이므로 콘텐츠 로딩 대기
        // 메인 콘텐츠가 로드될 때까지 대기
        await page.waitForTimeout(3000);

        // 데이터 추출
        const data = await page.evaluate(() => {
          // 헬퍼: 텍스트 추출
          const getText = (selector: string): string => {
            const el = document.querySelector(selector);
            return el?.textContent?.trim() || '';
          };

          // 헬퍼: 숫자 파싱 (좋아요, 댓글 수 등)
          const parseEngagement = (text: string): number | null => {
            if (!text) return null;
            // "1.2K", "2M" 등 처리
            const cleaned = text.toLowerCase().replace(/,/g, '');
            if (cleaned.includes('k')) {
              return Math.round(parseFloat(cleaned) * 1000);
            }
            if (cleaned.includes('m')) {
              return Math.round(parseFloat(cleaned) * 1000000);
            }
            const num = parseInt(cleaned, 10);
            return isNaN(num) ? null : num;
          };

          // 작성자 정보 추출
          // Threads는 동적으로 클래스명이 바뀔 수 있으므로 여러 셀렉터 시도
          let author = '';
          let authorName = '';

          // 방법 1: 링크에서 username 추출
          const profileLinks = document.querySelectorAll('a[href*="/@"]');
          for (const link of profileLinks) {
            const href = link.getAttribute('href') || '';
            const match = href.match(/\/@([^/?]+)/);
            if (match) {
              author = `@${match[1]}`;
              // 링크 내 텍스트가 display name일 수 있음
              const linkText = link.textContent?.trim() || '';
              if (linkText && !linkText.startsWith('@')) {
                authorName = linkText;
              }
              break;
            }
          }

          // 방법 2: meta 태그에서 추출
          if (!author) {
            const ogDesc = document.querySelector('meta[property="og:description"]');
            const content = ogDesc?.getAttribute('content') || '';
            const match = content.match(/@(\w+)/);
            if (match) {
              author = `@${match[1]}`;
            }
          }

          // 콘텐츠 추출
          let postContent = '';

          // 방법 1: article 내 텍스트
          const articles = document.querySelectorAll('article');
          for (const article of articles) {
            // 첫 번째 의미있는 article의 텍스트 콘텐츠
            const spans = article.querySelectorAll('span');
            for (const span of spans) {
              const text = span.textContent?.trim() || '';
              // 의미있는 콘텐츠 찾기 (시간, 좋아요 수 등 제외)
              if (text.length > 20 && !text.match(/^\d+[KMkm]?\s*(likes?|replies?|좋아요|답글)/i)) {
                postContent = text;
                break;
              }
            }
            if (postContent) break;
          }

          // 방법 2: og:description에서 추출
          if (!postContent) {
            const ogDesc = document.querySelector('meta[property="og:description"]');
            const desc = ogDesc?.getAttribute('content') || '';
            // "@username: 실제 내용" 패턴
            const contentMatch = desc.match(/^@\w+:\s*(.+)$/);
            if (contentMatch) {
              postContent = contentMatch[1];
            } else {
              postContent = desc;
            }
          }

          // 방법 3: 페이지 title에서 추출
          if (!postContent) {
            const title = document.title;
            // "Username on Threads: 내용" 패턴
            const titleMatch = title.match(/on Threads:\s*["']?(.+?)["']?$/);
            if (titleMatch) {
              postContent = titleMatch[1];
            }
          }

          // 미디어 URL 추출 (이미지, 영상)
          const mediaUrls: string[] = [];

          // 이미지
          const images = document.querySelectorAll('article img[src*="cdninstagram"], article img[src*="fbcdn"]');
          images.forEach((img) => {
            const src = img.getAttribute('src');
            if (src && !src.includes('profile') && !src.includes('avatar')) {
              mediaUrls.push(src);
            }
          });

          // 영상
          const videos = document.querySelectorAll('article video source, article video[src]');
          videos.forEach((video) => {
            const src = video.getAttribute('src');
            if (src) {
              mediaUrls.push(src);
            }
          });

          // og:image fallback
          if (mediaUrls.length === 0) {
            const ogImage = document.querySelector('meta[property="og:image"]');
            const imageUrl = ogImage?.getAttribute('content');
            if (imageUrl && !imageUrl.includes('threads-app-icon')) {
              mediaUrls.push(imageUrl);
            }
          }

          // 타임스탬프 추출
          let timestamp: string | null = null;
          const timeEl = document.querySelector('time[datetime]');
          if (timeEl) {
            timestamp = timeEl.getAttribute('datetime');
          }

          // 좋아요/댓글 수 추출
          let likes: number | null = null;
          let replies: number | null = null;

          // 패턴: "123 likes", "1.2K likes" 등
          const engagementElements = document.querySelectorAll('span, div');
          engagementElements.forEach((el) => {
            const text = el.textContent?.trim() || '';
            if (text.match(/^\d+[KMkm]?\s*(likes?|좋아요)/i)) {
              const numMatch = text.match(/^([\d.,]+[KMkm]?)/i);
              if (numMatch) {
                likes = parseEngagement(numMatch[1]);
              }
            }
            if (text.match(/^\d+[KMkm]?\s*(replies?|답글|comments?)/i)) {
              const numMatch = text.match(/^([\d.,]+[KMkm]?)/i);
              if (numMatch) {
                replies = parseEngagement(numMatch[1]);
              }
            }
          });

          return {
            author,
            authorName,
            content: postContent,
            mediaUrls: [...new Set(mediaUrls)], // 중복 제거
            timestamp,
            likes,
            replies,
          };
        });

        // URL에서 추출한 username으로 fallback
        const finalAuthor = data.author || usernameFromUrl || 'unknown';

        return {
          author: finalAuthor,
          authorName: data.authorName || finalAuthor.replace('@', ''),
          content: data.content,
          mediaUrls: data.mediaUrls,
          timestamp: data.timestamp,
          likes: data.likes,
          replies: data.replies,
          url,
        };
      },
      {
        timeout: 30000,
        waitForTimeout: 4000, // React hydration 대기
      }
    );

    // 콘텐츠가 비어있으면 에러
    if (!postData.content) {
      return NextResponse.json(
        {
          error: 'Failed to extract content from Threads post. The post may be private or deleted.',
          partial: postData,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(postData);
  } catch (error) {
    console.error('Threads scraping error:', error);

    // Browserless 연결 오류
    if (error instanceof Error && error.message.includes('BROWSERLESS_TOKEN')) {
      return NextResponse.json(
        { error: 'Browserless is not configured. Please set BROWSERLESS_TOKEN environment variable.' },
        { status: 500 }
      );
    }

    // 타임아웃
    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timeout - Threads page took too long to load' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to scrape Threads post' },
      { status: 500 }
    );
  }
}
