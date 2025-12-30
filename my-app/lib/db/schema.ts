import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  uuid,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Enums
export const newsCategoryEnum = pgEnum('news_category', [
  'product',
  'update',
  'research',
  'announcement',
  'other',
]);

export const priorityEnum = pgEnum('priority', ['high', 'medium', 'low']);

export const sourceTypeEnum = pgEnum('source_type', [
  'rss',
  'youtube',
  'twitter',
  'threads',
  'blog',
]);

export const platformEnum = pgEnum('platform', [
  'twitter',
  'threads',
  'instagram',
  'linkedin',
  'bluesky',
]);

export const themeEnum = pgEnum('theme', ['light', 'dark', 'system']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // null for OAuth users
  displayName: text('display_name').notNull(),
  photoUrl: text('photo_url'),
  theme: themeEnum('theme').default('system'),
  autoSummarize: boolean('auto_summarize').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sources table
export const sources = pgTable('sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  logoUrl: text('logo_url'),
  rssUrl: text('rss_url'),
  websiteUrl: text('website_url').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastFetchedAt: timestamp('last_fetched_at'),
  priority: priorityEnum('priority').default('medium').notNull(),
  type: sourceTypeEnum('type').default('rss').notNull(),
  scrapeConfig: jsonb('scrape_config').$type<{
    articleSelector: string;
    titleSelector: string;
    linkSelector: string;
    descriptionSelector?: string;
    dateSelector?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// News items table
export const newsItems = pgTable('news_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sourceId: uuid('source_id')
    .notNull()
    .references(() => sources.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  originalContent: text('original_content').notNull(),
  url: text('url').notNull(),
  publishedAt: timestamp('published_at'),
  isProcessed: boolean('is_processed').default(false).notNull(),
  isBookmarked: boolean('is_bookmarked').default(false).notNull(),
  priority: priorityEnum('priority').default('medium').notNull(),
  mediaUrls: jsonb('media_urls').$type<string[]>().default([]),
  // Quick summary as JSONB
  quickSummary: jsonb('quick_summary').$type<{
    bullets: string[];
    category: 'product' | 'update' | 'research' | 'announcement' | 'other';
    createdAt: string;
  }>(),
  translatedContent: text('translated_content'),
  translatedAt: timestamp('translated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Style templates table
export const styleTemplates = pgTable('style_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  name: text('name').notNull(),
  examples: jsonb('examples').$type<string[]>().notNull(),
  tone: text('tone'),
  characteristics: jsonb('characteristics').$type<string[]>(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Social connections table
export const socialConnections = pgTable('social_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  handle: text('handle').notNull(),
  isConnected: boolean('is_connected').default(true).notNull(),
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
  // Encrypted credentials stored as JSONB
  credentials: jsonb('credentials').$type<{
    identifier?: string;
    appPassword?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Publish history table
export const publishHistory = pgTable('publish_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  newsItemId: uuid('news_item_id')
    .notNull()
    .references(() => newsItems.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  results: jsonb('results')
    .$type<
      Array<{
        platform: string;
        success: boolean;
        postId?: string;
        postUrl?: string;
        error?: string;
        publishedAt: string;
      }>
    >()
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type exports for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;

export type NewsItem = typeof newsItems.$inferSelect;
export type NewNewsItem = typeof newsItems.$inferInsert;

export type StyleTemplate = typeof styleTemplates.$inferSelect;
export type NewStyleTemplate = typeof styleTemplates.$inferInsert;

export type SocialConnection = typeof socialConnections.$inferSelect;
export type NewSocialConnection = typeof socialConnections.$inferInsert;

export type PublishHistoryRecord = typeof publishHistory.$inferSelect;
export type NewPublishHistoryRecord = typeof publishHistory.$inferInsert;
