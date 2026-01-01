# AI News Dashboard - Project Specification

> Version: 0.9.2 | Last Updated: 2026-01-01

## Overview

AI 뉴스/콘텐츠를 **다양한 소스에서 수집**하고, **고품질 AI 요약**을 제공하며, 소셜 미디어용 콘텐츠와 이미지를 생성하는 대시보드.

### Core Philosophy

```
핵심 = 수집 + 요약 + 생성
┌─────────────────────────────────────────────────────────────────┐
│  1. 수집 (Collection)     - 다양한 소스에서 콘텐츠 가져오기      │
│  2. 요약 (Summarization)  - AI로 핵심 파악 및 인사이트 추출     │
│  3. 생성 (Generation)     - 플랫폼별 콘텐츠 + 이미지 생성       │
│  4. 출력 (Output)         - 클립보드 복사 또는 직접 게시        │
└─────────────────────────────────────────────────────────────────┘
```

### Core Workflow

```
[소스 등록] → [수집 트리거(수동)] → [AI 요약(자동)] → [콘텐츠 생성] → [이미지 생성] → [게시/복사]
```

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4.x, Framer Motion |
| **State** | Zustand (client), TanStack Query (server) |
| **Database** | Neon PostgreSQL (serverless) |
| **ORM** | Drizzle ORM |
| **AI** | Google Gemini 3 (`gemini-3-flash-preview`, `gemini-3-pro-image-preview`) |
| **Scraping** | Browserless (remote browser), Cheerio |
| **YouTube** | yt-dlp (자막 추출) |
| **Image** | Sharp (이미지 프로세싱) |

### Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│  Vercel (Next.js)                                               │
│  ├── /api/news/* ──────────→ Neon PostgreSQL                   │
│  ├── /api/ai/*   ──────────→ Gemini API (gemini-3-flash)       │
│  ├── /api/image/* ─────────→ Gemini API (gemini-3-pro-image)   │
│  ├── /api/headline/* ──────→ Gemini API (헤드라인 생성)         │
│  ├── /api/youtube/* ───────→ yt-dlp (자막 추출)                 │
│  └── /api/scrape/* ────────→ Browserless (원격 브라우저)        │
│                                    ↓                            │
│                         Twitter/X, Threads 스크래핑              │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Enums
news_category: product | update | research | announcement | other
priority: high | medium | low
source_type: rss | youtube | twitter | threads | blog
platform: twitter | threads | instagram | linkedin | bluesky

-- Tables
users
├── id, email, displayName, theme, autoSummarize

sources
├── id, userId, name, type, websiteUrl, rssUrl
├── priority, isActive, lastFetchedAt
└── scrapeConfig (JSONB: articleSelector, titleSelector, linkSelector)

news_items
├── id, sourceId, title, url, originalContent
├── isProcessed, isBookmarked, priority
├── mediaUrls[] (JSONB)
├── quickSummary (JSONB: bullets[], category, createdAt)
├── translatedContent, translatedAt
└── generatedContents (JSONB: {platform: {content, charCount, hashtags}})

style_templates
├── id, platform, name, tone, characteristics[]
└── isDefault

social_connections
├── id, platform, handle, isConnected
└── credentials (JSONB: accessToken, refreshToken, expiresAt)

publish_history
├── id, newsItemId, content
└── results[] (JSONB: {platform, success, postUrl, error})
```

---

## Source Types

### 1. RSS/Blog
- 주요 AI 기업 블로그 (OpenAI, Anthropic, Google AI 등)
- RSS 피드 자동 파싱 (rss-parser)
- URL 스크래핑 fallback (Cheerio)

### 2. YouTube
| 항목 | 설명 |
|------|------|
| **추출 대상** | 자막 (공식 우선 → 자동생성 fallback) + 영상 설명 |
| **채널 피드** | YouTube RSS 피드로 최신 영상 목록 추출 |
| **구현** | yt-dlp 기반 자막 추출 |
| **미디어** | 썸네일 자동 추출 |

### 3. Twitter/X
| 항목 | 설명 |
|------|------|
| **수집 방식** | URL 입력 → Browserless 스크래핑 |
| **추출 대상** | 트윗 본문, 이미지, 영상 URL, 좋아요/리트윗 수 |
| **구현** | Playwright 원격 브라우저 |

### 4. Threads
| 항목 | 설명 |
|------|------|
| **수집 방식** | 프로필 URL 입력 → Browserless 스크래핑 |
| **추출 대상** | 포스트 목록, 본문, 이미지, 좋아요/댓글 수 |
| **지원** | 개별 포스트 + 프로필 피드 |

---

## Priority System

### 3단계 우선순위

| Level | 배지 | 색상 | 용도 |
|-------|------|------|------|
| **High** | 🔴 | Red (#ef4444) | 중요 소스, 꼭 확인 |
| **Medium** | 🟡 | Yellow (#eab308) | 일반 소스 |
| **Low** | 🔵 | Blue (#3b82f6) | 참고용 |

- 소스별 우선순위 설정 → 뉴스 아이템에 상속
- 카드 좌상단에 배지 표시
- 우선순위별 필터링 가능

---

## AI Features

### Model Configuration

| 기능 | 모델 | Temperature |
|------|------|-------------|
| **요약** | gemini-3-flash-preview | 0.6 |
| **콘텐츠 생성** | gemini-3-flash-preview | 0.7 |
| **번역** | gemini-3-flash-preview | 0.2 |
| **이미지 생성** | gemini-3-pro-image-preview | - |

### 요약 출력 형식

```json
{
  "headline": "20-40자 핵심 헤드라인",
  "bullets": ["포인트 1", "포인트 2", "포인트 3"],
  "insight": "왜 중요한가 (50-80자)",
  "category": "product|update|research|announcement|other",
  "wowFactor": {
    "description": "주목할 만한 포인트 (30-50자)",
    "suggestedMedia": "추천 이미지/영상 설명"
  }
}
```

### 콘텐츠 생성 규칙
- 최대 글자수의 50-80% 활용 (여유있게)
- 이모지는 문장 중간에 자연스럽게 배치
- 2-3문장을 한 문단으로 묶고 줄바꿈
- 마지막에 출처 표기 (예: "출처: Hacker News")
- 정보 전달 중심, 군더더기 없이

### 이미지 생성
- AI가 기사 내용 분석 → 동적 프롬프트 생성
- 헤드라인 텍스트 오버레이 (Pretendard 폰트)
- 플랫폼별 최적 비율 지원:
  - Twitter: 16:9, 1:1, 4:5
  - Instagram: 4:5, 1:1, 9:16
  - LinkedIn: 1.91:1, 1:1, 16:9
  - Bluesky: 16:9, 1:1

---

## Content Generation

### 플랫폼별 포맷

| 플랫폼 | 글자수 | 특성 |
|--------|--------|------|
| X (Twitter) | 280자 | 해시태그 1-2개, 핵심만 간결하게 |
| Bluesky | 300자 | 간결하고 정보 중심 |
| Threads | 500자 | 정보 중심으로 깔끔하게 정리 |
| Instagram | 2200자 | 읽기 쉽게 정리, 해시태그 맨 마지막 |
| LinkedIn | 3000자 | 전문적이고 깔끔하게, 인사이트 포함 |

### 출력 방식
- **기본**: 클립보드 복사
- **선택**: 직접 게시 (OAuth 연동)

---

## API Endpoints

### AI Processing
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai` | POST | 요약(summarize), 생성(generate), 재생성(regenerate), 번역(translate) |
| `/api/headline` | POST | AI 헤드라인 생성 + 대안 3개 |
| `/api/image` | POST/GET | AI 이미지 생성, 플랫폼별 사이즈 조회 |

### Content Collection
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/rss` | POST | RSS 피드 파싱 |
| `/api/scrape` | POST | 단일 URL 스크래핑 |
| `/api/scrape-source` | POST | 소스 웹사이트 스크래핑 |
| `/api/scrape-social` | POST | 소셜 미디어 자동 감지 스크래핑 |
| `/api/youtube` | POST | YouTube 비디오 자막 추출 |
| `/api/youtube/channel` | POST | YouTube 채널 피드 |
| `/api/scrape/twitter` | POST | Twitter 트윗 스크래핑 |
| `/api/scrape/threads` | POST | Threads 포스트 스크래핑 |
| `/api/scrape/threads/profile` | POST | Threads 프로필 피드 |

### Social Publishing
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/social/bluesky/connect` | POST | Bluesky 연결 확인 |
| `/api/social/bluesky/post` | POST | Bluesky 포스팅 |
| `/api/social/threads/auth` | GET | Threads OAuth URL |
| `/api/social/threads/callback` | POST | Threads 토큰 교환 |
| `/api/social/threads/post` | POST | Threads 포스팅 |
| `/api/social/linkedin/auth` | GET | LinkedIn OAuth URL |
| `/api/social/linkedin/callback` | POST | LinkedIn 토큰 교환 |
| `/api/social/linkedin/post` | POST | LinkedIn 포스팅 |
| `/api/social/instagram/auth` | GET | Instagram OAuth URL |
| `/api/social/instagram/callback` | POST | Instagram 토큰 교환 |
| `/api/social/instagram/post` | POST | Instagram 포스팅 |

### Data Management
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/news` | GET/POST/DELETE | 뉴스 목록/생성/전체삭제 |
| `/api/news/[id]` | GET/PATCH/DELETE | 개별 뉴스 CRUD |
| `/api/sources` | GET/POST | 소스 목록/생성 |
| `/api/sources/[id]` | GET/PATCH/DELETE | 개별 소스 CRUD |
| `/api/templates` | GET/POST | 템플릿 목록/생성 |
| `/api/social/connections` | GET/POST | 소셜 연결 관리 |

---

## Features

### Implemented (v0.9.x)

| ID | Feature | Status |
|----|---------|--------|
| F-001 | RSS 수집 | ✅ |
| F-002 | URL 스크래핑 | ✅ |
| F-003 | AI 요약 (Gemini) | ✅ |
| F-004 | 플랫폼별 콘텐츠 생성 | ✅ |
| F-005 | 피드백 재생성 | ✅ |
| F-006 | YouTube 자막 수집 | ✅ |
| F-007 | YouTube 채널 피드 | ✅ |
| F-008 | Twitter/X 스크래핑 | ✅ |
| F-009 | Threads 스크래핑 | ✅ |
| F-010 | Threads 프로필 피드 | ✅ |
| F-011 | 우선순위 시스템 | ✅ |
| F-012 | AI 이미지 생성 | ✅ |
| F-013 | AI 헤드라인 생성 | ✅ |
| F-014 | 이미지 갤러리 | ✅ |
| F-015 | 번역 (영→한) | ✅ |
| F-016 | 소셜 게시 (4개 플랫폼) | ✅ |

### v0.9.2 Changes
- 콘텐츠 생성 프롬프트 개선 (글자수 50-80%, 이모지 자연 배치)
- 스타일 템플릿 선택 UI 제거 (간소화)
- 출처 표기 기능 추가
- analyzeStyle 기능 제거

### Future (v1.0+)

| ID | Feature | Priority |
|----|---------|----------|
| F-201 | 소스 관리 UX 개선 | P1 |
| F-202 | 콘텐츠 스케줄링 | P2 |
| F-203 | 분석 대시보드 | P2 |
| F-204 | 다국어 지원 | P2 |

---

## Environment Variables

```env
# Required
DATABASE_URL=postgresql://...          # Neon PostgreSQL
GEMINI_API_KEY=...                     # Google Gemini API

# Browserless (Twitter/X, Threads 스크래핑)
BROWSERLESS_TOKEN=...                  # browserless.io 토큰

# Social APIs (optional, 직접 게시용)
THREADS_APP_ID=...
THREADS_APP_SECRET=...
THREADS_REDIRECT_URI=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_REDIRECT_URI=...
INSTAGRAM_CLIENT_ID=...
INSTAGRAM_CLIENT_SECRET=...
INSTAGRAM_REDIRECT_URI=...
```

---

## File References

### Core Logic
| 목적 | 파일 |
|------|------|
| DB 스키마 | `my-app/lib/db/schema.ts` |
| DB 쿼리 | `my-app/lib/db/queries.ts` |
| Zustand 스토어 | `my-app/store/index.ts` |
| API 클라이언트 | `my-app/lib/api.ts` |
| AI 통합 | `my-app/lib/gemini.ts` |
| 이미지 오버레이 | `my-app/lib/image-overlay.ts` |
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

---

## Design Principles

1. **수집 > 게시**: 핵심은 좋은 소스에서 잘 가져오는 것
2. **요약 품질**: 핵심 파악 + 인사이트 제공
3. **콘텐츠 품질**: 정보 전달 중심, 자연스러운 톤
4. **이미지 활용**: AI 생성 이미지로 시각적 임팩트
5. **클립보드 우선**: 소셜 게시는 선택사항

---

## Changelog

- **v0.9.2** (2026-01-01): 콘텐츠 생성 프롬프트 개선, 스타일 템플릿 제거
  - 글자수 50-80% 범위 활용
  - 이모지 자연스러운 배치
  - 출처 표기 기능
  - analyzeStyle 기능 제거
- **v0.9.1** (2025-12-31): AI 이미지 생성 및 UX 개선
  - AI 이미지 생성 기능
  - AI 헤드라인 생성
  - 이미지 갤러리 (로컬 저장)
  - YouTube 채널 피드 지원
- **v0.9.0** (2025-12-31): 프로젝트 방향 재정의
  - Gemini 3 Flash 전환
  - YouTube/Twitter/Threads 소스 추가
  - 우선순위 시스템 도입
- **v0.8.0** (2025-12-30): 인증 제거, 공개 접근 모델
- **v0.7.0**: Firebase → Neon PostgreSQL 마이그레이션
- **v0.5.0**: 소셜 미디어 4개 플랫폼 API 연동
