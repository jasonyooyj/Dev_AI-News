export interface Source {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  rssUrl?: string;
  websiteUrl: string;
  isActive: boolean;
  lastFetchedAt?: string;
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
  createdAt: string;
  quickSummary?: QuickSummary;  // 3줄 핵심 요약
  translatedContent?: string;   // 번역된 전체 기사 (캐시)
  translatedAt?: string;        // 번역 시간
}

export interface PlatformContent {
  content: string;
  charCount?: number;
  hashtags?: string[];
}

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
