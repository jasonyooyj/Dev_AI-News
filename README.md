# AI 뉴스 대시보드 (AI News Dashboard)

> 최신 AI 기술 뉴스를 수집하고, OpenAI GPT를 활용하여 한글로 요약 및 소셜 미디어 플랫폼별로 포맷팅하는 웹 애플리케이션

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.3-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?style=flat-square&logo=tailwind-css)

## 주요 기능

### 1. 뉴스 소스 관리
- OpenAI, Google AI, Hugging Face 등 주요 AI 기업의 블로그를 기본 소스로 제공
- 사용자 정의 뉴스 소스 추가/수정/삭제
- RSS 피드 URL 지원
- 소스별 활성화/비활성화 관리

### 2. 자동 뉴스 수집
- **RSS 피드 자동 수집**: 등록된 소스의 RSS 피드에서 최신 뉴스 자동 파싱
- **URL 수동 스크래핑**: 개별 URL 입력으로 웹 페이지 내용 추출
- 중복 뉴스 자동 필터링
- localStorage 기반 로컬 데이터 저장

### 3. AI 기반 컨텐츠 가공
- **OpenAI GPT-4o-mini** 모델을 활용한 지능형 요약
- 원문 영어 기사를 자연스러운 한글로 번역 및 요약
- 핵심 정보 추출 및 전문적인 톤 유지

### 4. 소셜 미디어 포맷팅
각 플랫폼의 특성에 맞춰 자동으로 포맷팅:

- **X (Twitter)**: 280자 이내, 해시태그 1-2개 포함
- **Threads**: 500자 이내, 캐주얼한 톤
- **Instagram**: 이모지 활용, 해시태그 5-10개
- **LinkedIn**: 전문적이고 인사이트 있는 내용

### 5. 원클릭 복사 기능
- 플랫폼별로 가공된 컨텐츠를 클릭 한 번으로 클립보드에 복사
- 바로 소셜 미디어에 게시 가능

### 6. 반응형 UI
- 데스크톱, 태블릿, 모바일 모든 화면에 최적화
- 직관적인 대시보드 인터페이스
- 실시간 처리 상태 표시

## 기술 스택

### Frontend
- **Next.js 16** - React 기반 풀스택 프레임워크 (App Router)
- **React 19** - 최신 React 컴포넌트 라이브러리
- **TypeScript** - 타입 안전성 보장
- **Tailwind CSS 4** - 유틸리티 기반 스타일링
- **Lucide React** - 아이콘 라이브러리

### Backend & API
- **Next.js API Routes** - 서버리스 API 엔드포인트
- **OpenAI API** - GPT-4o-mini 모델 활용
- **RSS Parser** - RSS 피드 파싱
- **Cheerio** - HTML 스크래핑 및 파싱

### Data Storage
- **localStorage** - 브라우저 로컬 저장소 활용
- 서버 없이 클라이언트 측에서 모든 데이터 관리

## 설치 및 실행

### 1. 사전 요구사항
- Node.js 20.x 이상
- npm 또는 yarn, pnpm

### 2. 저장소 클론
```bash
git clone https://github.com/basqu/Dev_AI-News.git
cd Dev_AI-News/my-app
```

### 3. 의존성 설치
```bash
npm install
# 또는
yarn install
# 또는
pnpm install
```

### 4. 환경 변수 설정
루트 디렉토리에 `.env.local` 파일 생성:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

