# AI News Dashboard

AI 뉴스/콘텐츠를 다양한 소스에서 수집하고, AI 요약을 제공하며, 소셜 미디어용 콘텐츠와 이미지를 생성하는 대시보드.

## Features

### Content Collection
- **RSS Feeds**: 자동 RSS 피드 파싱 및 콘텐츠 추출
- **YouTube**: 채널 피드 및 비디오 자막/설명 추출 (yt-dlp 기반)
- **X/Twitter**: 트윗 스크래핑 (Browserless 기반)
- **Threads**: 프로필/포스트 스크래핑
- **Blog/Web**: 커스텀 CSS 셀렉터 기반 웹 스크래핑

### AI Processing
- **3줄 요약**: Gemini AI 기반 핵심 요약 및 카테고리 분류
- **번역**: 영문 기사 한국어 번역
- **콘텐츠 생성**: 플랫폼별 맞춤 소셜 미디어 콘텐츠
- **이미지 생성**: AI 뉴스 이미지 생성 + 헤드라인 오버레이
- **헤드라인 제안**: AI 기반 헤드라인 생성 및 대안 제시

### Social Publishing
- **Bluesky**: App Password 기반 연동
- **Threads**: OAuth 기반 포스팅
- **LinkedIn**: OAuth 기반 포스팅 (아티클 링크 지원)
- **Instagram**: OAuth 기반 이미지 포스팅

### UI/UX
- **다크 모드**: 라이트/다크/시스템 테마
- **반응형 디자인**: 모바일/태블릿/데스크톱 지원
- **이미지 갤러리**: 생성된 이미지 로컬 저장 및 관리
- **실시간 미리보기**: 플랫폼별 콘텐츠 미리보기

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4.x, Framer Motion |
| **State** | Zustand (client), TanStack Query (server) |
| **Database** | Neon PostgreSQL (serverless) + Drizzle ORM |
| **AI** | Google Gemini (`gemini-3-flash-preview`, `gemini-3-pro-image-preview`) |
| **Scraping** | Browserless.io (Playwright 원격 브라우저) |
| **Image** | Sharp (이미지 프로세싱) |

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

## Source Types

| Type | Description | Method |
|------|-------------|--------|
| `rss` | RSS 피드 자동 파싱 | rss-parser |
| `youtube` | 비디오/채널 콘텐츠 | yt-dlp + RSS |
| `twitter` | 트윗/프로필 스크래핑 | Browserless |
| `threads` | 포스트/프로필 스크래핑 | Browserless |
| `blog` | 웹 스크래핑 (CSS 셀렉터) | Cheerio |

## API Endpoints

### AI Processing
- `POST /api/ai` - 요약, 콘텐츠 생성, 재생성, 번역
- `POST /api/headline` - AI 헤드라인 생성
- `POST /api/image` - AI 이미지 생성

### Content Collection
- `POST /api/rss` - RSS 피드 파싱
- `POST /api/scrape` - 단일 URL 스크래핑
- `POST /api/scrape-source` - 소스 웹사이트 스크래핑
- `POST /api/youtube/channel` - YouTube 채널 피드
- `POST /api/scrape/threads/profile` - Threads 프로필 스크래핑

### Social Publishing
- `POST /api/social/bluesky/*` - Bluesky 연동
- `POST /api/social/threads/*` - Threads OAuth + 포스팅
- `POST /api/social/linkedin/*` - LinkedIn OAuth + 포스팅
- `POST /api/social/instagram/*` - Instagram OAuth + 포스팅

### Data Management
- `/api/news/*` - 뉴스 아이템 CRUD
- `/api/sources/*` - 소스 CRUD
- `/api/templates/*` - 스타일 템플릿 CRUD
- `/api/social/connections` - 소셜 연결 관리

## Environment Variables

```env
# Required
DATABASE_URL=           # Neon PostgreSQL connection string
GEMINI_API_KEY=         # Google Gemini API key

# Scraping (for Twitter/Threads)
BROWSERLESS_TOKEN=      # Browserless.io token

# Social APIs (optional)
THREADS_APP_ID=
THREADS_APP_SECRET=
THREADS_REDIRECT_URI=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
INSTAGRAM_REDIRECT_URI=
```

## Scripts

```bash
npm run dev       # Development server (localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Lint code
```

## Project Structure

```
my-app/
├── app/
│   ├── api/           # API routes
│   └── page.tsx       # Main dashboard
├── components/
│   ├── dashboard/     # Dashboard orchestrator
│   ├── news/          # News cards, detail, image generator
│   ├── social/        # Publishing buttons, previews
│   ├── collect/       # Content fetcher
│   └── ui/            # Reusable UI components
├── hooks/             # Custom React hooks
├── lib/
│   ├── db/            # Drizzle ORM schema & queries
│   ├── social/        # Social API clients
│   └── gemini.ts      # AI integration
├── store/             # Zustand stores
└── types/             # TypeScript types
```

## Version

Current: **v0.9.2**
