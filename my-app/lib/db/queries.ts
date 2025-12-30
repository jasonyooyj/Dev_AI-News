import { eq, desc, and } from 'drizzle-orm';
import { db } from './index';
import {
  users,
  sources,
  newsItems,
  styleTemplates,
  socialConnections,
  publishHistory,
  type Source,
  type NewSource,
  type NewsItem,
  type NewNewsItem,
  type StyleTemplate,
  type NewStyleTemplate,
  type SocialConnection,
  type NewSocialConnection,
  type User,
} from './schema';

// Default user ID for public access (no authentication required)
export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

// ============ User Queries ============

export async function getOrCreateDefaultUser(): Promise<User> {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, DEFAULT_USER_ID))
    .limit(1);

  if (existing) return existing;

  // Create default user
  const [created] = await db
    .insert(users)
    .values({
      id: DEFAULT_USER_ID,
      email: 'default@ainews.local',
      displayName: 'Default User',
      theme: 'system',
      autoSummarize: true,
    })
    .returning();

  return created;
}

export async function getUserById(userId: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user ?? null;
}

export async function updateUserSettings(
  userId: string,
  settings: { theme?: 'light' | 'dark' | 'system'; autoSummarize?: boolean }
) {
  const [updated] = await db
    .update(users)
    .set({ ...settings, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}

// ============ Source Queries ============

export async function getSourcesByUserId(userId: string): Promise<Source[]> {
  return db
    .select()
    .from(sources)
    .where(eq(sources.userId, userId))
    .orderBy(desc(sources.createdAt));
}

export async function getSourceById(sourceId: string): Promise<Source | null> {
  const [source] = await db
    .select()
    .from(sources)
    .where(eq(sources.id, sourceId))
    .limit(1);
  return source ?? null;
}

export async function createSource(data: NewSource): Promise<Source> {
  const [source] = await db.insert(sources).values(data).returning();
  return source;
}

export async function updateSource(
  sourceId: string,
  data: Partial<Omit<Source, 'id' | 'userId' | 'createdAt'>>
): Promise<Source> {
  const [updated] = await db
    .update(sources)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(sources.id, sourceId))
    .returning();
  return updated;
}

export async function deleteSource(sourceId: string): Promise<void> {
  await db.delete(sources).where(eq(sources.id, sourceId));
}

// ============ News Item Queries ============

export async function getNewsItemsByUserId(userId: string): Promise<NewsItem[]> {
  return db
    .select()
    .from(newsItems)
    .where(eq(newsItems.userId, userId))
    .orderBy(desc(newsItems.createdAt));
}

export async function getNewsItemById(newsItemId: string): Promise<NewsItem | null> {
  const [item] = await db
    .select()
    .from(newsItems)
    .where(eq(newsItems.id, newsItemId))
    .limit(1);
  return item ?? null;
}

export async function createNewsItem(data: NewNewsItem): Promise<NewsItem> {
  const [item] = await db.insert(newsItems).values(data).returning();
  return item;
}

export async function createNewsItems(data: NewNewsItem[]): Promise<NewsItem[]> {
  if (data.length === 0) return [];
  return db.insert(newsItems).values(data).returning();
}

export async function updateNewsItem(
  newsItemId: string,
  data: Partial<Omit<NewsItem, 'id' | 'userId' | 'createdAt'>>
): Promise<NewsItem> {
  const [updated] = await db
    .update(newsItems)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(newsItems.id, newsItemId))
    .returning();
  return updated;
}

export async function deleteNewsItem(newsItemId: string): Promise<void> {
  await db.delete(newsItems).where(eq(newsItems.id, newsItemId));
}

export async function deleteAllNewsItems(userId: string): Promise<void> {
  await db.delete(newsItems).where(eq(newsItems.userId, userId));
}

// ============ Style Template Queries ============

export async function getStyleTemplatesByUserId(userId: string): Promise<StyleTemplate[]> {
  return db
    .select()
    .from(styleTemplates)
    .where(eq(styleTemplates.userId, userId))
    .orderBy(desc(styleTemplates.createdAt));
}

export async function getStyleTemplateById(templateId: string): Promise<StyleTemplate | null> {
  const [template] = await db
    .select()
    .from(styleTemplates)
    .where(eq(styleTemplates.id, templateId))
    .limit(1);
  return template ?? null;
}

export async function createStyleTemplate(data: NewStyleTemplate): Promise<StyleTemplate> {
  const [template] = await db.insert(styleTemplates).values(data).returning();
  return template;
}

export async function updateStyleTemplate(
  templateId: string,
  data: Partial<Omit<StyleTemplate, 'id' | 'userId' | 'createdAt'>>
): Promise<StyleTemplate> {
  const [updated] = await db
    .update(styleTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(styleTemplates.id, templateId))
    .returning();
  return updated;
}

export async function deleteStyleTemplate(templateId: string): Promise<void> {
  await db.delete(styleTemplates).where(eq(styleTemplates.id, templateId));
}

// ============ Social Connection Queries ============

export async function getSocialConnectionsByUserId(userId: string): Promise<SocialConnection[]> {
  return db
    .select()
    .from(socialConnections)
    .where(eq(socialConnections.userId, userId))
    .orderBy(desc(socialConnections.createdAt));
}

export async function getSocialConnectionByPlatform(
  userId: string,
  platform: 'twitter' | 'threads' | 'instagram' | 'linkedin' | 'bluesky'
): Promise<SocialConnection | null> {
  const [connection] = await db
    .select()
    .from(socialConnections)
    .where(
      and(
        eq(socialConnections.userId, userId),
        eq(socialConnections.platform, platform)
      )
    )
    .limit(1);
  return connection ?? null;
}

export async function upsertSocialConnection(
  data: NewSocialConnection
): Promise<SocialConnection> {
  // Check if connection exists
  const existing = await getSocialConnectionByPlatform(
    data.userId,
    data.platform as 'twitter' | 'threads' | 'instagram' | 'linkedin' | 'bluesky'
  );

  if (existing) {
    const [updated] = await db
      .update(socialConnections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(socialConnections.id, existing.id))
      .returning();
    return updated;
  }

  const [connection] = await db
    .insert(socialConnections)
    .values(data)
    .returning();
  return connection;
}

export async function deleteSocialConnection(connectionId: string): Promise<void> {
  await db.delete(socialConnections).where(eq(socialConnections.id, connectionId));
}

// ============ Publish History Queries ============

export async function getPublishHistoryByNewsItem(newsItemId: string) {
  return db
    .select()
    .from(publishHistory)
    .where(eq(publishHistory.newsItemId, newsItemId))
    .orderBy(desc(publishHistory.createdAt));
}

export async function createPublishRecord(data: {
  userId: string;
  newsItemId: string;
  content: string;
  results: Array<{
    platform: string;
    success: boolean;
    postId?: string;
    postUrl?: string;
    error?: string;
    publishedAt: string;
  }>;
}) {
  const [record] = await db.insert(publishHistory).values(data).returning();
  return record;
}
