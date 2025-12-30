'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ExternalLink, AlertCircle, Camera, CheckCircle2, Info } from 'lucide-react';

interface InstagramProfile {
  id: string;
  username: string;
  name?: string;
  profilePictureUrl?: string;
  accountType?: 'BUSINESS' | 'CREATOR' | 'MEDIA_CREATOR';
}

interface InstagramConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: {
    id: string;
    username: string;
    name?: string;
    profilePictureUrl?: string;
    credentials: {
      accessToken: string;
      userId: string;
      expiresAt: string;
    };
  }) => void;
}

type ModalState =
  | 'idle'
  | 'opening'
  | 'waiting'
  | 'exchanging'
  | 'success'
  | 'error';

export function InstagramConnectModal({
  isOpen,
  onClose,
  onSuccess,
}: InstagramConnectModalProps) {
  const [state, setState] = useState<ModalState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setState('idle');
      setError(null);
      setProfile(null);
    }
  }, [isOpen]);

  // Handle popup message
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Verify origin
      if (event.origin !== window.location.origin) return;

      const { type, profile: profileData, credentials, error: authError } = event.data;

      if (type === 'INSTAGRAM_AUTH_SUCCESS') {
        setProfile(profileData);
        setState('success');

        // Call onSuccess after brief delay
        setTimeout(() => {
          onSuccess({
            ...profileData,
            credentials,
          });
          onClose();
        }, 1500);
      } else if (type === 'INSTAGRAM_AUTH_ERROR') {
        setError(authError || 'Authentication failed');
        setState('error');
      }
    },
    [onSuccess, onClose]
  );

  // Set up message listener
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Monitor popup window
  useEffect(() => {
    if (!popupWindow || state !== 'waiting') return;

    const checkPopup = setInterval(() => {
      if (popupWindow.closed) {
        clearInterval(checkPopup);
        if (state === 'waiting') {
          setState('idle');
        }
        setPopupWindow(null);
      }
    }, 500);

    return () => clearInterval(checkPopup);
  }, [popupWindow, state]);

  const handleConnect = async () => {
    setState('opening');
    setError(null);

    try {
      // Get auth URL from our API
      const response = await fetch('/api/social/instagram/auth');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get authorization URL');
      }

      // Open popup window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        data.authUrl,
        'instagram-auth',
        `width=${width},height=${height},left=${left},top=${top},popup=1`
      );

      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }

      setPopupWindow(popup);
      setState('waiting');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start authentication');
      setState('error');
    }
  };

  const handleRetry = () => {
    setState('idle');
    setError(null);
    setProfile(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect Instagram">
      <div className="space-y-6">
        {/* Info about Business/Creator accounts */}
        <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium mb-1">Business or Creator Account Required</p>
            <p className="text-amber-700 dark:text-amber-300">
              Instagram API only works with Business or Creator accounts.
              Personal accounts cannot post via API.
            </p>
          </div>
        </div>

        {/* Image requirement notice */}
        <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Image Required</p>
            <p className="text-blue-700 dark:text-blue-300">
              Instagram posts require an image. Text-only posts are not supported.
            </p>
          </div>
        </div>

        {/* Idle State */}
        {state === 'idle' && (
          <>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Connect your Instagram account
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                You&apos;ll be redirected to Instagram to authorize access
              </p>
            </div>

            <Button
              onClick={handleConnect}
              className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect with Instagram
            </Button>
          </>
        )}

        {/* Opening State */}
        {state === 'opening' && (
          <div className="text-center py-8">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400">
              Opening Instagram authorization...
            </p>
          </div>
        )}

        {/* Waiting State */}
        {state === 'waiting' && (
          <div className="text-center py-8">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400 mb-2">
              Waiting for authorization...
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Complete the login in the popup window
            </p>
          </div>
        )}

        {/* Exchanging State */}
        {state === 'exchanging' && (
          <div className="text-center py-8">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400">
              Completing authentication...
            </p>
          </div>
        )}

        {/* Success State */}
        {state === 'success' && profile && (
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Connected!
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              @{profile.username}
              {profile.accountType && (
                <span className="ml-2 px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded text-xs">
                  {profile.accountType}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
              Connection Failed
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{error}</p>
            <Button onClick={handleRetry} variant="secondary">
              Try Again
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
