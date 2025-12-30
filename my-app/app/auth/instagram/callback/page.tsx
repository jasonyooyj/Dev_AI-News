'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function InstagramCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Instagram authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorReason = searchParams.get('error_reason');
      const errorDescription = searchParams.get('error_description');

      // Handle OAuth errors
      if (error) {
        setStatus('error');
        setMessage(errorDescription || errorReason || 'Authorization was denied');

        // Send error to parent window
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'INSTAGRAM_AUTH_ERROR',
              error: errorDescription || errorReason || error,
            },
            window.location.origin
          );
        }
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        return;
      }

      try {
        // Exchange code for tokens
        const response = await fetch('/api/social/instagram/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to authenticate');
        }

        setStatus('success');
        setMessage('Connected successfully! This window will close...');

        // Send success to parent window
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'INSTAGRAM_AUTH_SUCCESS',
              profile: data.profile,
              credentials: data.credentials,
            },
            window.location.origin
          );
        }

        // Close popup after brief delay
        setTimeout(() => {
          window.close();
        }, 1500);
      } catch (err) {
        console.error('Instagram callback error:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Authentication failed');

        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'INSTAGRAM_AUTH_ERROR',
              error: err instanceof Error ? err.message : 'Authentication failed',
            },
            window.location.origin
          );
        }
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Instagram Icon */}
          <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className={`w-12 h-12 ${
                status === 'error' ? 'text-red-500' : 'text-pink-500'
              }`}
            >
              <defs>
                <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FD5" />
                  <stop offset="50%" stopColor="#F56040" />
                  <stop offset="100%" stopColor="#C13584" />
                </linearGradient>
              </defs>
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                fill={status === 'error' ? 'currentColor' : 'url(#instagram-gradient)'}
              />
            </svg>
          </div>

          <h1
            className={`text-xl font-semibold mb-2 ${
              status === 'error' ? 'text-red-600' : 'text-gray-900'
            }`}
          >
            {status === 'processing' && 'Connecting to Instagram'}
            {status === 'success' && 'Connected!'}
            {status === 'error' && 'Connection Failed'}
          </h1>

          <p className="text-gray-600 mb-4">{message}</p>

          {status === 'processing' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-green-500">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}

          {status === 'error' && (
            <button
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors"
            >
              Close Window
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InstagramCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <InstagramCallbackContent />
    </Suspense>
  );
}
