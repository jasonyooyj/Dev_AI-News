# AI News Dashboard

AI 뉴스/콘텐츠를 다양한 소스에서 수집하고, AI 요약을 제공하며, 소셜 미디어용 콘텐츠를 생성하는 대시보드.

## Features

- **다중 소스 수집**: RSS, YouTube, X(Twitter), Threads, 블로그
- **AI 요약**: Gemini AI 기반 3줄 핵심 요약
- **소셜 콘텐츠 생성**: 플랫폼별 맞춤 콘텐츠 자동 생성
- **스타일 템플릿**: 나만의 문체로 콘텐츠 작성

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Database**: Neon PostgreSQL + Drizzle ORM
- **AI**: Google Gemini 3 Flash
- **State**: Zustand + TanStack Query

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Supported Sources

| Type | Description |
|------|-------------|
| RSS | RSS 피드 자동 파싱 |
| YouTube | 비디오/채널 콘텐츠 스크래핑 |
| X/Twitter | 트윗/프로필 메타데이터 추출 |
| Threads | 포스트/프로필 스크래핑 |
| Blog | 웹 스크래핑 (CSS 셀렉터 지원) |

## Environment Variables

```env
DATABASE_URL=           # Neon PostgreSQL connection string
GEMINI_API_KEY=         # Google Gemini API key
```

## Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Lint code
```
