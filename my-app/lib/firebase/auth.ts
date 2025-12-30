import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocFromCache, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from './config';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// User profile interface
export interface UserProfile {
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt: Date;
  settings: {
    theme: 'light' | 'dark' | 'system';
    autoSummarize: boolean;
  };
}

// Create or update user profile in Firestore
async function createOrUpdateUserProfile(user: User): Promise<void> {
  const db = getFirebaseDb();
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Create new user profile
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      settings: {
        theme: 'system',
        autoSummarize: true,
      },
    });
  } else {
    // Update last login time
    await setDoc(
      userRef,
      { lastLoginAt: serverTimestamp() },
      { merge: true }
    );
  }
}

// Sign up with email and password
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  // Update display name if provided
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }

  // Create user profile in Firestore
  await createOrUpdateUserProfile(credential.user);

  return credential;
}

// Sign in with email and password
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);

  // Update last login time
  await createOrUpdateUserProfile(credential.user);

  return credential;
}

// Sign in with Google
export async function signInWithGoogle(): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  const credential = await signInWithPopup(auth, googleProvider);

  // Create or update user profile in Firestore
  await createOrUpdateUserProfile(credential.user);

  return credential;
}

// Sign out
export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

// Send password reset email
export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
}

// Get user profile from Firestore (with offline support)
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  const userRef = doc(db, 'users', userId);

  // Helper to parse document data
  const parseUserProfile = (data: Record<string, unknown>): UserProfile => ({
    email: data.email as string,
    displayName: data.displayName as string,
    photoURL: data.photoURL as string | null,
    createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.() || new Date(),
    lastLoginAt: (data.lastLoginAt as { toDate?: () => Date })?.toDate?.() || new Date(),
    settings: (data.settings as UserProfile['settings']) || { theme: 'system', autoSummarize: true },
  });

  // Try cache first for faster loading
  try {
    const cachedSnap = await getDocFromCache(userRef);
    if (cachedSnap.exists()) {
      return parseUserProfile(cachedSnap.data());
    }
  } catch {
    // Cache miss or offline - continue to server fetch
  }

  // Fetch from server
  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return parseUserProfile(userSnap.data());
    }
  } catch (err) {
    // Silently handle offline errors - profile will load when online
    if ((err as { code?: string })?.code === 'unavailable') {
      return null;
    }
    throw err;
  }

  return null;
}

// Update user settings
export async function updateUserSettings(
  userId: string,
  settings: Partial<UserProfile['settings']>
): Promise<void> {
  const db = getFirebaseDb();
  const userRef = doc(db, 'users', userId);
  await setDoc(
    userRef,
    { settings },
    { merge: true }
  );
}
