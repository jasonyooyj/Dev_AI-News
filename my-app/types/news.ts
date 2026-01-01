// 우선순위 타입
export type Priority = 'high' | 'medium' | 'low';

// 소스 타입
export type SourceType = 'rss' | 'youtube' | 'twitter' | 'threads' | 'blog';

export interface Source {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  rssUrl?: string;
  websiteUrl: string;
  isActive: boolean;
  lastFetchedAt?: string;
  priority: Priority;
  type: SourceType;
  // Scraping configuration for non-RSS sources
  scrapeConfig?: {
    articleSelector: string;      // CSS selector for article list items
    titleSelector: string;        // CSS selector for title within article
    linkSelector: string;         // CSS selector for link within article
    descriptionSelector?: string; // Optional: CSS selector for description
    dateSelector?: string;        // Optional: CSS selector for date
  };
}

// 뉴스 카테고리
export type NewsCategory = 'product' | 'update' | 'research' | 'announcement' | 'other';

// 3줄 핵심 요약
export interface QuickSummary {
  bullets: string[];          // 핵심 포인트 3개
  category: NewsCategory;     // 신제품/업데이트/연구/발표
  createdAt: string;
}

// 문체 템플릿
export interface StyleTemplate {
  id: string;
  platform: Platform;         // 어떤 플랫폼용인지
  name: string;               // "내 X 스타일"
  examples: string[];         // 예시 텍스트 3-5개
  tone?: string;              // AI가 분석한 톤 설명
  characteristics?: string[]; // 스타일 특성
  isDefault: boolean;         // 기본 템플릿 여부
  createdAt: string;
  updatedAt: string;
}

export interface NewsItem {
  id: string;
  sourceId: string;
  title: string;
  originalContent: string;
  url: string;
  publishedAt?: string;
  isProcessed: boolean;
  isBookmarked?: boolean;  // 북마크 여부
  priority: Priority;      // 우선순위
  mediaUrls?: string[];    // 이미지/영상 URL 배열
  createdAt: string;
  quickSummary?: QuickSummary;  // 3줄 핵심 요약
  translatedContent?: string;   // 번역된 전체 기사 (캐시)
  translatedAt?: string;        // 번역 시간
  generatedContents?: Partial<Record<Platform, PlatformContent>>;  // 플랫폼별 생성된 콘텐츠 (캐시)
  generatedImages?: PlatformImages;  // 플랫폼별 생성된 이미지 (캐시)
}

export interface PlatformContent {
  content: string;
  charCount?: number;
  hashtags?: string[];
}

// 플랫폼별 이미지 사이즈 설정
export interface ImageSize {
  width: number;
  height: number;
  aspectRatio: string;
  label: string;
}

export const PLATFORM_IMAGE_SIZES: Record<Platform, ImageSize[]> = {
  twitter: [
    { width: 1200, height: 675, aspectRatio: '16:9', label: '가로 (16:9)' },
    { width: 1080, height: 1080, aspectRatio: '1:1', label: '정사각형 (1:1)' },
    { width: 1080, height: 1350, aspectRatio: '4:5', label: '세로 (4:5)' },
  ],
  threads: [
    { width: 1080, height: 1350, aspectRatio: '4:5', label: '세로 (4:5)' },
    { width: 1080, height: 1080, aspectRatio: '1:1', label: '정사각형 (1:1)' },
    { width: 1080, height: 1920, aspectRatio: '9:16', label: '스토리 (9:16)' },
  ],
  instagram: [
    { width: 1080, height: 1350, aspectRatio: '4:5', label: '피드 세로 (4:5)' },
    { width: 1080, height: 1080, aspectRatio: '1:1', label: '피드 정사각형 (1:1)' },
    { width: 1080, height: 1920, aspectRatio: '9:16', label: '스토리/릴스 (9:16)' },
  ],
  linkedin: [
    { width: 1200, height: 627, aspectRatio: '1.91:1', label: '피드 가로 (1.91:1)' },
    { width: 1200, height: 1200, aspectRatio: '1:1', label: '피드 정사각형 (1:1)' },
    { width: 1920, height: 1080, aspectRatio: '16:9', label: '아티클 커버 (16:9)' },
  ],
  bluesky: [
    { width: 1200, height: 675, aspectRatio: '16:9', label: '가로 (16:9)' },
    { width: 1080, height: 1080, aspectRatio: '1:1', label: '정사각형 (1:1)' },
  ],
};

// 생성된 이미지 정보
export interface GeneratedImage {
  base64: string;        // base64 인코딩된 이미지 데이터
  mimeType: string;      // image/png, image/jpeg
  width: number;
  height: number;
  aspectRatio: string;
  headline: string;      // 이미지에 포함된 헤드라인
  createdAt: string;
}

// 플랫폼별 생성된 이미지 맵
export type PlatformImages = Partial<Record<Platform, GeneratedImage>>;

export interface ProcessedNews {
  id: string;
  newsItemId: string;
  summary: string;
  platforms: {
    twitter?: PlatformContent;
    threads?: PlatformContent;
    instagram?: PlatformContent;
    linkedin?: PlatformContent;
  };
  styleTemplateIds?: Partial<Record<Platform, string>>;  // 각 플랫폼에 적용된 템플릿 ID
  createdAt: string;
}

export type Platform = 'twitter' | 'threads' | 'instagram' | 'linkedin' | 'bluesky';

// Social Media Connection Types
export type SocialPlatform = 'bluesky' | 'threads' | 'linkedin' | 'instagram';

export interface SocialConnection {
  id: string;
  platform: SocialPlatform;
  handle: string;           // @username or display name
  isConnected: boolean;
  connectedAt: string;
  // Platform-specific data (encrypted in Firestore)
  credentials?: {
    // Bluesky: identifier + app password
    identifier?: string;
    appPassword?: string;
    // OAuth platforms: access token + refresh token
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
  };
}

export interface PublishResult {
  platform: SocialPlatform;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  publishedAt: string;
}

export interface PublishHistory {
  id: string;
  newsItemId: string;
  content: string;
  results: PublishResult[];
  createdAt: string;
}

export interface PlatformConfig {
  name: string;
  icon: string;
  maxLength?: number;
  color: string;
}

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  product: '신제품',
  update: '업데이트',
  research: '연구',
  announcement: '발표',
  other: '기타',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#ef4444',    // red-500
  medium: '#eab308',  // yellow-500
  low: '#3b82f6',     // blue-500
};

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  rss: 'RSS',
  youtube: 'YouTube',
  twitter: 'Twitter/X',
  threads: 'Threads',
  blog: '블로그',
};

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  twitter: {
    name: 'X (Twitter)',
    icon: 'X',
    maxLength: 280,
    color: '#000000',
  },
  bluesky: {
    name: 'Bluesky',
    icon: 'Bluesky',
    maxLength: 300,
    color: '#0085FF',
  },
  threads: {
    name: 'Threads',
    icon: 'Threads',
    maxLength: 500,
    color: '#000000',
  },
  instagram: {
    name: 'Instagram',
    icon: 'Instagram',
    maxLength: 2200,
    color: '#E4405F',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'LinkedIn',
    maxLength: 3000,
    color: '#0A66C2',
  },
};
