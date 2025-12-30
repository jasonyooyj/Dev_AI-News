'use client';

import { createContext, useContext, ReactNode } from 'react';

// Default user for public access (no authentication required)
const DEFAULT_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'default@ainews.local',
  name: 'Guest',
  image: null,
  theme: 'system' as const,
  autoSummarize: true,
};

interface AuthContextType {
  user: typeof DEFAULT_USER;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const value: AuthContextType = {
    user: DEFAULT_USER,
    loading: false,
    error: null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}
