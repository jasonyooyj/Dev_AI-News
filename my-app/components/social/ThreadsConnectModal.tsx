'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface ThreadsConnectModalProps {
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

export function ThreadsConnectModal({
  isOpen,
  onClose,
  onSuccess,
}: ThreadsConnectModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authWindow, setAuthWindow] = useState<Window | null>(null);
  const [waitingForCallback, setWaitingForCallback] = useState(false);

  // Listen for OAuth callback message
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'threads-oauth-callback') {
        setWaitingForCallback(false);
        authWindow?.close();
        setAuthWindow(null);

        if (event.data.error) {
          setError(event.data.error);
          return;
        }

        if (event.data.code) {
          await handleCallback(event.data.code);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [authWindow]);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get OAuth URL from server
      const response = await fetch('/api/social/threads/auth');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start authentication');
      }

      // Store state for verification
      sessionStorage.setItem('threads_oauth_state', data.state);

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        data.authUrl,
        'threads-oauth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      );

      if (popup) {
        setAuthWindow(popup);
        setWaitingForCallback(true);

        // Poll to check if popup was closed
        const pollTimer = setInterval(() => {
          if (popup.closed) {
            clearInterval(pollTimer);
            setWaitingForCallback(false);
            setAuthWindow(null);
            setIsLoading(false);
          }
        }, 500);
      } else {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsLoading(false);
    }
  };

  const handleCallback = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.social.threads.callback(code);

      onSuccess({
        id: result.profile.id,
        username: result.profile.username,
        name: result.profile.name,
        profilePictureUrl: result.profile.profilePictureUrl,
        credentials: result.credentials,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    authWindow?.close();
    setAuthWindow(null);
    setWaitingForCallback(false);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Connect Threads Account"
      description="Connect your Threads account to publish posts directly"
      size="md"
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
            How to connect Threads
          </h4>
          <ol className="text-sm text-purple-800 dark:text-purple-200 space-y-1 list-decimal list-inside">
            <li>Click "Connect with Threads" below</li>
            <li>Log in to your Threads account</li>
            <li>Authorize this app to post on your behalf</li>
            <li>You'll be redirected back automatically</li>
          </ol>
        </div>

        {/* Status */}
        {waitingForCallback && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Waiting for authorization...
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Complete the login in the popup window
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Security Note */}
        <div className="flex items-start gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            We use official Meta OAuth. Your login credentials are never stored.
            You can revoke access anytime from your Threads settings.
          </p>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleConnect}
          isLoading={isLoading || waitingForCallback}
          disabled={waitingForCallback}
          leftIcon={
            !isLoading && !waitingForCallback ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.812-.674 1.928-1.077 3.23-1.166.93-.064 1.89-.025 2.854.115.09-.542.132-1.123.119-1.73-.032-1.655-.592-2.587-1.768-2.94-.545-.163-1.187-.207-1.907-.132-.72.076-1.327.27-1.806.577-.574.37-.996.907-1.257 1.598l-1.953-.583c.377-1.016.998-1.84 1.847-2.452.75-.54 1.63-.894 2.615-1.052.984-.158 1.975-.132 2.944.077 2.18.473 3.49 1.882 3.537 4.377.018.93-.058 1.78-.222 2.527 1.09.474 1.955 1.183 2.528 2.112.767 1.244 1.02 2.878.535 4.49-.694 2.305-2.396 3.854-5.063 4.604-1.076.303-2.263.441-3.54.412zm.893-7.74c-.078-1.873-1.405-2.574-2.802-2.478-1.197.082-2.478.698-2.399 2.232.048.918.447 1.528 1.187 1.817.737.287 1.624.32 2.49.015 1.083-.383 1.476-1.039 1.524-1.586z" />
              </svg>
            ) : undefined
          }
        >
          {waitingForCallback ? 'Waiting...' : 'Connect with Threads'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default ThreadsConnectModal;
