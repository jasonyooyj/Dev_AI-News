'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase/config';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut as firebaseSignOut,
  resetPassword,
  getUserProfile,
  UserProfile,
} from '@/lib/firebase/auth';

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    // If Firebase is not configured, skip auth state listening
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);

        if (firebaseUser) {
          // Fetch user profile from Firestore
          try {
            const userProfile = await getUserProfile(firebaseUser.uid);
            setProfile(userProfile);
          } catch (err) {
            console.error('Error fetching user profile:', err);
          }
        } else {
          setProfile(null);
        }

        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error initializing auth listener:', err);
      setLoading(false);
    }
  }, []);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error) {
      // Map Firebase error codes to user-friendly messages
      const errorMessage = getErrorMessage(err.message);
      setError(errorMessage);
    } else {
      setError('An unexpected error occurred');
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email, password, displayName);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const googleSignIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut();
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const handleResetPassword = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle: googleSignIn,
    signOut,
    resetPassword: handleResetPassword,
    clearError,
  };
}

// Map Firebase error codes to user-friendly messages
function getErrorMessage(errorCode: string): string {
  if (errorCode.includes('auth/email-already-in-use')) {
    return 'This email is already registered. Please sign in instead.';
  }
  if (errorCode.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (errorCode.includes('auth/operation-not-allowed')) {
    return 'This sign-in method is not enabled. Please contact support.';
  }
  if (errorCode.includes('auth/weak-password')) {
    return 'Password should be at least 6 characters.';
  }
  if (errorCode.includes('auth/user-disabled')) {
    return 'This account has been disabled. Please contact support.';
  }
  if (errorCode.includes('auth/user-not-found')) {
    return 'No account found with this email. Please sign up first.';
  }
  if (errorCode.includes('auth/wrong-password')) {
    return 'Incorrect password. Please try again.';
  }
  if (errorCode.includes('auth/invalid-credential')) {
    return 'Invalid email or password. Please try again.';
  }
  if (errorCode.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Please try again later.';
  }
  if (errorCode.includes('auth/popup-closed-by-user')) {
    return 'Sign-in was cancelled. Please try again.';
  }
  if (errorCode.includes('auth/network-request-failed')) {
    return 'Network error. Please check your connection and try again.';
  }
  return 'An error occurred. Please try again.';
}
