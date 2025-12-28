'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignupForm } from '@/components/auth/SignupForm';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { Newspaper } from 'lucide-react';

export default function SignupPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Don't render form if already logged in
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Newspaper className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Start collecting and summarizing AI news
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <SignupForm onSuccess={() => router.push('/')} />
        </div>
      </div>
    </div>
  );
}
