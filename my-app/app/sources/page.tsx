'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { SourceList } from '@/components/sources/SourceList';
import { SourceForm } from '@/components/sources/SourceForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useSources } from '@/hooks/useSources';
import { useSourcesStore } from '@/store';
import { Source } from '@/types/news';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Force dynamic rendering to prevent prerendering errors
// This page uses useSearchParams() and localStorage which are client-only
export const dynamic = 'force-dynamic';

function SourcesPageContent() {
  const { sources, isLoading, addSource, updateSource, deleteSource, toggleSource } = useSources();
  const removeDuplicates = useSourcesStore((s) => s.removeDuplicates);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [isRemovingDuplicates, setIsRemovingDuplicates] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Count duplicates
  const getDuplicateCount = () => {
    const seen = new Set<string>();
    let count = 0;
    for (const source of sources) {
      const url = source.websiteUrl.toLowerCase();
      if (seen.has(url)) {
        count++;
      } else {
        seen.add(url);
      }
    }
    return count;
  };

  const duplicateCount = getDuplicateCount();

  const handleRemoveDuplicates = async () => {
    if (duplicateCount === 0) {
      toast.info('No duplicate sources found');
      return;
    }

    setIsRemovingDuplicates(true);
    try {
      await removeDuplicates();
      toast.success(`Removed ${duplicateCount} duplicate sources`);
    } catch (error) {
      toast.error('Failed to remove duplicates');
      console.error(error);
    } finally {
      setIsRemovingDuplicates(false);
    }
  };

  // Check for ?add=true query param
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setIsFormOpen(true);
      // Remove the query param
      router.replace('/sources');
    }
  }, [searchParams, router]);

  const handleAdd = () => {
    setEditingSource(null);
    setIsFormOpen(true);
  };

  const handleEdit = (source: Source) => {
    setEditingSource(source);
    setIsFormOpen(true);
  };

  const handleSubmit = (data: Omit<Source, 'id' | 'lastFetchedAt'>) => {
    if (editingSource) {
      updateSource(editingSource.id, data);
    } else {
      addSource(data);
    }
    setIsFormOpen(false);
    setEditingSource(null);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingSource(null);
  };

  const handleDelete = (source: Source) => {
    if (confirm('Are you sure you want to delete this source?')) {
      deleteSource(source.id);
    }
  };

  const handleToggle = (source: Source) => {
    toggleSource(source.id);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <MainLayout sources={sources}>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout sources={sources}>
        <div className="space-y-6">
          {/* Duplicate Warning */}
          {duplicateCount > 0 && (
            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {duplicateCount} duplicate source{duplicateCount > 1 ? 's' : ''} found
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Sources with the same URL will be removed, keeping the first occurrence.
                </p>
              </div>
              <button
                onClick={handleRemoveDuplicates}
                disabled={isRemovingDuplicates}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {isRemovingDuplicates ? 'Removing...' : 'Remove Duplicates'}
              </button>
            </div>
          )}

          {/* Source List */}
          <SourceList
            sources={sources}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggle={handleToggle}
            onAdd={handleAdd}
          />

          {/* Add/Edit Form Modal */}
          <SourceForm
            isOpen={isFormOpen}
            onClose={handleClose}
            onSubmit={handleSubmit}
            source={editingSource}
          />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

export default function SourcesPage() {
  return (
    <Suspense fallback={
      <MainLayout sources={[]}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    }>
      <SourcesPageContent />
    </Suspense>
  );
}
