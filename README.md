# AI 뉴스 대시보드 (AI News Dashboard)

> 최신 AI 기술 뉴스를 수집하고, OpenAI GPT 또는 DeepSeek를 활용하여 한글로 요약 및 소셜 미디어 플랫폼별로 포맷팅하는 웹 애플리케이션

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
- **멀티 AI 프로바이더 지원**: OpenAI GPT-4o-mini 또는 DeepSeek Chat 선택 가능
- **AI 프로바이더 설정**: Settings 페이지에서 원하는 AI 서비스 선택
- **3줄 핵심 요약**: 뉴스 수집 시 자동으로 핵심 포인트 3개 추출
- **카테고리 자동 분류**: product, update, research, announcement 등으로 분류
- 원문 영어 기사를 자연스러운 한글로 번역 및 요약

### 4. 소셜 미디어 포맷팅
각 플랫폼의 특성에 맞춰 자동으로 포맷팅:

- **X (Twitter)**: 280자 이내, 해시태그 1-2개 포함
- **Threads**: 500자 이내, 캐주얼한 톤
- **Instagram**: 이모지 활용, 해시태그 5-10개
- **LinkedIn**: 전문적이고 인사이트 있는 내용

### 5. 스타일 템플릿 관리 (NEW!)
- **AI 기반 문체 분석**: 예시 텍스트를 AI로 분석하여 톤과 특성 자동 추출
- **플랫폼별 맞춤 템플릿**: 각 소셜 미디어 플랫폼에 맞는 문체 템플릿 저장
- **기본 템플릿 설정**: 플랫폼별 기본 템플릿 지정으로 일관성 있는 콘텐츠 생성
- **예시 기반 학습**: 3-5개 예시 텍스트로 사용자 고유의 문체 학습

### 6. 피드백 및 재생성 시스템 (NEW!)
- **즉시 피드백**: 생성된 콘텐츠에 대해 좋아요/싫어요 피드백 제공
- **빠른 피드백 옵션**: "너무 형식적", "더 전문적으로", "해시태그 더 많이" 등 8가지 옵션
- **맞춤 재생성**: 피드백을 반영하여 AI가 콘텐츠 즉시 재생성
- **반복 개선**: 만족할 때까지 피드백과 재생성 반복 가능

### 7. 원클릭 복사 기능
- 플랫폼별로 가공된 컨텐츠를 클릭 한 번으로 클립보드에 복사
- 바로 소셜 미디어에 게시 가능

### 8. 반응형 UI
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
- **DeepSeek API** - OpenAI 호환 DeepSeek Chat 모델 (비용 효율적 대안)
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
# AI 프로바이더 설정 (최소 하나 필수)
OPENAI_API_KEY=your_openai_api_key_here
# 또는
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 기본 프로바이더 설정 (선택사항, 기본값: openai)
AI_PROVIDER=openai  # 또는 deepseek
```

**API 키 발급 방법:**
- OpenAI API 키: [OpenAI Platform](https://platform.openai.com/api-keys)에서 발급
- DeepSeek API 키: [DeepSeek Platform](https://platform.deepseek.com/)에서 발급

**프로바이더 선택 가이드:**
- **OpenAI (GPT-4o-mini)**: 높은 품질, 안정적인 성능, JSON 모드 지원
- **DeepSeek (DeepSeek-Chat)**: 비용 효율적, OpenAI 호환 API, 중국어 강점

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
│   │   └── openai/route.ts        # OpenAI 요약/포맷팅 API (4가지 모드)
│   ├── sources/page.tsx           # 소스 관리 페이지
│   ├── settings/page.tsx          # 설정 페이지 (스타일 템플릿)
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
│   ├── social/                    # 소셜 미디어 컴포넌트
│   │   ├── PlatformPreview.tsx
│   │   ├── CopyButton.tsx
│   │   └── FeedbackButtons.tsx    # 피드백 및 재생성 UI
│   └── settings/                  # 설정 컴포넌트
│       ├── AIProviderSettings.tsx # AI 프로바이더 선택 UI
│       └── StyleEditor.tsx        # 스타일 템플릿 편집기
├── hooks/                         # 커스텀 React Hooks
│   ├── useLocalStorage.ts
│   ├── useSources.ts
│   ├── useNews.ts
│   ├── useOpenAI.ts
│   ├── useAIProvider.ts           # AI 프로바이더 상태 관리
│   └── useStyleTemplates.ts       # 스타일 템플릿 관리
├── lib/                           # 유틸리티 함수
│   ├── storage.ts                 # localStorage CRUD (템플릿 포함)
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
  createdAt: string;
  quickSummary?: QuickSummary;  // NEW: 3줄 요약 및 카테고리
}

interface QuickSummary {
  bullets: string[];              // 핵심 포인트 3개
  category: NewsCategory;         // product | update | research | announcement | other
}
```

