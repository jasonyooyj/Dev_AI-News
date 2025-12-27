# AI 뉴스 대시보드 구현 계획

## 프로젝트 개요
AI 뉴스를 수집하고 소셜 미디어(X, Threads, Instagram, LinkedIn)에 게시할 수 있도록 포맷팅하는 웹 대시보드

## 기술 스택
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4 (이미 설정됨)
- **Backend**: Next.js API Routes
- **Storage**: 브라우저 localStorage
- **AI**: OpenAI API (GPT)

## 핵심 기능
1. **뉴스 소스 관리** - AI 기업 소스 추가/수정/삭제
2. **뉴스 수집** - RSS 자동 수집 + URL 수동 입력
3. **AI 가공** - 한글 요약/번역 + 플랫폼별 포맷팅
4. **복사 게시** - 플랫폼별 복사 버튼으로 간편 게시

---

## 폴더 구조

```
my-app/src/
├── app/
│   ├── page.tsx                 # 메인 대시보드
│   ├── sources/page.tsx         # 소스 관리 페이지
│   └── api/
│       ├── rss/route.ts         # RSS 파싱
│       ├── scrape/route.ts      # URL 스크래핑
│       └── openai/route.ts      # AI 요약/포맷팅
├── components/
│   ├── ui/                      # 공통 UI (Button, Card, Modal 등)
│   ├── layout/                  # Header, Sidebar, MainLayout
│   ├── news/                    # NewsList, NewsCard, NewsDetail
│   ├── sources/                 # SourceList, SourceForm
│   ├── collect/                 # RssFetcher, UrlScraper
│   └── social/                  # PlatformPreview, CopyButton
├── hooks/
│   ├── useLocalStorage.ts
│   ├── useNews.ts
│   ├── useSources.ts
│   └── useOpenAI.ts
├── lib/
│   ├── storage.ts               # localStorage 유틸
│   ├── constants.ts             # 기본 소스, 플랫폼 설정
│   └── openai.ts                # OpenAI 클라이언트
└── types/
    ├── news.ts
    ├── source.ts
    └── platform.ts
```

---

## 데이터 모델

### Source (뉴스 소스)
```ts
interface Source {
  id: string;
  name: string;           // "OpenAI Blog"
  rssUrl?: string;        // RSS 피드 URL
  websiteUrl: string;
  isActive: boolean;
  lastFetchedAt?: string;
}
```

### NewsItem (수집된 뉴스)
```ts
interface NewsItem {
  id: string;
  sourceId: string;
  title: string;
  originalContent: string;
  url: string;
  publishedAt?: string;
  isProcessed: boolean;
}
```

### ProcessedNews (AI 가공 결과)
```ts
interface ProcessedNews {
  id: string;
  newsItemId: string;
  summary: string;        // 한글 요약
  platforms: {
    twitter?: { content: string; charCount: number };
    threads?: { content: string };
    instagram?: { content: string; hashtags: string[] };
    linkedin?: { content: string };
  };
}
```

---

## 기본 소스 (초기 등록)
- OpenAI Blog (https://openai.com/blog)
- Anthropic News (https://anthropic.com/news)
- Google AI Blog (https://blog.google/technology/ai/)
- Meta AI Blog (https://ai.meta.com/blog/)
- Hugging Face Blog (https://huggingface.co/blog)

---

## 구현 순서

### Phase 1: 기반 구조
- [ ] 패키지 설치: `rss-parser`, `cheerio`, `openai`, `uuid`
- [ ] 타입 정의 (`types/`)
- [ ] localStorage 유틸 (`lib/storage.ts`)
- [ ] 공통 UI 컴포넌트 (`components/ui/`)

### Phase 2: 소스 관리
- [ ] `useSources` 훅
- [ ] SourceList, SourceForm 컴포넌트
- [ ] `/sources` 페이지
- [ ] 기본 소스 자동 등록

### Phase 3: 뉴스 수집
- [ ] `/api/rss` - RSS 파싱 API
- [ ] `/api/scrape` - URL 스크래핑 API
- [ ] `useNews` 훅
- [ ] RssFetcher, UrlScraper 컴포넌트

### Phase 4: 대시보드 UI
- [ ] MainLayout, Header, Sidebar
- [ ] NewsList, NewsCard 컴포넌트
- [ ] 메인 페이지 (`page.tsx`)

### Phase 5: AI 가공
- [ ] `/api/openai` - 요약/포맷팅 API
- [ ] `useOpenAI` 훅
- [ ] NewsDetail 모달
- [ ] PlatformPreview, CopyButton 컴포넌트

### Phase 6: 마무리
- [ ] 에러 핸들링
- [ ] 로딩 상태
- [ ] 반응형 디자인

---

## 환경변수 (.env.local)
```
OPENAI_API_KEY=sk-...
```

---

## 주요 파일 (수정/생성 대상)

| 파일 | 설명 |
|------|------|
| `my-app/src/types/news.ts` | 핵심 데이터 타입 |
| `my-app/src/lib/storage.ts` | localStorage CRUD |
| `my-app/src/app/api/openai/route.ts` | AI 요약/포맷팅 |
| `my-app/src/components/news/NewsCard.tsx` | 뉴스 카드 UI |
| `my-app/src/app/page.tsx` | 메인 대시보드 |

