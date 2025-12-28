# AI 뉴스 대시보드 (AI News Dashboard)

> 최신 AI 기술 뉴스를 수집하고, DeepSeek AI를 활용하여 한글로 요약 및 소셜 미디어 플랫폼별로 포맷팅하는 웹 애플리케이션

![Version](https://img.shields.io/badge/version-0.4.0-blue?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.3-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?style=flat-square&logo=tailwind-css)

## 주요 기능

### 1. Firebase 기반 인증 및 데이터 동기화 (NEW!)
- **Google 소셜 로그인**: 구글 계정으로 간편 로그인
- **이메일/비밀번호 인증**: 전통적인 회원가입 및 로그인
- **실시간 데이터 동기화**: Firestore를 통한 모든 디바이스 간 실시간 동기화
- **오프라인 지원**: IndexedDB 캐싱으로 오프라인에서도 데이터 접근
- **자동 마이그레이션**: 기존 localStorage 데이터를 Firestore로 자동 이전
- **보호된 라우트**: 인증된 사용자만 대시보드 및 소스 페이지 접근 가능

### 2. 뉴스 소스 관리
- OpenAI, Google AI, Hugging Face 등 주요 AI 기업의 블로그를 기본 소스로 제공
- **추가 소스**: DeepMind, NVIDIA, Microsoft, AWS, MIT Tech Review, The Verge, VentureBeat, The Decoder
- 사용자 정의 뉴스 소스 추가/수정/삭제
- RSS 피드 URL 지원
- 소스별 활성화/비활성화 관리
- **중복 소스 자동 감지 및 제거**: 동일한 URL의 소스 방지

### 3. 자동 뉴스 수집 (개선!)
- **RSS 피드 자동 수집**:
  - 등록된 소스의 RSS 피드에서 최신 뉴스 자동 파싱
  - description, summary, content:encoded 등 다중 필드 지원
  - HTML 태그 자동 제거 및 텍스트 정리
- **웹 스크래핑 자동화**:
  - RSS가 없는 소스도 자동으로 기사 목록 추출
  - 8초 타임아웃으로 속도 개선
- **봇 디텍션 우회**: User-Agent 로테이션 및 브라우저 핑거프린트 매칭으로 안정적인 스크래핑
- **URL 수동 스크래핑**: 개별 URL 입력으로 웹 페이지 내용 추출
- 중복 뉴스 자동 필터링
- Firestore 기반 클라우드 데이터 저장 및 동기화

### 4. AI 기반 컨텐츠 가공 (개선!)
- **DeepSeek AI 통합**: DeepSeek Chat 모델로 안정적인 요약 및 콘텐츠 생성
- **3줄 핵심 요약**: 뉴스 수집 시 자동으로 핵심 포인트 3개 추출 (배치 병렬 처리로 속도 개선)
- **Pending 상태 해결**: JSON 추출 개선 및 예외 처리 강화로 "Processing..." 무한 로딩 방지
- **Full Article 탭**:
  - 원문 자동 스크래핑 후 한국어로 번역 (원문 충실 번역, 요약 금지)
  - Notion 스타일 마크다운 렌더링 (react-markdown + remark-gfm)
  - 캐싱으로 중복 fetch 방지 (hasFetchedRef)
- **카테고리 자동 분류**: product, update, research, announcement 등으로 분류
- 원문 영어 기사를 자연스러운 한글로 번역 및 요약

### 5. 소셜 미디어 포맷팅
각 플랫폼의 특성에 맞춰 자동으로 포맷팅:

- **X (Twitter)**: 280자 이내, 해시태그 1-2개 포함
- **Threads**: 500자 이내, 캐주얼한 톤
- **Instagram**: 이모지 활용, 해시태그 5-10개
- **LinkedIn**: 전문적이고 인사이트 있는 내용

### 6. 스타일 템플릿 관리
- **AI 기반 문체 분석**: 예시 텍스트를 AI로 분석하여 톤과 특성 자동 추출
- **플랫폼별 맞춤 템플릿**: 각 소셜 미디어 플랫폼에 맞는 문체 템플릿 저장
- **기본 템플릿 설정**: 플랫폼별 기본 템플릿 지정으로 일관성 있는 콘텐츠 생성
- **예시 기반 학습**: 3-5개 예시 텍스트로 사용자 고유의 문체 학습
- Firestore에 저장되어 모든 디바이스에서 동일한 템플릿 사용 가능

### 7. 피드백 및 재생성 시스템
- **즉시 피드백**: 생성된 콘텐츠에 대해 좋아요/싫어요 피드백 제공
- **빠른 피드백 옵션**: "너무 형식적", "더 전문적으로", "해시태그 더 많이" 등 8가지 옵션
- **맞춤 재생성**: 피드백을 반영하여 AI가 콘텐츠 즉시 재생성
- **반복 개선**: 만족할 때까지 피드백과 재생성 반복 가능

### 8. 북마크 기능
- **즉시 북마크**: 뉴스 카드와 상세 모달에서 클릭 한 번으로 북마크 토글
- **빠른 필터링**: "Bookmarked" 필터로 중요한 뉴스만 조회
- **시각적 표시**: 북마크된 뉴스는 amber 색상 아이콘으로 표시
- **자동 저장**: Firestore에 즉시 저장되어 모든 디바이스에서 동기화
- **즉각 피드백**: Toast 알림으로 북마크 추가/제거 확인

### 9. 원클릭 복사 기능
- 플랫폼별로 가공된 컨텐츠를 클릭 한 번으로 클립보드에 복사
- 바로 소셜 미디어에 게시 가능

### 10. 다크 모드 지원 (개선!)
- 라이트/다크 테마 토글 기능
- 시스템 다크모드 자동 감지
- FOUC(Flash of Unstyled Content) 방지
- **부드러운 전환**: border-color 충돌 해결 및 200ms 애니메이션 최적화
- 아이콘 회전 및 스케일 효과

### 11. 반응형 UI (개선!)
- 데스크톱, 태블릿, 모바일 모든 화면에 최적화
- **사이드바 개선**: sources prop 전달로 실시간 소스 목록 표시
- **News Sources 레이아웃 개선**: Add Source 버튼을 헤더 우측으로 이동
- **모달 애니메이션 개선**: backdrop-blur 제거로 렉 현상 해결
- 직관적인 대시보드 인터페이스
- 실시간 처리 상태 표시

## 기술 스택

### Frontend
- **Next.js 16** - React 기반 풀스택 프레임워크 (App Router)
- **React 19** - 최신 React 컴포넌트 라이브러리
- **TypeScript** - 타입 안전성 보장
- **Tailwind CSS 4** - 유틸리티 기반 스타일링
- **Lucide React** - 아이콘 라이브러리
- **TanStack Query** - 서버 상태 관리 및 데이터 페칭
- **Zustand** - 클라이언트 상태 관리
- **React Hook Form** - 폼 상태 관리 및 유효성 검사
- **Zod** - 스키마 기반 타입 안전 유효성 검사
- **date-fns** - 날짜/시간 포맷팅 및 유틸리티
- **Sonner** - 토스트 알림 UI
- **react-markdown** - 마크다운 렌더링
- **remark-gfm** - GitHub Flavored Markdown 지원

### Backend & API
- **Next.js API Routes** - 서버리스 API 엔드포인트
- **DeepSeek API** - DeepSeek Reasoner 모델 (추론 특화, 비용 효율적)
- **RSS Parser** - RSS 피드 파싱
- **Cheerio** - HTML 스크래핑 및 파싱
- **Firebase 12.7.0** - 인증 및 데이터베이스

### Data Storage & Auth
- **Firebase Authentication** - Google OAuth 및 이메일/비밀번호 인증
- **Cloud Firestore** - NoSQL 클라우드 데이터베이스, 실시간 동기화
- **Firestore Offline Persistence** - IndexedDB를 통한 오프라인 캐싱
- **Security Rules** - 사용자별 데이터 격리 및 보안 규칙

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
# DeepSeek API 키 (필수)
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Firebase 설정 (필수)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# 선택사항: Firebase Emulator 사용 (개발 환경)
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

**API 키 및 Firebase 설정 방법:**

1. **DeepSeek API 키**: [DeepSeek Platform](https://platform.deepseek.com/)에서 발급
   - **비용 효율성**: GPT 대비 저렴한 API 비용
   - **추론 특화**: deepseek-reasoner 모델로 요약/분석에 최적화
   - **OpenAI 호환**: 기존 OpenAI SDK 그대로 사용 가능

2. **Firebase 프로젝트 설정**: [Firebase Console](https://console.firebase.google.com/)
   - 새 프로젝트 생성 또는 기존 프로젝트 선택
   - 프로젝트 설정 > 일반 탭에서 웹 앱 추가
   - Firebase SDK 설정 정보를 `.env.local`에 복사
   - Authentication > Sign-in method에서 Google 및 이메일/비밀번호 활성화
   - Firestore Database 생성 (테스트 모드 또는 프로덕션 모드)
   - `firestore.rules` 파일을 Firebase Console에 배포 (보안 규칙)

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
│   │   ├── rss/route.ts           # RSS 피드 파싱 API
│   │   ├── scrape/route.ts        # URL 스크래핑 API
│   │   └── openai/route.ts        # OpenAI 요약/포맷팅 API (5가지 모드)
│   ├── login/page.tsx             # 로그인 페이지
│   ├── signup/page.tsx            # 회원가입 페이지
│   ├── sources/page.tsx           # 소스 관리 페이지 (보호됨)
│   ├── settings/page.tsx          # 설정 페이지 (스타일 템플릿)
│   ├── layout.tsx                 # 루트 레이아웃
│   └── page.tsx                   # 메인 대시보드 (보호됨)
├── components/
│   ├── ui/                        # 공통 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── Spinner.tsx
│   ├── layout/                    # 레이아웃 컴포넌트
│   │   ├── Header.tsx             # 사용자 메뉴 포함
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   ├── auth/                      # 인증 컴포넌트 (NEW!)
│   │   ├── AuthProvider.tsx       # Firebase 인증 Context
│   │   ├── ProtectedRoute.tsx     # 라우트 보호 HOC
│   │   ├── LoginForm.tsx          # 로그인 폼
│   │   └── SignupForm.tsx         # 회원가입 폼
│   ├── migration/                 # 데이터 마이그레이션 (NEW!)
│   │   └── MigrationDialog.tsx    # localStorage → Firestore 마이그레이션 UI
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
│   │   └── FeedbackButtons.tsx
│   ├── settings/                  # 설정 컴포넌트
│   │   └── StyleEditor.tsx
│   └── FirestoreSyncProvider.tsx  # Firestore 실시간 동기화 Provider
├── hooks/                         # 커스텀 React Hooks
│   ├── useAuth.ts                 # Firebase 인증 hook (NEW!)
│   ├── useFirestoreSync.ts        # Firestore 리스너 관리 (NEW!)
│   ├── useMigration.ts            # 데이터 마이그레이션 hook (NEW!)
│   ├── useSources.ts
│   ├── useNews.ts
│   ├── useOpenAI.ts
│   ├── useStyleTemplates.ts
│   └── queries.ts                 # TanStack Query mutations
├── lib/
│   ├── firebase/                  # Firebase 통합 (NEW!)
│   │   ├── config.ts              # Firebase 초기화 및 설정
│   │   ├── auth.ts                # 인증 함수 (Google, 이메일)
│   │   ├── firestore.ts           # Firestore CRUD 및 실시간 리스너
│   │   ├── converters.ts          # Firestore 데이터 변환기
│   │   └── index.ts               # 통합 export
│   ├── constants.ts               # 상수 및 기본값 (8개 추가 소스)
│   ├── providers.tsx              # AuthProvider + FirestoreSyncProvider 추가
│   ├── api.ts                     # 타입 안전 API 클라이언트
│   ├── date.ts                    # date-fns 유틸리티
│   └── validations.ts             # Zod 스키마 및 폼 검증
├── store/                         # Zustand 상태 관리 (Firestore 통합)
│   └── index.ts                   # News, Sources, StyleTemplates 스토어 (실시간 동기화)
├── types/
│   └── news.ts                    # TypeScript 타입 정의
├── firestore.rules                # Firestore 보안 규칙 (NEW!)
├── firestore.indexes.json         # Firestore 인덱스 설정 (NEW!)
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

## 기본 제공 뉴스 소스 (13개)

- **OpenAI Blog** - https://openai.com/blog (RSS 지원)
- **Anthropic News** - https://anthropic.com/news
- **Google AI Blog** - https://blog.google/technology/ai/ (RSS 지원)
- **Meta AI Blog** - https://ai.meta.com/blog/
- **Hugging Face Blog** - https://huggingface.co/blog (RSS 지원)
- **DeepMind Blog** - https://deepmind.google/discover/blog/ (RSS 지원)
- **NVIDIA AI Blog** - https://blogs.nvidia.com/blog/category/deep-learning/ (RSS 지원)
- **Microsoft AI Blog** - https://blogs.microsoft.com/ai/ (RSS 지원)
- **AWS Machine Learning Blog** - https://aws.amazon.com/blogs/machine-learning/ (RSS 지원)
- **MIT Technology Review AI** - https://www.technologyreview.com/topic/artificial-intelligence/ (RSS 지원)
- **The Verge AI** - https://www.theverge.com/ai-artificial-intelligence (RSS 지원)
- **VentureBeat AI** - https://venturebeat.com/category/ai/ (RSS 지원)
- **The Decoder** - https://the-decoder.com/ (RSS 지원)

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

### POST /api/scrape-source
웹사이트에서 기사 목록을 자동으로 스크래핑합니다 (RSS 없는 소스용).

**Request:**
```json
{
  "url": "https://anthropic.com/news",
  "scrapeConfig": {
    "articleSelector": "article",
    "titleSelector": "h2",
    "linkSelector": "a[href]",
    "descriptionSelector": "p",
    "dateSelector": "time"
  }
}
```

**Response:**
```json
{
  "articles": [
    {
      "title": "Article Title",
      "link": "https://...",
      "description": "...",
      "pubDate": "2025-01-15"
    }
  ],
  "count": 10,
  "url": "https://anthropic.com/news"
}
```

### POST /api/openai
DeepSeek API를 활용한 다양한 AI 처리 기능을 제공합니다. 5가지 모드를 지원합니다.

#### Mode 1: summarize (뉴스 요약)
뉴스 수집 시 3줄 핵심 요약 및 카테고리 분류

**Request:**
```json
{
  "mode": "summarize",
  "title": "News Title",
  "content": "News Content"
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
  ]
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
  "platform": "linkedin"
}
```

**Response:**
```json
{
  "content": "수정된 포스트 내용",
  "charCount": 500
}
```

#### Mode 5: translate (기사 번역 및 포맷팅) (NEW!)
영어 원문을 한국어로 번역하고 읽기 좋게 포맷팅

**Request:**
```json
{
  "mode": "translate",
  "title": "Article Title",
  "content": "Full article content in English..."
}
```

**Response:**
```json
{
  "title": "Article Title",
  "content": "한국어로 번역되고 포맷팅된 기사 내용...",
  "isTranslated": true
}
```

## 사용 방법

### 0. 회원가입 및 로그인
1. 앱 접속 시 로그인 페이지로 리다이렉트
2. **Google 계정으로 로그인** 또는 **이메일/비밀번호로 회원가입**
3. 로그인 성공 시 자동으로 대시보드로 이동
4. **기존 localStorage 데이터가 있는 경우**: 마이그레이션 다이얼로그 표시
   - "Migrate Now" 클릭 시 자동으로 Firestore로 데이터 이전
   - "Skip" 또는 "Maybe Later" 선택 시 마이그레이션 건너뛰기

### 1. 뉴스 소스 관리
1. 상단 메뉴에서 "Sources" 클릭
2. "Add New Source" 버튼으로 새 소스 추가
3. 이름, 웹사이트 URL, RSS URL(선택사항) 입력
4. 기존 소스는 편집 또는 비활성화 가능
5. **중복 소스 감지**: 동일한 URL의 소스가 있으면 경고 표시 및 "Remove Duplicates" 버튼으로 제거

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

### 3. 스타일 템플릿 설정 (선택사항)
1. 상단 메뉴에서 "Settings" 클릭
2. "Add Template" 버튼으로 새 템플릿 생성
3. 플랫폼 선택 (Twitter, Threads, Instagram, LinkedIn)
4. 템플릿 이름 입력
5. 자신의 글쓰기 스타일을 보여주는 예시 텍스트 3-5개 추가
6. "Analyze Style" 버튼 클릭하여 AI가 문체 분석
7. 분석 결과 확인 후 "Create Template" 저장
8. 별 아이콘을 클릭하여 기본 템플릿으로 설정

### 4. AI 가공 및 포맷팅
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

### 5. 소셜 미디어 게시
1. 복사된 콘텐츠를 해당 소셜 미디어 앱에 붙여넣기
2. 필요시 추가 편집 후 게시

## 개발 로드맵

### 완료된 기능 (v0.4.0) - Firebase 통합
- [x] **Firebase Authentication 통합**
  - Google 소셜 로그인
  - 이메일/비밀번호 회원가입 및 로그인
  - 비밀번호 재설정 (이메일)
  - 사용자 프로필 관리
- [x] **Cloud Firestore 데이터베이스 통합**
  - 뉴스 아이템, 소스, 스타일 템플릿 Firestore 저장
  - 실시간 데이터 동기화 (onSnapshot)
  - 사용자별 데이터 격리 (users/{userId}/...)
  - Optimistic UI 업데이트 (낙관적 업데이트 + 롤백)
- [x] **Firestore 오프라인 지원**
  - IndexedDB를 통한 로컬 캐싱
  - 오프라인 모드에서 데이터 읽기/쓰기 가능
  - 온라인 복귀 시 자동 동기화
- [x] **localStorage → Firestore 자동 마이그레이션**
  - 기존 데이터 감지 및 마이그레이션 UI
  - 배치 처리로 효율적인 대량 데이터 이전
  - 진행 상태 표시 및 에러 핸들링
- [x] **보안 규칙 및 데이터 검증**
  - Firestore Security Rules (users/{userId} 격리)
  - 필수 필드 및 타입 검증
  - 소유자만 CRUD 가능
- [x] **보호된 라우트 (ProtectedRoute)**
  - 인증되지 않은 사용자 자동 리다이렉트
  - 대시보드 및 소스 페이지 보호
- [x] **사용자 메뉴 및 프로필**
  - 헤더에 사용자 아바타 및 이름 표시
  - 드롭다운 메뉴 (Sign Out)
  - 프로필 사진 자동 표시 (Google 로그인 시)
- [x] **중복 소스 방지 및 제거 기능**
  - 소스 추가 시 URL 중복 체크
  - 기존 중복 소스 자동 감지
  - "Remove Duplicates" 버튼으로 일괄 삭제
- [x] **기본 소스 8개 추가**
  - DeepMind, NVIDIA, Microsoft, AWS ML Blog
  - MIT Tech Review, The Verge, VentureBeat, The Decoder
- [x] **Zustand 스토어 Firestore 통합**
  - localStorage persist 제거
  - Firestore 실시간 리스너로 자동 업데이트
  - 모든 CRUD 액션을 Firestore API로 변경

### 완료된 기능 (v0.3.1)
- [x] **Full Article 탭 캐싱 개선** (v0.3.1)
  - hasFetchedRef를 사용한 중복 fetch 방지
  - URL 변경 시 자동 초기화
  - 에러 발생 시 재시도 가능하도록 개선
- [x] **Full Article 번역 프롬프트 개선** (v0.3.1)
  - 원문 충실 번역 강조 (요약 금지)
  - 마크다운 포맷으로 출력
  - 온도 0.2로 낮춰 일관성 향상
- [x] **Notion 스타일 마크다운 렌더링** (v0.3.1)
  - react-markdown + remark-gfm 라이브러리 추가
  - Notion과 유사한 타이포그래피 및 스타일링
  - 라이트/다크 모드 모두 지원
  - 코드 블록, 테이블, 리스트, 인용문 등 완벽 지원
- [x] **스크래핑 속도 개선** (v0.3.1)
  - 타임아웃 15초 → 8초로 단축
  - 더 빠른 사용자 피드백
- [x] **RSS 파싱 개선** (v0.3.1)
  - description, summary, content:encoded 필드 추가 지원
  - HTML 태그 제거 함수로 깨끗한 텍스트 추출
  - 이미지 태그 완전 제거
- [x] **요약 배치 병렬 처리** (v0.3.1)
  - 3개씩 배치로 묶어 병렬 요청
  - 전체 요약 시간 단축
- [x] **디버깅 로그 추가** (v0.3.1)
  - RSS, 스크래핑, 요약 등 주요 단계별 로그
  - 개발 및 디버깅 편의성 향상

### 완료된 기능 (v0.3.0)
- [x] DeepSeek AI 통합 (단일 프로바이더로 단순화)
- [x] 3줄 핵심 요약 및 카테고리 자동 분류
- [x] 스타일 템플릿 관리 시스템
- [x] AI 기반 문체 분석
- [x] 피드백 및 재생성 시스템
- [x] 플랫폼별 맞춤 콘텐츠 생성
- [x] Settings 페이지 추가
- [x] **라이브러리 현대화 및 아키텍처 개선**
  - TanStack Query를 활용한 서버 상태 관리
  - Zustand로 클라이언트 상태 중앙화
  - React Hook Form + Zod 기반 타입 안전 폼 검증
  - date-fns로 날짜 처리 표준화
  - Sonner를 통한 우아한 토스트 알림
  - 타입 안전 API 클라이언트 구축
- [x] **아키텍처 단순화** (v0.2.0)
  - AI 프로바이더 선택 기능 제거
  - DeepSeek 단일 프로바이더로 통합
  - 코드베이스 822줄 감소
- [x] **다크 모드 지원** (v0.2.0)
  - 라이트/다크 테마 토글 기능
  - 시스템 다크모드 자동 감지
  - FOUC(Flash of Unstyled Content) 방지
  - 부드러운 테마 전환 애니메이션
  - 아이콘 회전 및 스케일 효과
- [x] **뉴스 북마크 기능** (v0.2.0)
  - 뉴스 카드에서 북마크 토글 (amber 색상 아이콘)
  - 뉴스 상세 모달에서 북마크 추가/제거
  - "Bookmarked" 필터로 북마크된 뉴스만 조회
  - localStorage에 자동 저장 (Zustand persist)
  - Toast 알림으로 즉각 피드백
  - Stats 카드에 북마크 개수 표시
- [x] **웹 스크래핑 자동화 및 안정성 개선** (v0.3.0)
  - RSS 없는 소스도 자동으로 기사 목록 추출
  - 5가지 최신 브라우저 User-Agent 로테이션 (Chrome, Firefox, Safari, Edge)
  - 브라우저별 핑거프린트 매칭 (Sec-Ch-Ua, Sec-Fetch 헤더 등)
  - 랜덤 딜레이로 봇 디텍션 우회
  - Anthropic, Meta AI 등 주요 사이트 기본 스크래핑 설정 제공
- [x] **AI 요약 안정성 개선** (v0.3.0)
  - deepseek-reasoner에서 deepseek-chat으로 모델 변경 (더 안정적)
  - JSON 추출 함수로 응답 파싱 오류 해결
  - 빈 content 처리 및 기본값 반환으로 Pending 상태 방지
  - 짧은 content에 대한 예외 처리
- [x] **Full Article 탭 개선** (v0.3.0)
  - 원문 자동 스크래핑 기능
  - AI 기반 한국어 번역 및 포맷팅 (translate 모드)
  - 로딩 상태 표시 (fetching, translating)
  - 캐싱으로 중복 요청 방지
  - 에러 처리 및 재시도 기능
  - 문단 자동 분리 및 리스트 포맷팅
- [x] **UI/UX 버그 수정 및 개선** (v0.3.0)
  - 다크/라이트 모드 전환 시 border-color 충돌 해결
  - box-sizing 초기화로 레이아웃 안정성 향상
  - 테마 전환 애니메이션 최적화 (300ms → 200ms)
  - 모달 블러 애니메이션 제거로 렉 현상 해결
  - News Sources 페이지 레이아웃 개선 (Add Source 버튼 헤더 우측 배치)
  - 사이드바 소스 목록 실시간 표시 (sources prop 전달)
  - 소스 아이콘 개선 (RSS: 주황색 Rss 아이콘, Scraping: 파란색 Globe 아이콘)

### 향후 개발 계획
- [ ] 뉴스 필터링 및 검색 기능 개선 (카테고리, 날짜, 키워드)
- [ ] 자동 스케줄링 (Cloud Functions로 일정 시간마다 자동 수집)
- [ ] 데이터 내보내기/가져오기 (JSON, CSV)
- [ ] 다국어 지원 (영어, 일본어 등)
- [ ] 이미지 처리 및 OG 이미지 추출
- [ ] 통계 및 분석 대시보드 (Firebase Analytics)
- [ ] 예약 게시 기능
- [ ] 팀 협업 기능 (여러 사용자가 동일한 뉴스 공유)
- [ ] Firebase Storage를 통한 이미지 업로드
- [ ] 푸시 알림 (Firebase Cloud Messaging)

## 문제 해결

### AI API 에러
- `.env.local` 파일에 유효한 DEEPSEEK_API_KEY가 설정되어 있는지 확인
- API 키에 충분한 크레딧이 있는지 확인
- DeepSeek API 상태: https://platform.deepseek.com/
- 네트워크 연결 상태 확인

### RSS 피드 파싱 실패
- RSS URL이 올바른지 확인
- CORS 정책으로 인해 일부 피드는 접근 불가능할 수 있음
- 네트워크 연결 상태 확인

### 웹 스크래핑 실패
- 대상 웹사이트의 구조가 복잡하거나 동적 렌더링을 사용하는 경우 실패할 수 있음
- 일부 사이트는 스크래핑을 차단할 수 있음
- 해당 경우 수동으로 내용을 복사하여 추가 가능

### Firebase 연결 오류
- `.env.local` 파일에 Firebase 설정이 올바르게 입력되었는지 확인
- Firebase Console에서 웹 앱이 추가되었는지 확인
- Authentication 및 Firestore가 활성화되어 있는지 확인
- 브라우저 콘솔에서 자세한 에러 메시지 확인

### 로그인 실패
- Google 로그인: Firebase Console > Authentication > Sign-in method에서 Google 활성화 확인
- 이메일 로그인: Firebase Console > Authentication > Sign-in method에서 이메일/비밀번호 활성화 확인
- 비밀번호 재설정 이메일이 오지 않는 경우: 스팸 폴더 확인

### 데이터가 동기화되지 않음
- 인터넷 연결 상태 확인 (오프라인 모드에서는 로컬 캐시만 사용)
- Firestore Security Rules가 올바르게 배포되었는지 확인
- 브라우저 콘솔에서 Firestore 에러 메시지 확인

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
