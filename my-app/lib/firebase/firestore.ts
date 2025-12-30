import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  QueryConstraint,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import {
  newsItemConverter,
  sourceConverter,
  styleTemplateConverter,
  socialConnectionConverter,
  publishHistoryConverter,
  isoStringToTimestamp,
} from './converters';
import type { NewsItem, Source, StyleTemplate, QuickSummary, SocialConnection, PublishHistory, SocialPlatform } from '@/types/news';

// Collection paths
export const getCollectionPath = {
  sources: (userId: string) => `users/${userId}/sources`,
  newsItems: (userId: string) => `users/${userId}/newsItems`,
  styleTemplates: (userId: string) => `users/${userId}/styleTemplates`,
  socialConnections: (userId: string) => `users/${userId}/socialConnections`,
  publishHistory: (userId: string) => `users/${userId}/publishHistory`,
};

// ==================== NEWS ITEMS ====================

export async function getNewsItems(
  userId: string,
  constraints: QueryConstraint[] = []
): Promise<NewsItem[]> {
  const db = getFirebaseDb();
  const colRef = collection(db, getCollectionPath.newsItems(userId)).withConverter(
    newsItemConverter
  );
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(100), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

export async function getNewsItemById(userId: string, newsId: string): Promise<NewsItem | null> {
  const db = getFirebaseDb();
  const docRef = doc(db, getCollectionPath.newsItems(userId), newsId).withConverter(
    newsItemConverter
  );
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function addNewsItem(
  userId: string,
  newsItem: Omit<NewsItem, 'id' | 'createdAt'>
): Promise<string> {
  const db = getFirebaseDb();
  const colRef = collection(db, getCollectionPath.newsItems(userId));
  const docRef = await addDoc(colRef, {
    ...newsItem,
    isBookmarked: newsItem.isBookmarked ?? false,
    createdAt: serverTimestamp(),
    publishedAt: newsItem.publishedAt ? isoStringToTimestamp(newsItem.publishedAt) : null,
  });
  return docRef.id;
}

export async function updateNewsItem(
  userId: string,
  newsId: string,
  updates: Partial<NewsItem>
): Promise<void> {
  const db = getFirebaseDb();
  const docRef = doc(db, getCollectionPath.newsItems(userId), newsId);

  // Convert date strings to Timestamps if present
  const firestoreUpdates: Record<string, unknown> = { ...updates };

  if (updates.publishedAt) {
    firestoreUpdates.publishedAt = isoStringToTimestamp(updates.publishedAt);
  }
  if (updates.translatedAt) {
    firestoreUpdates.translatedAt = isoStringToTimestamp(updates.translatedAt);
  }
  if (updates.quickSummary) {
    firestoreUpdates.quickSummary = {
      ...updates.quickSummary,
      createdAt: isoStringToTimestamp(updates.quickSummary.createdAt) ?? Timestamp.now(),
    };
  }

  // Remove id and createdAt from updates (shouldn't be updated)
  delete firestoreUpdates.id;
  delete firestoreUpdates.createdAt;

  await updateDoc(docRef, firestoreUpdates);
}

export async function deleteNewsItem(userId: string, newsId: string): Promise<void> {
  const db = getFirebaseDb();
  const docRef = doc(db, getCollectionPath.newsItems(userId), newsId);
  await deleteDoc(docRef);
}

export async function addSummaryToNewsItem(
  userId: string,
  newsId: string,
  summary: QuickSummary
): Promise<void> {
  const db = getFirebaseDb();
  const docRef = doc(db, getCollectionPath.newsItems(userId), newsId);
  await updateDoc(docRef, {
    quickSummary: {
      bullets: summary.bullets,
      category: summary.category,
      createdAt: Timestamp.now(),
    },
    isProcessed: true,
  });
}

export async function saveTranslation(
  userId: string,
  newsId: string,
  translatedContent: string
): Promise<void> {
  const db = getFirebaseDb();
  const docRef = doc(db, getCollectionPath.newsItems(userId), newsId);
  await updateDoc(docRef, {
    translatedContent,
    translatedAt: serverTimestamp(),
  });
}

export async function toggleBookmark(userId: string, newsId: string): Promise<void> {
  const db = getFirebaseDb();
  const newsItem = await getNewsItemById(userId, newsId);
  if (newsItem) {
    const docRef = doc(db, getCollectionPath.newsItems(userId), newsId);
    await updateDoc(docRef, {
      isBookmarked: !newsItem.isBookmarked,
    });
  }
}

export function subscribeToNewsItems(
  userId: string,
  callback: (items: NewsItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const colRef = collection(db, getCollectionPath.newsItems(userId)).withConverter(
    newsItemConverter
  );
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((doc) => doc.data());
      callback(items);
    },
    (error) => {
      console.error('Error subscribing to news items:', error);
      onError?.(error);
    }
  );
}

// ==================== SOURCES ====================

export async function getSources(userId: string): Promise<Source[]> {
  const db = getFirebaseDb();
  const colRef = collection(db, getCollectionPath.sources(userId)).withConverter(sourceConverter);
  const q = query(colRef, orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

export async function getSourceById(userId: string, sourceId: string): Promise<Source | null> {
  const db = getFirebaseDb();
  const docRef = doc(db, getCollectionPath.sources(userId), sourceId).withConverter(sourceConverter);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function addSource(
  userId: string,
  source: Omit<Source, 'id'>
): Promise<string> {
  const db = getFirebaseDb();
  const colRef = collection(db, getCollectionPath.sources(userId));
  const docRef = await addDoc(colRef, {
    ...source,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateSource(
  userId: string,
  sourceId: string,
  updates: Partial<Source>
): Promise<void> {
  const db = getFirebaseDb();
  const docRef = doc(db, getCollectionPath.sources(userId), sourceId);

  const firestoreUpdates: Record<string, unknown> = { ...updates };
  if (updates.lastFetchedAt) {
    firestoreUpdates.lastFetchedAt = isoStringToTimestamp(updates.lastFetchedAt);
  }
  delete firestoreUpdates.id;
  firestoreUpdates.updatedAt = serverTimestamp();

  await updateDoc(docRef, firestoreUpdates);
}

export async function deleteSource(userId: string, sourceId: string): Promise<void> {
  const db = getFirebaseDb();
  const docRef = doc(db, getCollectionPath.sources(userId), sourceId);
  await deleteDoc(docRef);
}

export function subscribeToSources(
  userId: string,
  callback: (sources: Source[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const colRef = collection(db, getCollectionPath.sources(userId)).withConverter(sourceConverter);
  const q = query(colRef, orderBy('name', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const sources = snapshot.docs.map((doc) => doc.data());
      callback(sources);
    },
    (error) => {
      console.error('Error subscribing to sources:', error);
      onError?.(error);
    }
  );
}

// ==================== STYLE TEMPLATES ====================

export async function getStyleTemplates(userId: string): Promise<StyleTemplate[]> {
  const db = getFirebaseDb();
  const colRef = collection(db, getCollectionPath.styleTemplates(userId)).withConverter(
    styleTemplateConverter
  );
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

export async function getStyleTemplateById(
  userId: string,
  templateId: string
): Promise<StyleTemplate | null> {
  const db = getFirebaseDb();
  const docRef = doc(db, getCollectionPath.styleTemplates(userId), templateId).withConverter(
    styleTemplateConverter
  );
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function getStyleTemplatesByPlatform(
  userId: string,
  platform: StyleTemplate['platform']
): Promise<StyleTemplate[]> {
  const db = getFirebaseDb();
  const colRef = collection(db, getCollectionPath.styleTemplates(userId)).withConverter(
    styleTemplateConverter
  );
  const q = query(colRef, where('platform', '==', platform));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

export async function addStyleTemplate(
  userId: string,
  template: Omit<StyleTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = getFirebaseDb();
  const colRef = collection(db, getCollectionPath.styleTemplates(userId));
  const docRef = await addDoc(colRef, {
    ...template,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateStyleTemplate(
  userId: string,
  templateId: string,
  updates: Partial<StyleTemplate>
): Promise<void> {
  const db = getFirebaseDb();
  const docRef = doc(db, getCollectionPath.styleTemplates(userId), templateId);

  const firestoreUpdates: Record<string, unknown> = { ...updates };
  delete firestoreUpdates.id;
  delete firestoreUpdates.createdAt;
  firestoreUpdates.updatedAt = serverTimestamp();

  await updateDoc(docRef, firestoreUpdates);
}

export async function deleteStyleTemplate(userId: string, templateId: string): Promise<void> {
  const db = getFirebaseDb();
  const docRef = doc(db, getCollectionPath.styleTemplates(userId), templateId);
  await deleteDoc(docRef);
}

export async function setDefaultStyleTemplate(
  userId: string,
  platform: StyleTemplate['platform'],
  templateId: string
): Promise<void> {
  const db = getFirebaseDb();
  // First, unset all defaults for this platform
  const templates = await getStyleTemplatesByPlatform(userId, platform);
  const batch = writeBatch(db);

  for (const template of templates) {
    if (template.isDefault && template.id !== templateId) {
      const docRef = doc(db, getCollectionPath.styleTemplates(userId), template.id);
      batch.update(docRef, { isDefault: false, updatedAt: serverTimestamp() });
    }
  }

  // Set the new default
  const newDefaultRef = doc(db, getCollectionPath.styleTemplates(userId), templateId);
  batch.update(newDefaultRef, { isDefault: true, updatedAt: serverTimestamp() });

  await batch.commit();
}

export function subscribeToStyleTemplates(
  userId: string,
  callback: (templates: StyleTemplate[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const colRef = collection(db, getCollectionPath.styleTemplates(userId)).withConverter(
    styleTemplateConverter
  );
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const templates = snapshot.docs.map((doc) => doc.data());
      callback(templates);
    },
    (error) => {
      console.error('Error subscribing to style templates:', error);
      onError?.(error);
    }
  );
}

// ==================== BATCH OPERATIONS ====================

export async function batchAddNewsItems(
  userId: string,
  newsItems: Omit<NewsItem, 'id' | 'createdAt'>[]
): Promise<string[]> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  const ids: string[] = [];

  for (const item of newsItems) {
    const colRef = collection(db, getCollectionPath.newsItems(userId));
    const docRef = doc(colRef);
    ids.push(docRef.id);

    batch.set(docRef, {
      ...item,
      isBookmarked: item.isBookmarked ?? false,
      createdAt: serverTimestamp(),
      publishedAt: item.publishedAt ? isoStringToTimestamp(item.publishedAt) : null,
    });
  }

  await batch.commit();
  return ids;
}

export async function batchAddSources(
  userId: string,
  sources: Omit<Source, 'id'>[]
): Promise<string[]> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  const ids: string[] = [];

  for (const source of sources) {
    const colRef = collection(db, getCollectionPath.sources(userId));
    const docRef = doc(colRef);
    ids.push(docRef.id);

    batch.set(docRef, {
      ...source,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return ids;
}

export async function batchAddStyleTemplates(
  userId: string,
  templates: Omit<StyleTemplate, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<string[]> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  const ids: string[] = [];

  for (const template of templates) {
    const colRef = collection(db, getCollectionPath.styleTemplates(userId));
    const docRef = doc(colRef);
    ids.push(docRef.id);

    batch.set(docRef, {
      ...template,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return ids;
}

// ==================== SOCIAL CONNECTIONS ====================

export async function getSocialConnections(userId: string): Promise<SocialConnection[]> {
  const db = getFirebaseDb();
  const colRef = collection(db, getCollectionPath.socialConnections(userId)).withConverter(
    socialConnectionConverter
  );
  const q = query(colRef, orderBy('connectedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

export async function getSocialConnectionByPlatform(
  userId: string,
  platform: SocialPlatform
): Promise<SocialConnection | null> {
  const db = getFirebaseDb();
  const colRef = collection(db, getCollectionPath.socialConnections(userId)).withConverter(
    socialConnectionConverter
  );
  const q = query(colRef, where('platform', '==', platform), limit(1));
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : snapshot.docs[0].data();
}

export async function addSocialConnection(
  userId: string,
  connection: Omit<SocialConnection, 'id' | 'connectedAt'>
): Promise<string> {
  const db = getFirebaseDb();

  // Check if connection already exists for this platform
  const existing = await getSocialConnectionByPlatform(userId, connection.platform);
  if (existing) {
    // Update existing connection
    await updateSocialConnection(userId, existing.id, {
      ...connection,
      connectedAt: new Date().toISOString(),
    });
    return existing.id;
  }

  // Create new connection
  const colRef = collection(db, getCollectionPath.socialConnections(userId));
  const docRef = await addDoc(colRef, {
    ...connection,
    connectedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateSocialConnection(
  userId: string,
  connectionId: string,
  updates: Partial<SocialConnection>
): Promise<void> {
  const db = getFirebaseDb();
  const docRef = doc(db, getCollectionPath.socialConnections(userId), connectionId);

  const firestoreUpdates: Record<string, unknown> = { ...updates };
  delete firestoreUpdates.id;

  if (updates.connectedAt) {
    firestoreUpdates.connectedAt = isoStringToTimestamp(updates.connectedAt);
  }

  await updateDoc(docRef, firestoreUpdates);
}

export async function deleteSocialConnection(userId: string, connectionId: string): Promise<void> {
  const db = getFirebaseDb();
  const docRef = doc(db, getCollectionPath.socialConnections(userId), connectionId);
  await deleteDoc(docRef);
}

export async function disconnectSocialPlatform(
  userId: string,
  platform: SocialPlatform
): Promise<void> {
  const connection = await getSocialConnectionByPlatform(userId, platform);
  if (connection) {
    await deleteSocialConnection(userId, connection.id);
  }
}

export function subscribeToSocialConnections(
  userId: string,
  callback: (connections: SocialConnection[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const colRef = collection(db, getCollectionPath.socialConnections(userId)).withConverter(
    socialConnectionConverter
  );
  const q = query(colRef, orderBy('connectedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const connections = snapshot.docs.map((doc) => doc.data());
      callback(connections);
    },
    (error) => {
      console.error('Error subscribing to social connections:', error);
      onError?.(error);
    }
  );
}

// ==================== PUBLISH HISTORY ====================

export async function getPublishHistory(userId: string): Promise<PublishHistory[]> {
  const db = getFirebaseDb();
  const colRef = collection(db, getCollectionPath.publishHistory(userId)).withConverter(
    publishHistoryConverter
  );
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

export async function addPublishHistory(
  userId: string,
  history: Omit<PublishHistory, 'id' | 'createdAt'>
): Promise<string> {
  const db = getFirebaseDb();
  const colRef = collection(db, getCollectionPath.publishHistory(userId));
  const docRef = await addDoc(colRef, {
    ...history,
    results: history.results.map((r) => ({
      ...r,
      publishedAt: isoStringToTimestamp(r.publishedAt) ?? serverTimestamp(),
    })),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getPublishHistoryByNewsItem(
  userId: string,
  newsItemId: string
): Promise<PublishHistory[]> {
  const db = getFirebaseDb();
  const colRef = collection(db, getCollectionPath.publishHistory(userId)).withConverter(
    publishHistoryConverter
  );
  const q = query(colRef, where('newsItemId', '==', newsItemId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}
