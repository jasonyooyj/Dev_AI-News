# AI News Dashboard - Project Specification

> Version: 0.9.0 | Last Updated: 2025-12-31

## Overview

AI 뉴스/콘텐츠를 **다양한 소스에서 수집**하고, **고품질 AI 요약**을 제공하며, 소셜 미디어용 콘텐츠를 생성하는 대시보드.

### Core Philosophy

```
핵심 = 수집 + 요약
┌─────────────────────────────────────────────────────────────────┐
│  1. 수집 (Collection)     - 다양한 소스에서 콘텐츠 가져오기      │
│  2. 요약 (Summarization)  - AI로 핵심 파악 및 인사이트 추출     │
│  3. 출력 (Output)         - 클립보드 복사 (소셜 게시는 선택)    │
└─────────────────────────────────────────────────────────────────┘
```

### Core Workflow

```
[소스 등록] → [수집 트리거(수동)] → [AI 요약(자동)] → [콘텐츠 생성] → [클립보드 복사]
                                                              ↓
                                                    [미디어 첨부 (선택)]
```

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4.x |
| **State** | Zustand (client), TanStack Query (server) |
| **Database** | Neon PostgreSQL (serverless) |
| **ORM** | Drizzle ORM |
| **AI** | Google Gemini 3 Flash (`gemini-3-flash-preview`) |
| **Scraping** | Browserless (remote browser) |
| **YouTube** | yt-dlp (자막 추출) |

### Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│  Vercel (Next.js)                                               │
│  ├── /api/news/* ──────────→ Neon PostgreSQL                   │
│  ├── /api/ai/*   ──────────→ Gemini API (gemini-3-flash)       │
│  ├── /api/youtube/* ───────→ yt-dlp (자막 추출)                 │
│  └── /api/scrape/* ────────→ Browserless (원격 브라우저)        │
│                                    ↓                            │
│                         Twitter/X, Threads 스크래핑              │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
sources
├── id, name, url, type (rss|youtube|twitter|threads|blog)
├── priority (high|medium|low)  -- 우선순위
├── isActive                    -- fetch 여부
└── lastFetchedAt

news_items
├── id, sourceId, title, url, content
├── summary, category           -- AI 생성
├── mediaUrls[]                 -- 이미지/영상 링크
├── priority (inherited)        -- 소스에서 상속
└── createdAt

style_templates
├── id, platform, name
├── tone, characteristics
└── isDefault
```

---

## Source Types

### 1. RSS/Blog (기존)
- 주요 AI 기업 블로그
- RSS 피드 자동 파싱
- URL 스크래핑 fallback

### 2. YouTube (신규)
| 항목 | 설명 |
|------|------|
| **추출 대상** | 자막 (공식 우선 → 자동생성 fallback) + 영상 설명 |
| **처리** | 전체 영상 요약 (길이 제한 없음) |
| **구현** | yt-dlp 기반 (Dev_Transcription 참고) |
| **미디어** | 썸네일 자동 추출 |

### 3. Twitter/X (신규)
| 항목 | 설명 |
|------|------|
| **수집 방식** | 수동 URL 입력 → Browserless 스크래핑 |
| **추출 대상** | 트윗 본문, 이미지, 영상 URL |
| **제한** | 공식 API 비용 회피 ($100+/월) |

### 4. Threads (신규)
| 항목 | 설명 |
|------|------|
| **수집 방식** | 수동 URL 입력 → Browserless 스크래핑 |
| **추출 대상** | 스레드 본문, 이미지, 영상 URL |
| **제한** | 공식 읽기 API 없음 |

---

## Priority System

### 3단계 우선순위

| Level | 배지 | 정렬 | 용도 |
|-------|------|------|------|
| **High** | 🔴 빨간 배지 | 최상단 | 중요 소스, 꼭 확인 |
| **Medium** | 🟡 노란 배지 | 중간 | 일반 소스 |
| **Low** | 🔵 파란 배지 | 하단 | 참고용 |

- 소스별 우선순위 설정 → 뉴스 아이템에 상속
- 배지는 강하게 시각적 표시 (카드 좌상단)
- 필터링: 우선순위별 필터 가능

---

## AI Summarization

### Model: Gemini 3 Flash

| 항목 | 설정 |
|------|------|
| **모델** | gemini-3-flash-preview |
| **예상 비용** | ~$10/월 또는 무료 티어 |
| **가격** | $0.50/1M input, $3/1M output |
| **요약 길이** | 5-7줄 (상세) |
| **관점** | 혼합 (기술 + 비즈니스 + 트렌드) |

### 요약 출력 형식

```json
{
  "summary": {
    "headline": "한 줄 핵심",
    "bullets": ["포인트 1", "포인트 2", "포인트 3", "포인트 4", "포인트 5"],
    "insight": "왜 중요한가 (비즈니스/트렌드 관점)"
  },
  "category": "product|update|research|announcement|tutorial",
  "wowFactor": {
    "description": "주목할 만한 포인트",
    "suggestedMedia": "추천 이미지/영상 설명"
  }
}
```

---

## Media Handling

### 전략
1. **원본 링크 저장** - 이미지/영상 URL 그대로 저장
2. **Wow Factor 자동 추천** - AI가 주목할 미디어 제안
3. **썸네일 표시** - OG 이미지 또는 첫 번째 미디어

### 미디어 타입별 처리

| 소스 | 이미지 | 영상 |
|------|--------|------|
| RSS/Blog | OG 이미지 추출 | 본문 내 영상 URL |
| YouTube | 썸네일 자동 | 영상 URL |
| Twitter/X | 첨부 이미지 | 첨부 영상 URL |
| Threads | 첨부 이미지 | 첨부 영상 URL |

---

## Content Generation

### 플랫폼별 포맷 유지

| 플랫폼 | 글자수 | 특성 |
|--------|--------|------|
| X (Twitter) | 280자 | 해시태그 1-2개, 임팩트 |
| Threads | 500자 | 캐주얼, 대화체 |
| LinkedIn | 3000자 | 전문적, 인사이트 |
| Instagram | 2200자 | 이모지, 해시태그 5-10개 |

### 스타일 템플릿
- 플랫폼별 개별 스타일 지정 가능
- 예시 텍스트 기반 AI 분석
- 기본 템플릿 설정

### 출력 방식
- **기본**: 클립보드 복사
- **선택**: 직접 게시 (기존 API 연동 유지)

---

## Features

### Implemented (v0.8.x)

| ID | Feature | Status |
|----|---------|--------|
| F-001 | RSS 수집 | ✅ |
| F-002 | URL 스크래핑 | ✅ |
| F-003 | AI 요약 (DeepSeek) | ✅ → 교체 예정 |
| F-004 | 플랫폼별 콘텐츠 생성 | ✅ |
| F-005 | 스타일 템플릿 | ✅ |
| F-006 | 피드백 재생성 | ✅ |
| F-007~010 | 소셜 게시 API | ✅ (유지) |

### v0.9.0 (Current Sprint)

| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| F-101 | Gemini 3 Flash 전환 | P0 | 🔄 |
| F-102 | YouTube 자막 수집 | P0 | 🔄 |
| F-103 | Twitter/X 스크래핑 | P0 | 🔄 |
| F-104 | Threads 스크래핑 | P0 | 🔄 |
| F-105 | 우선순위 시스템 (3단계 + 배지) | P0 | 🔄 |
| F-106 | 미디어 링크 저장 | P1 | ⏳ |
| F-107 | Wow Factor 자동 추천 | P1 | ⏳ |
| F-108 | 요약 품질 개선 (상세 + 혼합 관점) | P1 | ⏳ |

### Future (v1.0+)

| ID | Feature | Priority |
|----|---------|----------|
| F-201 | 소스 관리 UX 개선 | P1 |
| F-202 | 콘텐츠 스케줄링 | P2 |
| F-203 | 분석 대시보드 | P2 |

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
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
```

---

## File References

### Core Logic
- `@my-app/lib/db/schema.ts` - DB 스키마 정의
- `@my-app/lib/db/queries.ts` - DB 쿼리 함수
- `@my-app/store/index.ts` - Zustand 스토어
- `@my-app/lib/api.ts` - API 클라이언트

### API Routes
- `@my-app/app/api/openai/route.ts` - AI 요약/생성 (→ GPT-5.2)
- `@my-app/app/api/rss/route.ts` - RSS 파싱
- `@my-app/app/api/youtube/route.ts` - 유튜브 자막 (신규)
- `@my-app/app/api/scrape/twitter/route.ts` - Twitter 스크래핑 (신규)
- `@my-app/app/api/scrape/threads/route.ts` - Threads 스크래핑 (신규)

### External References
- `@Dev_Transcription/Youtube_Transcription_Extractor.py` - 유튜브 자막 로직 참고

---

## Design Principles

1. **수집 > 게시**: 핵심은 좋은 소스에서 잘 가져오는 것
2. **요약 품질**: 핵심 파악 + 인사이트 제공
3. **소스 관리 편의성**: 관심없는 소스는 비활성화로 쉽게 관리
4. **미디어 활용**: wow factor 이미지/영상 함께 제공
5. **클립보드 우선**: 소셜 게시는 선택사항

---

## Changelog

- **v0.9.0** (2025-12-31): 프로젝트 방향 재정의, 수집+요약 핵심화
  - Gemini 3 Flash 전환
  - YouTube/Twitter/Threads 소스 추가
  - 우선순위 시스템 도입
  - 미디어 처리 개선
- **v0.8.1** (2025-12-30): README 문서 전면 개편
- **v0.8.0** (2025-12-30): 인증 제거, 공개 접근 모델
- **v0.7.0**: Firebase → Neon PostgreSQL 마이그레이션
- **v0.5.0**: 소셜 미디어 4개 플랫폼 API 연동
