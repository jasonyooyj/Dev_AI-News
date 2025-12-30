import {
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  SnapshotOptions,
  FirestoreDataConverter,
} from 'firebase/firestore';
import type { NewsItem, Source, StyleTemplate, QuickSummary, SocialConnection, PublishHistory } from '@/types/news';

// Helper to convert Firestore Timestamp to ISO string
export function timestampToISOString(timestamp: Timestamp | null | undefined): string | undefined {
  if (!timestamp) return undefined;
  return timestamp.toDate().toISOString();
}

// Helper to convert ISO string to Firestore Timestamp
export function isoStringToTimestamp(isoString: string | undefined): Timestamp | null {
  if (!isoString) return null;
  return Timestamp.fromDate(new Date(isoString));
}

// NewsItem Firestore Data type
interface NewsItemFirestore {
  sourceId: string;
  title: string;
  originalContent: string;
  url: string;
  publishedAt?: Timestamp | null;
  isProcessed: boolean;
  isBookmarked?: boolean;
  createdAt: Timestamp;
  quickSummary?: {
    bullets: string[];
    category: string;
    createdAt: Timestamp;
  } | null;
  translatedContent?: string;
  translatedAt?: Timestamp | null;
}

// NewsItem converter
export const newsItemConverter: FirestoreDataConverter<NewsItem> = {
  toFirestore(newsItem: NewsItem): DocumentData {
    const data: DocumentData = {
      sourceId: newsItem.sourceId,
      title: newsItem.title,
      originalContent: newsItem.originalContent,
      url: newsItem.url,
      isProcessed: newsItem.isProcessed,
      isBookmarked: newsItem.isBookmarked ?? false,
      createdAt: isoStringToTimestamp(newsItem.createdAt) ?? Timestamp.now(),
    };

    if (newsItem.publishedAt) {
      data.publishedAt = isoStringToTimestamp(newsItem.publishedAt);
    }

    if (newsItem.quickSummary) {
      data.quickSummary = {
        bullets: newsItem.quickSummary.bullets,
        category: newsItem.quickSummary.category,
        createdAt: isoStringToTimestamp(newsItem.quickSummary.createdAt) ?? Timestamp.now(),
      };
    }

    if (newsItem.translatedContent) {
      data.translatedContent = newsItem.translatedContent;
    }

    if (newsItem.translatedAt) {
      data.translatedAt = isoStringToTimestamp(newsItem.translatedAt);
    }

    return data;
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<NewsItemFirestore>,
    options?: SnapshotOptions
  ): NewsItem {
    const data = snapshot.data(options);

    const newsItem: NewsItem = {
      id: snapshot.id,
      sourceId: data.sourceId,
      title: data.title,
      originalContent: data.originalContent,
      url: data.url,
      isProcessed: data.isProcessed,
      isBookmarked: data.isBookmarked,
      createdAt: timestampToISOString(data.createdAt) ?? new Date().toISOString(),
    };

    if (data.publishedAt) {
      newsItem.publishedAt = timestampToISOString(data.publishedAt);
    }

    if (data.quickSummary) {
      newsItem.quickSummary = {
        bullets: data.quickSummary.bullets,
        category: data.quickSummary.category as QuickSummary['category'],
        createdAt: timestampToISOString(data.quickSummary.createdAt) ?? new Date().toISOString(),
      };
    }

    if (data.translatedContent) {
      newsItem.translatedContent = data.translatedContent;
    }

    if (data.translatedAt) {
      newsItem.translatedAt = timestampToISOString(data.translatedAt);
    }

    return newsItem;
  },
};

