# AI News Dashboard - Project Specification

> Version: 0.8.0 | Last Updated: 2025-12-30

## Overview

AI 뉴스를 수집하고, AI로 요약한 뒤, 소셜 미디어용 콘텐츠를 자동 생성하는 웹 대시보드.

### Core Workflow
```
[뉴스 소스 등록] → [RSS/URL 수집] → [AI 요약] → [플랫폼 선택] → [콘텐츠 생성] → [소셜 게시]
```

### Current State
| 항목 | 상태 |
|------|------|
| 인증 | 없음 (공개 접근) |
| 백엔드 | Neon PostgreSQL + Drizzle ORM |
| AI | DeepSeek (deepseek-reasoner) |
| 소셜 연동 | Bluesky, Threads, LinkedIn, Instagram |

---

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4.x
- **State**: Zustand (client), TanStack Query (server)
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle ORM
- **AI**: DeepSeek API (OpenAI-compatible)

### Data Flow
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Zustand    │ ←→  │  API Routes  │ ←→  │    Neon      │
│   Stores     │     │  /api/*      │     │  PostgreSQL  │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Database Schema
- `users` - 사용자 (DEFAULT_USER_ID for public access)
- `sources` - 뉴스 소스 (RSS/URL)
- `news_items` - 수집된 뉴스
- `style_templates` - 플랫폼별 스타일 템플릿
- `social_connections` - 소셜 미디어 연결 정보
- `publish_history` - 게시 이력

---

## Features

### Implemented
| ID | Feature | Description |
|----|---------|-------------|
| F-001 | RSS 수집 | 주요 AI 기업 블로그 자동 수집 |
| F-002 | URL 스크래핑 | RSS 없는 사이트 본문 추출 |
| F-003 | AI 요약 | 3줄 핵심 요약 + 카테고리 분류 |
| F-004 | 콘텐츠 생성 | 4개 플랫폼별 맞춤 콘텐츠 |
| F-005 | 스타일 템플릿 | 기존 글 분석으로 스타일 추출 |
| F-006 | 피드백 재생성 | 피드백 기반 콘텐츠 개선 |
| F-007 | Bluesky 연동 | AT Protocol 직접 게시 |
| F-008 | Threads 연동 | Meta API 직접 게시 |
| F-009 | LinkedIn 연동 | OAuth2 직접 게시 |
| F-010 | Instagram 연동 | Graph API 직접 게시 |

### Planned (Priority Order)
| ID | Feature | Priority |
|----|---------|----------|
| F-101 | 멀티 플랫폼 동시 게시 | P0 |
| F-102 | Freemium 수익화 (Stripe) | P0 |
| F-103 | 콘텐츠 스케줄링 | P1 |
| F-104 | 성과 분석 대시보드 | P1 |
| F-105 | 팀/워크스페이스 | P2 |
| F-106 | Reddit/HN 소스 확장 | P2 |
| F-107 | PWA/모바일 앱 | P3 |
| F-108 | 이미지 자동 생성 | P3 |

---

## Development

### Commands
```bash
cd my-app
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
npm run test:e2e     # Playwright E2E 테스트
npm run db:push      # DB 스키마 푸시
npm run db:studio    # Drizzle Studio
```

### Environment Variables
```env
# Required
DATABASE_URL=postgresql://...          # Neon PostgreSQL
DEEPSEEK_API_KEY=sk-...               # DeepSeek API

# Social APIs (optional)
THREADS_APP_ID=...
THREADS_APP_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
```

---

## File References

상세 정보가 필요할 때 아래 파일들을 참조:

### Core Logic
- `@my-app/lib/db/schema.ts` - DB 스키마 정의
- `@my-app/lib/db/queries.ts` - DB 쿼리 함수
- `@my-app/store/index.ts` - Zustand 스토어
- `@my-app/lib/api.ts` - API 클라이언트

### API Routes
- `@my-app/app/api/openai/route.ts` - AI 요약/생성
- `@my-app/app/api/rss/route.ts` - RSS 파싱
- `@my-app/app/api/social/*/route.ts` - 소셜 게시

### Components
- `@my-app/components/dashboard/Dashboard.tsx` - 메인 대시보드
- `@my-app/components/social/` - 소셜 연동 UI
- `@my-app/components/settings/` - 설정 UI

### Types
- `@my-app/types/news.ts` - 도메인 타입

---

## Design Principles

1. **No Auth**: 공개 접근, DEFAULT_USER_ID 사용
2. **Optimistic Updates**: UI 즉시 반영, 실패 시 롤백
3. **Server Components**: SSR 최적화, `dynamic = 'force-dynamic'`
4. **Type Safety**: TypeScript strict mode

---

## Known Limitations

| 제한 | 이유 |
|------|------|
| 단일 사용자 | DEFAULT_USER_ID 기반 공개 모델 |
| 10KB 콘텐츠 제한 | API 페이로드 제한 |
| Twitter/X 미지원 | API 비용 ($100+/월) |

---

## Changelog

- **v0.8.0** (2025-12-30): 인증 제거, 공개 접근 모델
- **v0.7.1**: 버그 수정
- **v0.7.0**: Firebase → Neon PostgreSQL 마이그레이션
- **v0.6.0**: E2E 테스트 Firebase 인증 통합
- **v0.5.0**: 소셜 미디어 4개 플랫폼 API 연동
