import { NextRequest, NextResponse } from 'next/server';
import { withBrowserPage } from '@/lib/browserless';
import { z } from 'zod';

/**
 * Threads 프로필 피드 스크래핑 API
 *
 * POST /api/scrape/threads/profile
 * 공개 Threads 프로필에서 최근 포스트 목록을 추출
 */

// URL 검증 스키마
const requestSchema = z.object({
  url: z.string().url().refine(
    (url) => url.includes('threads.net/@'),
    { message: 'URL must be a Threads profile URL (e.g., https://threads.net/@username)' }
  ),
  limit: z.number().min(1).max(20).optional().default(10),
});

// 포스트 데이터 타입
interface ThreadsPost {
  postUrl: string;
  content: string;
  author: string;
  authorName: string;
  timestamp: string | null;
  mediaUrls: string[];
  likes: number | null;
  replies: number | null;
}

// 응답 타입
interface ThreadsProfileResponse {
  username: string;
  displayName: string;
  bio: string | null;
  profilePicture: string | null;
  posts: ThreadsPost[];
  postsCount: number;
}

// 프로필 URL에서 username 추출
const PROFILE_URL_PATTERN = /threads\.net\/@([^/?]+)/;

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

    const { url, limit } = validationResult.data;

    // URL에서 username 추출
    const urlMatch = url.match(PROFILE_URL_PATTERN);
    if (!urlMatch) {
      return NextResponse.json(
        { error: 'Invalid Threads profile URL format. Expected: https://threads.net/@username' },
        { status: 400 }
      );
    }
    const username = urlMatch[1];

    console.log(`[Threads Profile] Scraping profile: @${username}`);

    // Browserless를 통해 프로필 페이지 스크래핑
    const profileData = await withBrowserPage<ThreadsProfileResponse>(
      url,
      async (page) => {
        // Threads는 React 기반이므로 콘텐츠 로딩 대기
        await page.waitForTimeout(4000);

        // 스크롤하여 더 많은 포스트 로드
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await page.waitForTimeout(2000);

        // 데이터 추출
        const data = await page.evaluate((limitCount: number) => {
          // 헬퍼: 숫자 파싱
          const parseEngagement = (text: string): number | null => {
            if (!text) return null;
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

          // 프로필 정보 추출
          let displayName = '';
          let bio: string | null = null;
          let profilePicture: string | null = null;

          // 프로필 이미지
          const profileImg = document.querySelector('img[alt*="profile"], header img') as HTMLImageElement;
          if (profileImg?.src && !profileImg.src.includes('data:')) {
            profilePicture = profileImg.src;
          }

          // Display name - og:title 또는 페이지 타이틀에서 추출
          const ogTitle = document.querySelector('meta[property="og:title"]');
          if (ogTitle) {
            const titleContent = ogTitle.getAttribute('content') || '';
            // "Name (@username)" 패턴
            const nameMatch = titleContent.match(/^([^(@]+)/);
            if (nameMatch) {
              displayName = nameMatch[1].trim();
            }
          }
          if (!displayName) {
            // 페이지 타이틀에서 시도
            const titleMatch = document.title.match(/^([^(@]+)/);
            if (titleMatch) {
              displayName = titleMatch[1].trim();
            }
          }

          // Bio - og:description에서 추출
          const ogDesc = document.querySelector('meta[property="og:description"]');
          if (ogDesc) {
            const descContent = ogDesc.getAttribute('content') || '';
            // 팔로워 수 등을 제외한 실제 bio 추출
            if (descContent && !descContent.match(/^\d+[KMkm]?\s*(followers?|팔로워)/i)) {
              bio = descContent;
            }
          }

          // 포스트 목록 추출
          const posts: ThreadsPost[] = [];
          const seenUrls = new Set<string>();

          // 방법 1: article 요소에서 포스트 찾기
          const articles = document.querySelectorAll('article, [role="article"]');

          articles.forEach((article) => {
            if (posts.length >= limitCount) return;

            // 포스트 URL 찾기
            let postUrl = '';
            const links = article.querySelectorAll('a[href*="/post/"]');
            for (const link of links) {
              const href = link.getAttribute('href');
              if (href && href.includes('/post/')) {
                postUrl = href.startsWith('http') ? href : `https://www.threads.net${href}`;
                break;
              }
            }

            // time 요소에서 링크 찾기 (더 정확할 수 있음)
            if (!postUrl) {
              const timeLink = article.querySelector('time')?.closest('a');
              const href = timeLink?.getAttribute('href');
              if (href && href.includes('/post/')) {
                postUrl = href.startsWith('http') ? href : `https://www.threads.net${href}`;
              }
            }

            if (!postUrl || seenUrls.has(postUrl)) return;
            seenUrls.add(postUrl);

            // 콘텐츠 추출
            let content = '';
            const textSpans = article.querySelectorAll('span');
            for (const span of textSpans) {
              const text = span.textContent?.trim() || '';
              // 의미있는 콘텐츠 (시간, 좋아요 수 등 제외)
              if (text.length > 15 &&
                  !text.match(/^\d+[KMkm]?\s*(likes?|replies?|좋아요|답글|hours?|minutes?|days?|시간|분|일)/i) &&
                  !text.match(/^(Reply|답글|Like|좋아요|Share|공유)$/i)) {
                content = text;
                break;
              }
            }

            // 미디어 URL 추출
            const mediaUrls: string[] = [];
            const images = article.querySelectorAll('img[src*="cdninstagram"], img[src*="fbcdn"]');
            images.forEach((img) => {
              const src = (img as HTMLImageElement).src;
              if (src && !src.includes('profile') && !src.includes('avatar')) {
                mediaUrls.push(src);
              }
            });

            // 타임스탬프
            const timeEl = article.querySelector('time[datetime]');
            const timestamp = timeEl?.getAttribute('datetime') || null;

            // 좋아요/댓글 수
            let likes: number | null = null;
            let replies: number | null = null;

            const engagementEls = article.querySelectorAll('span, div');
            engagementEls.forEach((el) => {
              const text = el.textContent?.trim() || '';
              if (text.match(/^\d+[KMkm]?\s*(likes?|좋아요)/i)) {
                const numMatch = text.match(/^([\d.,]+[KMkm]?)/i);
                if (numMatch) likes = parseEngagement(numMatch[1]);
              }
              if (text.match(/^\d+[KMkm]?\s*(replies?|답글)/i)) {
                const numMatch = text.match(/^([\d.,]+[KMkm]?)/i);
                if (numMatch) replies = parseEngagement(numMatch[1]);
              }
            });

            if (content || mediaUrls.length > 0) {
              posts.push({
                postUrl,
                content,
                author: '',  // 프로필 페이지이므로 동일
                authorName: '',
                timestamp,
                mediaUrls: [...new Set(mediaUrls)],
                likes,
                replies,
              });
            }
          });

          // 방법 2: 링크 기반으로 포스트 찾기 (fallback)
          if (posts.length === 0) {
            const postLinks = document.querySelectorAll('a[href*="/post/"]');
            postLinks.forEach((link) => {
              if (posts.length >= limitCount) return;

              const href = link.getAttribute('href');
              if (!href) return;

              const postUrl = href.startsWith('http') ? href : `https://www.threads.net${href}`;
              if (seenUrls.has(postUrl)) return;
              seenUrls.add(postUrl);

              // 링크 주변에서 텍스트 찾기
              const parent = link.closest('div');
              let content = '';
              if (parent) {
                const spans = parent.querySelectorAll('span');
                for (const span of spans) {
                  const text = span.textContent?.trim() || '';
                  if (text.length > 15 && !text.match(/^\d+/)) {
                    content = text;
                    break;
                  }
                }
              }

              posts.push({
                postUrl,
                content,
                author: '',
                authorName: '',
                timestamp: null,
                mediaUrls: [],
                likes: null,
                replies: null,
              });
            });
          }

          return {
            displayName,
            bio,
            profilePicture,
            posts,
          };
        }, limit);

        // username과 displayName 설정
        const finalDisplayName = data.displayName || username;

        return {
          username: `@${username}`,
          displayName: finalDisplayName,
          bio: data.bio,
          profilePicture: data.profilePicture,
          posts: data.posts.map(post => ({
            ...post,
            author: `@${username}`,
            authorName: finalDisplayName,
          })),
          postsCount: data.posts.length,
        };
      },
      {
        timeout: 45000,
        waitForTimeout: 5000,
      }
    );

    console.log(`[Threads Profile] Found ${profileData.postsCount} posts from @${username}`);

    if (profileData.postsCount === 0) {
      return NextResponse.json(
        {
          error: 'No posts found. The profile may be private or have no public posts.',
          partial: {
            username: profileData.username,
            displayName: profileData.displayName,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('[Threads Profile] Scraping error:', error);

    // Browserless 연결 오류
    if (error instanceof Error && error.message.includes('BROWSERLESS_TOKEN')) {
      return NextResponse.json(
        { error: 'Browserless is not configured. Please set BROWSERLESS_TOKEN environment variable.' },
        { status: 503 }
      );
    }

    // 타임아웃
    if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('Timeout'))) {
      return NextResponse.json(
        { error: 'Request timeout - Threads profile took too long to load' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to scrape Threads profile' },
      { status: 500 }
    );
  }
}