// Source Firestore Data type
interface SourceFirestore {
  name: string;
  description?: string;
  logoUrl?: string;
  rssUrl?: string;
  websiteUrl: string;
  isActive: boolean;
  lastFetchedAt?: Timestamp | null;
  scrapeConfig?: {
    articleSelector: string;
    titleSelector: string;
    linkSelector: string;
    descriptionSelector?: string;
    dateSelector?: string;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Source converter
export const sourceConverter: FirestoreDataConverter<Source> = {
  toFirestore(source: Source): DocumentData {
    const data: DocumentData = {
      name: source.name,
      websiteUrl: source.websiteUrl,
      isActive: source.isActive,
    };

    if (source.description) data.description = source.description;
    if (source.logoUrl) data.logoUrl = source.logoUrl;
    if (source.rssUrl) data.rssUrl = source.rssUrl;
    if (source.lastFetchedAt) {
      data.lastFetchedAt = isoStringToTimestamp(source.lastFetchedAt);
    }
    if (source.scrapeConfig) {
      data.scrapeConfig = source.scrapeConfig;
    }

    return data;
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<SourceFirestore>,
    options?: SnapshotOptions
  ): Source {
    const data = snapshot.data(options);

    const source: Source = {
      id: snapshot.id,
      name: data.name,
      websiteUrl: data.websiteUrl,
      isActive: data.isActive,
    };

    if (data.description) source.description = data.description;
    if (data.logoUrl) source.logoUrl = data.logoUrl;
    if (data.rssUrl) source.rssUrl = data.rssUrl;
    if (data.lastFetchedAt) {
      source.lastFetchedAt = timestampToISOString(data.lastFetchedAt);
    }
    if (data.scrapeConfig) {
      source.scrapeConfig = data.scrapeConfig;
    }

    return source;
  },
};

// StyleTemplate Firestore Data type
interface StyleTemplateFirestore {
  platform: string;
  name: string;
  examples: string[];
  tone?: string;
  characteristics?: string[];
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// StyleTemplate converter
export const styleTemplateConverter: FirestoreDataConverter<StyleTemplate> = {
  toFirestore(template: StyleTemplate): DocumentData {
    return {
      platform: template.platform,
      name: template.name,
      examples: template.examples,
      tone: template.tone ?? '',
      characteristics: template.characteristics ?? [],
      isDefault: template.isDefault,
      createdAt: isoStringToTimestamp(template.createdAt) ?? Timestamp.now(),
      updatedAt: isoStringToTimestamp(template.updatedAt) ?? Timestamp.now(),
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<StyleTemplateFirestore>,
    options?: SnapshotOptions
  ): StyleTemplate {
    const data = snapshot.data(options);

    return {
      id: snapshot.id,
      platform: data.platform as StyleTemplate['platform'],
      name: data.name,
      examples: data.examples,
      tone: data.tone,
      characteristics: data.characteristics,
      isDefault: data.isDefault,
      createdAt: timestampToISOString(data.createdAt) ?? new Date().toISOString(),
      updatedAt: timestampToISOString(data.updatedAt) ?? new Date().toISOString(),
    };
  },
};

// SocialConnection Firestore Data type
interface SocialConnectionFirestore {
  platform: string;
  handle: string;
  isConnected: boolean;
  connectedAt: Timestamp;
  credentials?: {
    identifier?: string;
    appPassword?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Timestamp | null;
  };
}

// SocialConnection converter
export const socialConnectionConverter: FirestoreDataConverter<SocialConnection> = {
  toFirestore(connection: SocialConnection): DocumentData {
    const data: DocumentData = {
      platform: connection.platform,
      handle: connection.handle,
      isConnected: connection.isConnected,
      connectedAt: isoStringToTimestamp(connection.connectedAt) ?? Timestamp.now(),
    };

    if (connection.credentials) {
      data.credentials = {
        ...connection.credentials,
      };
      if (connection.credentials.expiresAt) {
        data.credentials.expiresAt = isoStringToTimestamp(connection.credentials.expiresAt);
      }
    }

    return data;
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<SocialConnectionFirestore>,
    options?: SnapshotOptions
  ): SocialConnection {
    const data = snapshot.data(options);

    const connection: SocialConnection = {
      id: snapshot.id,
      platform: data.platform as SocialConnection['platform'],
      handle: data.handle,
      isConnected: data.isConnected,
      connectedAt: timestampToISOString(data.connectedAt) ?? new Date().toISOString(),
    };

    if (data.credentials) {
      connection.credentials = {
        identifier: data.credentials.identifier,
        appPassword: data.credentials.appPassword,
        accessToken: data.credentials.accessToken,
        refreshToken: data.credentials.refreshToken,
        expiresAt: data.credentials.expiresAt
          ? timestampToISOString(data.credentials.expiresAt)
          : undefined,
      };
    }

    return connection;
  },
};

// PublishHistory Firestore Data type
interface PublishHistoryFirestore {
  newsItemId: string;
  content: string;
  results: Array<{
    platform: string;
    success: boolean;
    postId?: string;
    postUrl?: string;
    error?: string;
    publishedAt: Timestamp;
  }>;
  createdAt: Timestamp;
}

// PublishHistory converter
export const publishHistoryConverter: FirestoreDataConverter<PublishHistory> = {
  toFirestore(history: PublishHistory): DocumentData {
    return {
      newsItemId: history.newsItemId,
      content: history.content,
      results: history.results.map((result) => ({
        ...result,
        publishedAt: isoStringToTimestamp(result.publishedAt) ?? Timestamp.now(),
      })),
      createdAt: isoStringToTimestamp(history.createdAt) ?? Timestamp.now(),
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<PublishHistoryFirestore>,
    options?: SnapshotOptions
  ): PublishHistory {
    const data = snapshot.data(options);

    return {
      id: snapshot.id,
      newsItemId: data.newsItemId,
      content: data.content,
      results: data.results.map((result) => ({
        platform: result.platform as PublishHistory['results'][0]['platform'],
        success: result.success,
        postId: result.postId,
        postUrl: result.postUrl,
        error: result.error,
        publishedAt: timestampToISOString(result.publishedAt) ?? new Date().toISOString(),
      })),
      createdAt: timestampToISOString(data.createdAt) ?? new Date().toISOString(),
    };
  },
};
