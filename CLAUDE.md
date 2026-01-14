# CLAUDE.md

> AI 어시스턴트를 위한 프로젝트 가이드. 상세 정보는 `PROJECT_SPEC.md` 참조.

## Quick Start

```bash
cd my-app && npm run dev    # localhost:3000
npm run build               # 빌드
```

## Project Context

| 항목 | 내용 |
|------|------|
| **What** | AI 뉴스 수집 → AI 요약 → 소셜 미디어 콘텐츠/이미지 생성 대시보드 |
| **Version** | 0.9.8 |
| **Auth** | 없음 (공개 접근, DEFAULT_USER_ID 사용) |
| **Stack** | Next.js 15 + Neon PostgreSQL + Gemini AI |
| **State** | Zustand (client) + TanStack Query (server) |

## Source Types

| Type | 설명 | 수집 방식 |
|------|------|----------|
| `rss` | RSS 피드 파싱 | rss-parser |
| `youtube` | YouTube 비디오/채널 | yt-dlp + RSS |
| `twitter` | X/Twitter 포스트 | Browserless 스크래핑 |
| `threads` | Threads 포스트/프로필 | Browserless 스크래핑 |
| `blog` | 웹 스크래핑 | Cheerio (CSS 셀렉터) |

## AI Models

| 기능 | 모델 |
|------|------|
| 요약/생성/번역 | `gemini-3-flash-preview` |
| 이미지 생성 | `gemini-3-pro-image-preview` |

## Key Files

### Core Logic
| 목적 | 파일 |
|------|------|
| 전체 스펙 | `PROJECT_SPEC.md` |
| DB 스키마 | `my-app/lib/db/schema.ts` |
| DB 쿼리 | `my-app/lib/db/queries.ts` |
| AI 통합 | `my-app/lib/gemini.ts` |
| API 클라이언트 | `my-app/lib/api.ts` |
| 이미지 처리 | `my-app/lib/image-overlay.ts` |
| 스토어 | `my-app/store/index.ts` |
| 타입 정의 | `my-app/types/news.ts` |

### API Routes
| 목적 | 파일 |
|------|------|
| AI 요약/생성 | `my-app/app/api/ai/route.ts` |
| 헤드라인 생성 | `my-app/app/api/headline/route.ts` |
| 이미지 생성 | `my-app/app/api/image/route.ts` |
| RSS 파싱 | `my-app/app/api/rss/route.ts` |
| YouTube | `my-app/app/api/youtube/route.ts` |
| 소셜 스크래핑 | `my-app/app/api/scrape-social/route.ts` |
| Threads 프로필 | `my-app/app/api/scrape/threads/profile/route.ts` |

### Components
| 목적 | 파일 |
|------|------|
| 대시보드 | `my-app/components/dashboard/Dashboard.tsx` |
| 뉴스 상세 | `my-app/components/news/NewsDetail.tsx` |
| 이미지 생성기 | `my-app/components/news/ImageGenerator.tsx` |
| 뉴스 목록 | `my-app/components/news/NewsList.tsx` |
| 콘텐츠 수집 | `my-app/components/collect/ContentFetcher.tsx` |

### Hooks
| 목적 | 파일 |
|------|------|
| 뉴스 관리 | `my-app/hooks/useNews.ts` |
| AI 기능 | `my-app/hooks/useAI.ts` |
| 이미지 생성 | `my-app/hooks/useImageGeneration.ts` |
| 이미지 갤러리 | `my-app/hooks/useImageGallery.ts` |
| 소셜 연결 | `my-app/hooks/useSocialConnections.ts` |
| TanStack 뮤테이션 | `my-app/hooks/queries.ts` |

## Database Schema (Summary)

```
sources       → 뉴스 소스 (RSS, YouTube, Twitter, Threads, Blog)
news_items    → 수집된 뉴스 (요약, 번역, 생성된 콘텐츠 포함)
social_connections → 소셜 미디어 OAuth 연결
publish_history    → 게시 이력
```

## Content Generation Rules

- 최대 글자수의 **50-80%** 활용
- 이모지는 **문장 중간에 자연스럽게** 배치
- **2-3문장**을 한 문단으로 묶고 줄바꿈
- 마지막에 **출처 표기** (예: "출처: Hacker News")
- **정보 전달 중심**, 군더더기 없이

## Platform Limits

| 플랫폼 | 글자수 |
|--------|--------|
| Twitter | 280 |
| Bluesky | 300 |
| Threads | 500 |
| Instagram | 2200 |
| LinkedIn | 3000 |

## Recent Changes (v0.9.3)

- 플랫폼별 콘텐츠 생성 프롬프트 고도화
- Instagram 전용 프롬프트 (훅 라인, CTA, 해시태그 8-15개)
- Twitter/Threads/LinkedIn 스타일 가이드라인 확장
- regenerateContent() 플랫폼별 컨텍스트 지원