### StyleTemplate (스타일 템플릿)
```typescript
interface StyleTemplate {
  id: string;
  platform: Platform;             // twitter | threads | instagram | linkedin
  name: string;                   // 템플릿 이름
  examples: string[];             // 예시 텍스트 배열
  tone?: string;                  // AI 분석된 톤
  characteristics?: string[];     // AI 분석된 특성
  isDefault: boolean;             // 플랫폼 기본 템플릿 여부
  createdAt: string;
  updatedAt: string;
}
```

### PlatformContent (플랫폼별 생성 콘텐츠)
```typescript
interface PlatformContent {
  content: string;                // 생성된 포스트 내용
  charCount: number;              // 글자수
  hashtags?: string[];            // Instagram용 해시태그
}
```

## 기본 제공 뉴스 소스

- **OpenAI Blog** - https://openai.com/blog (RSS 지원)
- **Anthropic News** - https://anthropic.com/news
- **Google AI Blog** - https://blog.google/technology/ai/ (RSS 지원)
- **Meta AI Blog** - https://ai.meta.com/blog/
- **Hugging Face Blog** - https://huggingface.co/blog (RSS 지원)

## API 엔드포인트

### GET /api/openai
AI 프로바이더 상태를 확인합니다.

**Response:**
```json
{
  "providers": {
    "openai": true,
    "deepseek": false
  },
  "defaultProvider": "openai",
  "models": {
    "openai": "gpt-4o-mini",
    "deepseek": "deepseek-chat"
  }
}
```

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
OpenAI 또는 DeepSeek API를 활용한 다양한 AI 처리 기능을 제공합니다. 4가지 모드를 지원합니다.

**공통 파라미터:**
- `provider` (optional): 'openai' | 'deepseek' - 사용할 AI 프로바이더 (미지정 시 환경변수 또는 기본값 사용)

#### Mode 1: summarize (뉴스 요약)
뉴스 수집 시 3줄 핵심 요약 및 카테고리 분류

**Request:**
```json
{
  "mode": "summarize",
  "title": "News Title",
  "content": "News Content",
  "provider": "openai"  // optional
}
```

**Response:**
```json
{
  "bullets": [
    "핵심 포인트 1",
    "핵심 포인트 2",
    "핵심 포인트 3"
  ],
  "category": "product"
}
```

#### Mode 2: generate (플랫폼 콘텐츠 생성)
특정 플랫폼용 콘텐츠를 스타일 템플릿에 맞춰 생성

**Request:**
```json
{
  "mode": "generate",
  "title": "News Title",
  "content": "News Content",
  "platform": "twitter",
  "provider": "deepseek",  // optional
  "styleTemplate": {
    "tone": "전문적이면서 친근한 톤",
    "characteristics": ["이모지 사용", "질문형 시작"],
    "examples": ["예시 텍스트 1", "예시 텍스트 2"]
  },
  "url": "https://..."
}
```

**Response:**
```json
{
  "content": "생성된 포스트 내용",
  "charCount": 280,
  "hashtags": ["AI", "Tech"]  // Instagram만
}
```

#### Mode 3: analyze-style (문체 분석)
예시 텍스트들을 분석하여 문체 특성 추출

**Request:**
```json
{
  "mode": "analyze-style",
  "examples": [
    "예시 텍스트 1",
    "예시 텍스트 2",
    "예시 텍스트 3"
  ],
  "provider": "openai"  // optional
}
```

**Response:**
```json
{
  "tone": "캐주얼하면서도 정보성 있는 톤",
  "characteristics": [
    "이모지 자주 사용",
    "질문으로 시작",
    "해시태그 많이 활용",
    "짧은 문장"
  ]
}
```

#### Mode 4: regenerate (피드백 기반 재생성)
피드백을 반영하여 콘텐츠 재생성

**Request:**
```json
{
  "mode": "regenerate",
  "previousContent": "기존 콘텐츠",
  "feedback": "더 전문적으로. 해시태그 줄이기",
  "platform": "linkedin",
  "provider": "deepseek"  // optional
}
```

**Response:**
```json
{
  "content": "수정된 포스트 내용",
  "charCount": 500
}
```

## 사용 방법

### 1. AI 프로바이더 설정 (선택사항)
1. 상단 메뉴에서 "Settings" 클릭
2. "AI Provider" 섹션에서 원하는 프로바이더 선택
   - OpenAI (GPT-4o-mini): 높은 품질, JSON 모드 지원
   - DeepSeek (DeepSeek-Chat): 비용 효율적, OpenAI 호환
