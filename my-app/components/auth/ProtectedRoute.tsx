'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from './AuthProvider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  return <>{children}</>;
}

// HOC version for wrapping pages
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function ProtectedPage(props: P) {
    return (
      <ProtectedRoute fallback={fallback}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
