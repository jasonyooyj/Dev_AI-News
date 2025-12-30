import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase config is valid (has required fields)
const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

// Initialize Firebase only if configured and on client side
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function initializeFirebase() {
  if (!isFirebaseConfigured) {
    console.warn('Firebase is not configured. Please set up environment variables.');
    return;
  }

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);

  // Initialize Firestore with persistent cache (multi-tab support)
  // This replaces the deprecated enableIndexedDbPersistence()
  if (typeof window !== 'undefined') {
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch (err) {
      // If Firestore is already initialized (e.g., hot reload), get existing instance
      if ((err as Error).message?.includes('already been called')) {
        db = getFirestore(app);
      } else {
        throw err;
      }
    }
  } else {
    db = getFirestore(app);
  }

  // Connect to emulators in development (optional)
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' &&
    db
  ) {
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
}

// Initialize on client side only
if (typeof window !== 'undefined') {
  initializeFirebase();
}

// Export getters that handle the case when Firebase is not initialized
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    // Initialize if not done yet (for lazy loading)
    if (typeof window !== 'undefined' && !app) {
      initializeFirebase();
    }
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please check your configuration.');
    }
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    // Initialize if not done yet (for lazy loading)
    if (typeof window !== 'undefined' && !app) {
      initializeFirebase();
    }
    if (!db) {
      throw new Error('Firestore is not initialized. Please check your configuration.');
    }
  }
  return db;
}

// Backward compatibility exports (these may be null on server side)
export { auth, db, isFirebaseConfigured };
export default app;
