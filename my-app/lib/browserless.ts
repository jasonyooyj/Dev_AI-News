import { chromium, Browser, Page } from 'playwright-core';

/**
 * Browserless 클라이언트
 *
 * Browserless.io를 통한 헤드리스 브라우저 연결 관리
 * 환경변수: BROWSERLESS_TOKEN
 */

const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;

export interface BrowserlessOptions {
  timeout?: number;
  waitForSelector?: string;
  waitForTimeout?: number;
}

/**
 * Browserless에 연결된 브라우저 인스턴스 생성
 */
export async function connectBrowser(): Promise<Browser> {
  if (!BROWSERLESS_TOKEN) {
    throw new Error('BROWSERLESS_TOKEN is not configured');
  }

  const browser = await chromium.connect(
    `wss://chrome.browserless.io?token=${BROWSERLESS_TOKEN}`
  );

  return browser;
}

/**
 * 페이지 스크래핑을 위한 헬퍼 함수
 * 브라우저 연결, 페이지 생성, 정리를 자동으로 처리
 */
export async function withBrowserPage<T>(
  url: string,
  callback: (page: Page) => Promise<T>,
  options: BrowserlessOptions = {}
): Promise<T> {
  const { timeout = 30000, waitForSelector, waitForTimeout = 3000 } = options;

  const browser = await connectBrowser();

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'ko-KR',
    });

    const page = await context.newPage();
    page.setDefaultTimeout(timeout);

    // 페이지 로드
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout
    });

    // React 등 SPA hydration 대기
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout });
    } else {
      // 기본 대기 시간 (hydration 완료 대기)
      await page.waitForTimeout(waitForTimeout);
    }

    const result = await callback(page);

    await context.close();
    return result;
  } finally {
    await browser.close();
  }
}

/**
 * 페이지 HTML 가져오기
 */
export async function getPageContent(
  url: string,
  options: BrowserlessOptions = {}
): Promise<string> {
  return withBrowserPage(url, async (page) => {
    return await page.content();
  }, options);
}

/**
 * 페이지 스크린샷 캡처
 */
export async function captureScreenshot(
  url: string,
  options: BrowserlessOptions = {}
): Promise<Buffer> {
  return withBrowserPage(url, async (page) => {
    return await page.screenshot({ fullPage: true });
  }, options);
}

/**
 * Twitter/X 스크래핑 결과 인터페이스
 */
export interface TwitterScrapeResult {
  author: string;
  authorName: string;
  content: string;
  mediaUrls: string[];
  timestamp: string | null;
  likes: number;
  retweets: number;
}

/**
 * Twitter/X 트윗 스크래핑
 * 공개 트윗만 스크래핑 가능 (로그인 불필요)
 */
export async function scrapeTwitter(url: string): Promise<TwitterScrapeResult> {
  // URL 형식 검증
  const urlPattern = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/;
  if (!urlPattern.test(url)) {
    throw new Error('Invalid Twitter/X URL format. Expected: https://x.com/user/status/123...');
  }

  return withBrowserPage(
    url,
    async (page) => {
      // 트윗 콘텐츠 로드 대기 (없을 수도 있음 - 미디어만 있는 트윗)
      await page.waitForSelector('[data-testid="tweetText"]', { timeout: 10000 })
        .catch(() => {});

      // 트윗 데이터 추출
      const result = await page.evaluate(() => {
        // 텍스트 콘텐츠 안전하게 가져오기
        const tweetTextEl = document.querySelector('[data-testid="tweetText"]');
        const content = tweetTextEl?.textContent?.trim() || '';

        // 작성자 정보 (User-Name 요소에서)
        const userNameEl = document.querySelector('[data-testid="User-Name"]');
        let author = '';
        let authorName = '';

        if (userNameEl) {
          // 첫 번째 링크에 표시 이름이 있음
          const links = userNameEl.querySelectorAll('a');
          if (links.length >= 1) {
            authorName = links[0]?.textContent?.trim() || '';
          }
          // @ 핸들 찾기
          const handleMatch = userNameEl.textContent?.match(/@\w+/);
          if (handleMatch) {
            author = handleMatch[0];
          }
        }

        // 미디어 URL 수집
        const mediaUrls: string[] = [];

        // 이미지
        document.querySelectorAll('[data-testid="tweetPhoto"] img').forEach((img) => {
          const src = (img as HTMLImageElement).src;
          if (src && !src.includes('emoji') && !src.includes('profile')) {
            // 고화질 이미지 URL로 변환
            const highQualitySrc = src.replace(/&name=\w+/, '&name=large');
            mediaUrls.push(highQualitySrc);
          }
        });

        // 비디오 - 포스터 또는 썸네일
        document.querySelectorAll('[data-testid="videoPlayer"] video, video').forEach((video) => {
          const poster = (video as HTMLVideoElement).poster;
          if (poster) {
            mediaUrls.push(poster);
          }
          // src도 확인 (blob URL은 사용 불가)
          const src = (video as HTMLVideoElement).src;
          if (src && !src.startsWith('blob:')) {
            mediaUrls.push(src);
          }
        });

        // 타임스탬프
        const timeEl = document.querySelector('time');
        const timestamp = timeEl?.getAttribute('datetime') || null;

        // 참여 지표 (좋아요, 리트윗)
        let likes = 0;
        let retweets = 0;

        // 좋아요 수 찾기
        const likeButton = document.querySelector('[data-testid="like"]');
        if (likeButton) {
          const likeText = likeButton.getAttribute('aria-label') || '';
          const likeMatch = likeText.match(/(\d+(?:,\d+)*)\s*(?:Like|like)/i);
          if (likeMatch) {
            likes = parseInt(likeMatch[1].replace(/,/g, ''), 10) || 0;
          }
        }

        // 리트윗 수 찾기
        const retweetButton = document.querySelector('[data-testid="retweet"]');
        if (retweetButton) {
          const retweetText = retweetButton.getAttribute('aria-label') || '';
          const retweetMatch = retweetText.match(/(\d+(?:,\d+)*)\s*(?:Repost|repost|Retweet|retweet)/i);
          if (retweetMatch) {
            retweets = parseInt(retweetMatch[1].replace(/,/g, ''), 10) || 0;
          }
        }

        return {
          author,
          authorName,
          content,
          mediaUrls,
          timestamp,
          likes,
          retweets,
        };
      });

      return result;
    },
    {
      timeout: 20000,
      waitForTimeout: 3000,
    }
  );
}
