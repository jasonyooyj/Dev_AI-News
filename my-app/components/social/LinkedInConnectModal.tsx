'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ExternalLink, AlertCircle } from 'lucide-react';

interface LinkedInConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: {
    sub: string;
    name: string;
    email: string;
    picture?: string;
    credentials: {
      accessToken: string;
      personUrn: string;
      expiresAt: string;
      refreshToken?: string;
    };
  }) => void;
}

type ConnectionStep = 'idle' | 'opening' | 'waiting' | 'exchanging' | 'success' | 'error';

export function LinkedInConnectModal({
  isOpen,
  onClose,
  onSuccess,
}: LinkedInConnectModalProps) {
  const [step, setStep] = useState<ConnectionStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const expectedStateRef = useRef<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('idle');
      setError(null);
    } else {
      // Clean up popup if closed
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    }
  }, [isOpen]);

  // Listen for OAuth callback message
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Verify origin
      if (event.origin !== window.location.origin) return;

      // Check message type
      if (event.data?.type !== 'linkedin-oauth-callback') return;

      // Handle error from OAuth
      if (event.data.error) {
        setStep('error');
        setError(event.data.error);
        return;
      }

      // Handle success - exchange code for token
      if (event.data.code) {
        setStep('exchanging');

        try {
          const response = await fetch('/api/social/linkedin/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: event.data.code }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to complete authorization');
          }

          const data = await response.json();

          setStep('success');

          // Call success callback
          onSuccess({
            sub: data.profile.sub,
            name: data.profile.name,
            email: data.profile.email,
            picture: data.profile.picture,
            credentials: data.credentials,
          });

          // Close modal after short delay
          setTimeout(() => {
            onClose();
          }, 1500);
        } catch (err) {
          setStep('error');
          setError(err instanceof Error ? err.message : 'Failed to connect LinkedIn');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onClose]);

  // Poll to check if popup was closed manually
  useEffect(() => {
    if (step !== 'waiting') return;

    const interval = setInterval(() => {
      if (popupRef.current?.closed) {
        setStep('error');
        setError('Authorization window was closed');
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [step]);

  const handleConnect = async () => {
    setStep('opening');
    setError(null);

    try {
      // Get the OAuth URL from our API
      const response = await fetch('/api/social/linkedin/auth');
      if (!response.ok) {
        throw new Error('Failed to initialize LinkedIn connection');
      }

      const { authUrl, state } = await response.json();
      expectedStateRef.current = state;

      // Open popup window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      popupRef.current = window.open(
        authUrl,
        'linkedin-oauth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      );

      if (!popupRef.current) {
        throw new Error('Could not open authorization window. Please allow popups.');
      }

      setStep('waiting');
    } catch (err) {
      setStep('error');
      setError(err instanceof Error ? err.message : 'Failed to start connection');
    }
  };

  const handleRetry = () => {
    setStep('idle');
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect LinkedIn"
      size="sm"
    >
      <div className="space-y-4">
        {/* Description */}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Connect your LinkedIn account to publish posts directly from this app.
          You&apos;ll be redirected to LinkedIn to authorize access.
        </p>

        {/* Info Box */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>What we can do:</strong>
          </p>
          <ul className="text-sm text-blue-600 dark:text-blue-400 mt-1 space-y-1">
            <li>• Post content on your behalf</li>
            <li>• Share articles with rich previews</li>
            <li>• Access your basic profile info</li>
          </ul>
        </div>

        {/* Status Display */}
        {step === 'opening' && (
          <div className="flex items-center justify-center gap-3 py-4">
            <Spinner size="md" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Opening LinkedIn...
            </span>
          </div>
        )}

        {step === 'waiting' && (
          <div className="flex items-center justify-center gap-3 py-4">
            <Spinner size="md" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Waiting for authorization...
            </span>
          </div>
        )}

        {step === 'exchanging' && (
          <div className="flex items-center justify-center gap-3 py-4">
            <Spinner size="md" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Completing connection...
            </span>
          </div>
        )}

        {step === 'success' && (
          <div className="flex items-center justify-center gap-3 py-4 text-green-600 dark:text-green-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Connected successfully!</span>
          </div>
        )}

        {step === 'error' && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Connection failed
                </p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          {step === 'idle' && (
            <Button
              variant="primary"
              onClick={handleConnect}
              leftIcon={<ExternalLink className="w-4 h-4" />}
              className="bg-[#0077B5] hover:bg-[#006097]"
            >
              Connect with LinkedIn
            </Button>
          )}

          {step === 'error' && (
            <Button variant="primary" onClick={handleRetry}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default LinkedInConnectModal;