OpenAI API 키는 [OpenAI Platform](https://platform.openai.com/api-keys)에서 발급받을 수 있습니다.

### 5. 개발 서버 실행
```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 6. 프로덕션 빌드
```bash
npm run build
npm start
```

## 프로젝트 구조

```
my-app/
├── app/
│   ├── api/
│   │   ├── rss/route.ts          # RSS 피드 파싱 API
│   │   ├── scrape/route.ts        # URL 스크래핑 API
│   │   └── openai/route.ts        # OpenAI 요약/포맷팅 API
│   ├── sources/page.tsx           # 소스 관리 페이지
│   ├── layout.tsx                 # 루트 레이아웃
│   └── page.tsx                   # 메인 대시보드
├── components/
│   ├── ui/                        # 공통 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── Spinner.tsx
│   ├── layout/                    # 레이아웃 컴포넌트
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   ├── news/                      # 뉴스 관련 컴포넌트
│   │   ├── NewsList.tsx
│   │   ├── NewsCard.tsx
│   │   └── NewsDetail.tsx
│   ├── sources/                   # 소스 관리 컴포넌트
│   │   ├── SourceList.tsx
│   │   └── SourceForm.tsx
│   ├── collect/                   # 뉴스 수집 컴포넌트
│   │   ├── RssFetcher.tsx
│   │   └── UrlScraper.tsx
│   └── social/                    # 소셜 미디어 컴포넌트
│       ├── PlatformPreview.tsx
│       └── CopyButton.tsx
├── hooks/                         # 커스텀 React Hooks
│   ├── useLocalStorage.ts
│   ├── useSources.ts
│   ├── useNews.ts
│   └── useOpenAI.ts
├── lib/                           # 유틸리티 함수
│   ├── storage.ts                 # localStorage CRUD
│   └── constants.ts               # 상수 및 기본값
├── types/
│   └── news.ts                    # TypeScript 타입 정의
└── public/                        # 정적 파일
```

## 데이터 모델

### Source (뉴스 소스)
```typescript
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
```typescript
interface NewsItem {
  id: string;
  sourceId: string;
  title: string;
  originalContent: string;
  url: string;
  publishedAt?: string;
  isProcessed: boolean;
  createdAt: string;
}
```

### ProcessedNews (AI 가공 결과)
```typescript
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
  createdAt: string;
}
```

## 기본 제공 뉴스 소스

- **OpenAI Blog** - https://openai.com/blog (RSS 지원)
- **Anthropic News** - https://anthropic.com/news
- **Google AI Blog** - https://blog.google/technology/ai/ (RSS 지원)
- **Meta AI Blog** - https://ai.meta.com/blog/
- **Hugging Face Blog** - https://huggingface.co/blog (RSS 지원)

## API 엔드포인트

### POST /api/rss
RSS 피드에서 뉴스 목록을 가져옵니다.

**Request:**
```json
{
  "url": "https://openai.com/blog/rss.xml"
}
```

**Response:**
```json
{
  "title": "OpenAI Blog",
  "description": "...",
  "items": [
    {
      "title": "...",
      "link": "...",
      "pubDate": "...",
      "content": "..."
    }
  ]
}
```

### POST /api/scrape
지정된 URL의 웹 페이지 내용을 스크래핑합니다.

**Request:**
```json
{
  "url": "https://example.com/article"
}
```

**Response:**
```json
{
  "title": "Article Title",
  "content": "...",
  "description": "...",
  "url": "..."
}
```

### POST /api/openai
뉴스 내용을 AI로 요약하고 소셜 미디어 포맷으로 변환합니다.

**Request:**
```json
{
  "title": "News Title",
  "content": "News Content",
  "url": "https://..."
}
```

**Response:**
```json
{
  "summary": "한글 요약",
  "platforms": {
    "twitter": { "content": "...", "charCount": 280 },
    "threads": { "content": "..." },
    "instagram": { "content": "...", "hashtags": ["AI", "Tech"] },
    "linkedin": { "content": "..." }
  }
}
```

## 사용 방법

### 1. 뉴스 소스 관리
1. 상단 메뉴에서 "Sources" 클릭
2. "Add New Source" 버튼으로 새 소스 추가
3. 이름, 웹사이트 URL, RSS URL(선택사항) 입력
4. 기존 소스는 편집 또는 비활성화 가능

### 2. 뉴스 수집
#### RSS 피드 자동 수집:
1. 대시보드에서 "Collect News" 탭 선택
2. "Fetch All RSS Sources" 클릭하여 모든 활성 소스에서 뉴스 가져오기
3. 또는 개별 소스 "Fetch" 버튼으로 선택적 수집

#### URL 수동 스크래핑:
1. "Collect News" 탭의 URL Scraper 섹션
2. 뉴스 기사 URL 입력
3. "Scrape" 버튼 클릭하여 내용 추출
4. 미리보기 확인 후 "Save as News" 클릭

### 3. AI 가공 및 포맷팅
1. "News Feed" 탭에서 처리할 뉴스 선택
2. "Process with AI" 버튼 클릭
3. 자동으로 한글 요약 및 4개 플랫폼용 컨텐츠 생성
4. 각 플랫폼 탭에서 내용 확인
5. "Copy" 버튼으로 클립보드에 복사

### 4. 소셜 미디어 게시
1. 처리된 뉴스의 "View Details" 클릭
2. 원하는 플랫폼 탭 선택 (Twitter, Threads, Instagram, LinkedIn)
3. "Copy" 버튼으로 포맷팅된 내용 복사
4. 해당 소셜 미디어 앱에 붙여넣기 및 게시

## 개발 로드맵

- [ ] 다크 모드 지원
- [ ] 뉴스 필터링 및 검색 기능
- [ ] 즐겨찾기/북마크 기능
- [ ] 자동 스케줄링 (일정 시간마다 자동 수집)
- [ ] 데이터 내보내기/가져오기 (JSON, CSV)
- [ ] 클라우드 동기화 (Firebase, Supabase 등)
- [ ] 다국어 지원 (영어, 일본어 등)
- [ ] 이미지 처리 및 OG 이미지 추출
- [ ] 통계 및 분석 대시보드

## 문제 해결

### OpenAI API 에러
- `.env.local` 파일에 유효한 API 키가 설정되어 있는지 확인
- API 키에 충분한 크레딧이 있는지 확인
- OpenAI API 상태 페이지 확인: https://status.openai.com/

### RSS 피드 파싱 실패
- RSS URL이 올바른지 확인
- CORS 정책으로 인해 일부 피드는 접근 불가능할 수 있음
- 네트워크 연결 상태 확인

### 웹 스크래핑 실패
- 대상 웹사이트의 구조가 복잡하거나 동적 렌더링을 사용하는 경우 실패할 수 있음
- 일부 사이트는 스크래핑을 차단할 수 있음
- 해당 경우 수동으로 내용을 복사하여 추가 가능

## 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

## 기여

이슈 제보 및 Pull Request를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 제작자

**basqu** - [GitHub](https://github.com/basqu)

## 감사의 말

- [Next.js](https://nextjs.org/) - React 프레임워크
- [OpenAI](https://openai.com/) - GPT API
- [Tailwind CSS](https://tailwindcss.com/) - CSS 프레임워크
- [Lucide](https://lucide.dev/) - 아이콘 라이브러리

---

**Made with ❤️ for AI enthusiasts**
