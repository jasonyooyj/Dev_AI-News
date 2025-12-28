'use client';

import { useState } from 'react';
import { useMigration } from '@/hooks/useMigration';
import { useAuthContext } from '@/components/auth/AuthProvider';
import {
  Database,
  CloudUpload,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react';

export function MigrationDialog() {
  const { user } = useAuthContext();
  const {
    hasMigratableData,
    isChecking,
    isMigrating,
    progress,
    error,
    data,
    migrateToFirestore,
    dismissMigration,
  } = useMigration();

  const [isOpen, setIsOpen] = useState(true);
  const [migrationComplete, setMigrationComplete] = useState(false);

  // Don't show if not authenticated, no data to migrate, or dialog closed
  if (!user || isChecking || !hasMigratableData || !isOpen) {
    return null;
  }

  const handleMigrate = async () => {
    const success = await migrateToFirestore(user.uid);
    if (success) {
      setMigrationComplete(true);
    }
  };

  const handleDismiss = () => {
    dismissMigration();
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Calculate totals
  const sourcesCount = data?.sources.length ?? 0;
  const newsCount = data?.newsItems.length ?? 0;
  const templatesCount = data?.styleTemplates.length ?? 0;
  const totalItems = sourcesCount + newsCount + templatesCount;

  // Calculate progress percentage
  const progressPercent = progress
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Data Migration
            </h2>
          </div>
          {!isMigrating && !migrationComplete && (
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {migrationComplete ? (
            // Success state
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Migration Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your data has been successfully migrated to the cloud.
                You can now access it from any device.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Get Started
              </button>
            </div>
          ) : error ? (
            // Error state
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Migration Failed
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {error}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                Your local data is still intact. Please try again.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleMigrate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : isMigrating ? (
            // Migrating state
            <div className="py-4">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <CloudUpload className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                  <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin absolute -bottom-1 -right-1" />
                </div>
              </div>

              <h3 className="text-center text-lg font-medium text-gray-900 dark:text-white mb-2">
                Migrating Your Data...
              </h3>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
                {progress?.currentStep === 'sources' && 'Uploading news sources...'}
                {progress?.currentStep === 'newsItems' && 'Uploading news items...'}
                {progress?.currentStep === 'styleTemplates' && 'Uploading style templates...'}
                {progress?.currentStep === 'done' && 'Finishing up...'}
              </p>

              {/* Progress bar */}
              <div className="relative mb-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <p className="text-center text-xs text-gray-500 dark:text-gray-500">
                {progress?.completed ?? 0} of {progress?.total ?? 0} items ({progressPercent}%)
              </p>
            </div>
          ) : (
            // Initial state
            <>
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-5">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                    Local Data Found
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    We found existing data stored in your browser. Would you like to migrate it to the cloud?
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">News Sources</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{sourcesCount}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">News Items</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{newsCount}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Style Templates</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{templatesCount}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Items</span>
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-100">{totalItems}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium rounded-lg transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleMigrate}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CloudUpload className="w-4 h-4" />
                  Migrate Now
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
