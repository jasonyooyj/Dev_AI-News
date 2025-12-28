'use client';

import { useFirestoreSync } from '@/hooks/useFirestoreSync';

interface FirestoreSyncProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that syncs Firestore listeners with authentication state.
 * Must be used within an AuthProvider.
 */
export function FirestoreSyncProvider({ children }: FirestoreSyncProviderProps) {
  useFirestoreSync();
  return <>{children}</>;
}
