'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LinkedInCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authorization...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setStatus('error');
      setMessage(errorDescription || error || 'Authorization was denied');

      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'linkedin-oauth-callback',
            error: errorDescription || error,
          },
          window.location.origin
        );
      }
      return;
    }

    if (code) {
      setStatus('success');
      setMessage('Authorization successful! Closing...');

      // Send code to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'linkedin-oauth-callback',
            code,
          },
          window.location.origin
        );
      }

      // Close popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      setStatus('error');
      setMessage('No authorization code received');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="text-center p-8 max-w-md">
        {status === 'loading' && (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Connecting to LinkedIn
            </h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
              Connected!
            </h1>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              Connection Failed
            </h1>
          </>
        )}

        <p className="text-zinc-600 dark:text-zinc-400">{message}</p>

        {status === 'error' && (
          <button
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
          >
            Close Window
          </button>
        )}
      </div>
    </div>
  );
}

export default function LinkedInCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <LinkedInCallbackContent />
    </Suspense>
  );
}