3. 선택한 프로바이더가 자동으로 localStorage에 저장됨
4. 이후 모든 AI 요청에서 선택한 프로바이더가 사용됨

### 2. 뉴스 소스 관리
1. 상단 메뉴에서 "Sources" 클릭
2. "Add New Source" 버튼으로 새 소스 추가
3. 이름, 웹사이트 URL, RSS URL(선택사항) 입력
4. 기존 소스는 편집 또는 비활성화 가능

### 3. 뉴스 수집
#### RSS 피드 자동 수집:
1. 대시보드에서 "Collect News" 탭 선택
2. "Fetch All RSS Sources" 클릭하여 모든 활성 소스에서 뉴스 가져오기
3. 또는 개별 소스 "Fetch" 버튼으로 선택적 수집

#### URL 수동 스크래핑:
1. "Collect News" 탭의 URL Scraper 섹션
2. 뉴스 기사 URL 입력
3. "Scrape" 버튼 클릭하여 내용 추출
4. 미리보기 확인 후 "Save as News" 클릭

### 4. 스타일 템플릿 설정 (선택사항)
1. 상단 메뉴에서 "Settings" 클릭
2. "Add Template" 버튼으로 새 템플릿 생성
3. 플랫폼 선택 (Twitter, Threads, Instagram, LinkedIn)
4. 템플릿 이름 입력
5. 자신의 글쓰기 스타일을 보여주는 예시 텍스트 3-5개 추가
6. "Analyze Style" 버튼 클릭하여 AI가 문체 분석
7. 분석 결과 확인 후 "Create Template" 저장
8. 별 아이콘을 클릭하여 기본 템플릿으로 설정

### 5. AI 가공 및 포맷팅
1. "News Feed" 탭에서 뉴스 카드의 "View Details" 클릭
2. 뉴스 상세 모달에서 원하는 플랫폼 탭 선택
3. (선택사항) 스타일 템플릿 선택
4. "Generate" 버튼 클릭하여 콘텐츠 생성
5. 생성된 콘텐츠 확인
6. 만족하지 않으면:
   - 좋아요/싫어요 버튼으로 피드백 제공
   - 빠른 피드백 옵션 선택 ("너무 형식적", "더 전문적으로" 등)
   - "Regenerate" 버튼으로 피드백 반영하여 재생성
7. 만족하면 "Copy" 버튼으로 클립보드에 복사

### 6. 소셜 미디어 게시
1. 복사된 콘텐츠를 해당 소셜 미디어 앱에 붙여넣기
2. 필요시 추가 편집 후 게시

## 개발 로드맵

### 완료된 기능 (v2.1)
- [x] 멀티 AI 프로바이더 지원 (OpenAI + DeepSeek)
- [x] AI 프로바이더 선택 UI
- [x] 프로바이더별 모델 및 기능 자동 조정
- [x] 3줄 핵심 요약 및 카테고리 자동 분류
- [x] 스타일 템플릿 관리 시스템
- [x] AI 기반 문체 분석
- [x] 피드백 및 재생성 시스템
- [x] 플랫폼별 맞춤 콘텐츠 생성
- [x] Settings 페이지 추가

### 향후 개발 계획
- [ ] 추가 AI 프로바이더 지원 (Claude, Gemini 등)
- [ ] 다크 모드 지원
- [ ] 뉴스 필터링 및 검색 기능 (카테고리, 날짜, 키워드)
- [ ] 즐겨찾기/북마크 기능
- [ ] 자동 스케줄링 (일정 시간마다 자동 수집)
- [ ] 데이터 내보내기/가져오기 (JSON, CSV)
- [ ] 클라우드 동기화 (Firebase, Supabase 등)
- [ ] 다국어 지원 (영어, 일본어 등)
- [ ] 이미지 처리 및 OG 이미지 추출
- [ ] 통계 및 분석 대시보드
- [ ] 멀티 계정 관리
- [ ] 예약 게시 기능

## 문제 해결

### AI API 에러
- `.env.local` 파일에 유효한 API 키가 설정되어 있는지 확인 (OPENAI_API_KEY 또는 DEEPSEEK_API_KEY)
- API 키에 충분한 크레딧이 있는지 확인
- OpenAI API 상태: https://status.openai.com/
- DeepSeek API 상태: https://platform.deepseek.com/
- Settings 페이지에서 사용 가능한 프로바이더 확인
- 특정 프로바이더 문제 발생 시 다른 프로바이더로 전환 시도

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
