'use client';

import { useState } from 'react';
import { ExternalLink, Key, User, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';

interface BlueskyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: {
    did: string;
    handle: string;
    displayName?: string;
    avatar?: string;
    credentials: {
      identifier: string;
      appPassword: string;
    };
  }) => void;
}

export function BlueskyConnectModal({
  isOpen,
  onClose,
  onSuccess,
}: BlueskyConnectModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!identifier || !appPassword) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.social.bluesky.connect(identifier, appPassword);

      onSuccess({
        ...result.profile,
        credentials: {
          identifier,
          appPassword,
        },
      });

      // Reset form
      setIdentifier('');
      setAppPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIdentifier('');
    setAppPassword('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Connect Bluesky Account"
      description="Connect your Bluesky account to publish posts directly"
      size="md"
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            How to get an App Password
          </h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Go to Bluesky Settings</li>
            <li>Navigate to Privacy and Security</li>
            <li>Click on App Passwords</li>
            <li>Create a new App Password</li>
          </ol>
          <a
            href="https://bsky.app/settings/app-passwords"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Open Bluesky App Passwords
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <Input
            label="Handle or Email"
            placeholder="user.bsky.social or email@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            disabled={isLoading}
            helperText="Your Bluesky handle (e.g., user.bsky.social) or email"
          />

          <Input
            label="App Password"
            type="password"
            placeholder="xxxx-xxxx-xxxx-xxxx"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            leftIcon={<Key className="w-4 h-4" />}
            disabled={isLoading}
            helperText="App Password from your Bluesky settings (not your main password)"
          />
        </div>

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
            Your credentials are stored securely and only used to post on your behalf.
            You can revoke access anytime from your Bluesky settings.
          </p>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleConnect}
          isLoading={isLoading}
          disabled={!identifier || !appPassword}
        >
          Connect Account
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default BlueskyConnectModal;
