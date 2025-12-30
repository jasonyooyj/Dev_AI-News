# CLAUDE.md

> AI 어시스턴트를 위한 최소 가이드. 상세 정보는 `PROJECT_SPEC.md` 참조.

## Quick Start

```bash
cd my-app && npm run dev    # localhost:3000
npm run build               # 빌드
```

## Project Context

- **What**: AI 뉴스 수집 → AI 요약 → 소셜 미디어 콘텐츠 생성 대시보드
- **Version**: 0.9.1
- **Auth**: 없음 (공개 접근, DEFAULT_USER_ID 사용)
- **Stack**: Next.js 15 + Neon PostgreSQL + Gemini AI

## Source Types

| Type | 설명 |
|------|------|
| rss | RSS 피드 파싱 |
| youtube | YouTube 비디오/채널 |
| twitter | X/Twitter 포스트/프로필 |
| threads | Threads 포스트/프로필 |
| blog | 웹 스크래핑 |

## Key Files

| 목적 | 파일 |
|------|------|
| 전체 스펙 | `PROJECT_SPEC.md` |
| DB 스키마 | `my-app/lib/db/schema.ts` |
| API 라우트 | `my-app/app/api/` |
| 소셜 스크래핑 | `my-app/app/api/scrape-social/route.ts` |
| 스토어 | `my-app/store/index.ts` |
| 타입 | `my-app/types/news.ts` |
