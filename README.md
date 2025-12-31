# AI 뉴스 대시보드 (AI News Dashboard)

> AI 뉴스 수집 → AI 요약 → 소셜 미디어 콘텐츠 자동 생성 웹 대시보드

![Version](https://img.shields.io/badge/version-0.9.1-blue?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?style=flat-square&logo=tailwind-css)

## 핵심 워크플로우

```
[뉴스 소스 등록] → [RSS/URL 수집] → [AI 요약] → [플랫폼 선택] → [콘텐츠 생성] → [소셜 게시]
```

## 주요 기능

| 기능 | 설명 |
|------|------|
| **RSS 수집** | 주요 AI 기업 블로그 자동 수집 |
| **URL 스크래핑** | RSS 없는 사이트 본문 추출 |
| **AI 요약** | 3줄 핵심 요약 + 카테고리 자동 분류 |
| **콘텐츠 생성** | 4개 플랫폼별 맞춤 콘텐츠 |
| **스타일 템플릿** | 기존 글 분석으로 스타일 추출 |
| **피드백 재생성** | 피드백 기반 콘텐츠 개선 |

### 소셜 미디어 연동

| 플랫폼 | 상태 | 비용 |
|--------|------|------|
| Bluesky | ✅ AT Protocol 직접 게시 | 무료 |
| Threads | ✅ Meta API 직접 게시 | 무료 |
| LinkedIn | ✅ OAuth2 직접 게시 | 무료 |
| Instagram | ✅ Graph API 직접 게시 | 무료 (Business 계정) |
| Twitter/X | ❌ 미지원 | API 비용 ($100+/월) |

## 기술 스택

### Frontend
- **Next.js 15** - App Router
- **React 19** - 최신 React
- **TypeScript** - 타입 안전성
- **Tailwind CSS 4** - 스타일링
- **Zustand** - 클라이언트 상태 관리
- **TanStack Query** - 서버 상태 관리

### Backend
- **Next.js API Routes** - 서버리스 API
- **Neon PostgreSQL** - 서버리스 데이터베이스
- **Drizzle ORM** - 타입 안전 ORM
- **Gemini AI** - AI 요약/생성 (gemini-3-flash)

## 빠른 시작

```bash
# 1. 클론
git clone https://github.com/jasonyooyj/Dev_AI-News.git
cd Dev_AI-News/my-app

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정 (.env.local)
DATABASE_URL=postgresql://...          # Neon PostgreSQL
GEMINI_API_KEY=...                    # Google Gemini API
BROWSERLESS_TOKEN=...                 # Browserless.io (선택)

# 4. 데이터베이스 설정
npm run db:push

# 5. 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 명령어

```bash
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
npm run test:e2e     # Playwright E2E 테스트
npm run db:push      # DB 스키마 푸시
npm run db:studio    # Drizzle Studio
```

## 프로젝트 구조

```
my-app/
├── app/
│   ├── api/                    # API Routes
│   │   ├── openai/route.ts     # AI 요약/생성
│   │   ├── rss/route.ts        # RSS 파싱
│   │   ├── scrape/route.ts     # URL 스크래핑
│   │   └── social/             # 소셜 미디어 API
│   ├── settings/               # 설정 페이지
│   ├── sources/                # 소스 관리 페이지
│   └── page.tsx                # 메인 대시보드
├── components/                 # React 컴포넌트
├── hooks/                      # Custom Hooks
├── lib/
│   ├── db/                     # Drizzle ORM
│   │   ├── schema.ts           # DB 스키마
│   │   └── queries.ts          # DB 쿼리
│   └── social/                 # 소셜 API 클라이언트
├── store/                      # Zustand 스토어
└── types/                      # TypeScript 타입
```

> 상세 스펙은 [PROJECT_SPEC.md](./PROJECT_SPEC.md) 참조

## 알려진 제한사항

| 제한 | 이유 |
|------|------|
| 단일 사용자 | DEFAULT_USER_ID 기반 공개 모델 |
| 10KB 콘텐츠 제한 | API 페이로드 제한 |
| Twitter/X 미지원 | API 비용 ($100+/월) |

## MCP 설정 (Claude Code)

프로젝트 루트에 `.mcp.json` 파일이 포함되어 있어 Claude Code에서 다음 도구를 사용할 수 있습니다:

| MCP | 용도 |
|-----|------|
| **Firecrawl** | 웹 스크래핑 지원 |
| **Brave Search** | AI 뉴스 검색 |
| **Browser** | 브라우저 자동화 |

사용하려면 환경변수 설정 필요: `FIRECRAWL_API_KEY`, `BRAVE_API_KEY`

## 버전 히스토리

- **v0.9.1** - NewsDetail 모달 레이아웃 개선, MCP 설정 추가
- **v0.9.0** - Gemini AI 전환, YouTube/Twitter/Threads 스크래핑, 우선순위 시스템
- **v0.8.1** - README 문서 전면 개편 및 Firebase 설정 파일 정리
- **v0.8.0** - 인증 제거, 공개 접근 모델
- **v0.7.1** - 버그 수정 (뉴스 중복, 임시 ID 오류)
- **v0.7.0** - Firebase → Neon PostgreSQL 마이그레이션
- **v0.6.0** - E2E 테스트 개선
- **v0.5.0** - 소셜 미디어 4개 플랫폼 API 연동

## 라이선스

MIT License

## 제작자

**jasonyooyj** - [GitHub](https://github.com/jasonyooyj)

---

**Made with AI for AI enthusiasts**
