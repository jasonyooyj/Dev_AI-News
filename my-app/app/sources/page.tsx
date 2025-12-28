'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { SourceList } from '@/components/sources/SourceList';
import { SourceForm } from '@/components/sources/SourceForm';
import { useSources } from '@/hooks/useSources';
import { Source } from '@/types/news';

export default function SourcesPage() {
  const { sources, isLoading, addSource, updateSource, deleteSource, toggleSource } = useSources();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

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
      <MainLayout sources={sources}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout sources={sources}>
      <div className="space-y-6">
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
  );
}
