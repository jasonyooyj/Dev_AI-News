'use client';

import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';
import { createContext, useContext, ReactNode, useCallback, useState } from 'react';

interface AuthContextType {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    theme?: 'light' | 'dark' | 'system';
    autoSummarize?: boolean;
  } | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProviderInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password');
      throw new Error('Invalid email or password');
    }
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setError(null);
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || 'Failed to create account');
      throw new Error(data.error || 'Failed to create account');
    }

    // Auto sign in after successful signup
    await handleSignIn(email, password);
  }, [handleSignIn]);

  const handleSignInWithGoogle = useCallback(async () => {
    setError(null);
    await signIn('google', { callbackUrl: '/' });
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut({ callbackUrl: '/login' });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user: session?.user ?? null,
    loading: status === 'loading',
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}
