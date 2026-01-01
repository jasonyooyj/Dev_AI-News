'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { StyleTemplate, Platform } from '@/types/news';
import { useStyleTemplatesStore } from '@/store';

/**
 * useStyleTemplates - Zustand store wrapper
 * (Style analysis feature removed)
 */
export function useStyleTemplates() {
  // Zustand store state and actions
  const templates = useStyleTemplatesStore((s) => s.templates);
  const addTemplateToStore = useStyleTemplatesStore((s) => s.addTemplate);
  const updateTemplateInStore = useStyleTemplatesStore((s) => s.updateTemplate);
  const deleteTemplateFromStore = useStyleTemplatesStore((s) => s.deleteTemplate);
  const setDefaultInStore = useStyleTemplatesStore((s) => s.setDefault);

  // Loading states
  const isLoading = false;
  const isAnalyzing = false;

  // Get templates by platform
  const getByPlatform = useCallback(
    (platform: Platform) => {
      return templates.filter((t) => t.platform === platform);
    },
    [templates]
  );

  // Get default template for platform
  const getDefault = useCallback(
    (platform: Platform) => {
      return templates.find((t) => t.platform === platform && t.isDefault);
    },
    [templates]
  );

  // Add template
  const addTemplate = useCallback(
    (data: Omit<StyleTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>) => {
      // Store handles isDefault automatically (first template for platform becomes default)
      addTemplateToStore({ ...data, isDefault: false });
      toast.success(`Template "${data.name}" created`);
      // Return the newly created template
      const newTemplates = useStyleTemplatesStore.getState().templates;
      return newTemplates.find((t) => t.name === data.name) || null;
    },
    [addTemplateToStore]
  );

  // Update template
  const updateTemplate = useCallback(
    (id: string, updates: Partial<StyleTemplate>) => {
      updateTemplateInStore(id, updates);
      toast.success('Template updated');
    },
    [updateTemplateInStore]
  );

  // Delete template
  const deleteTemplate = useCallback(
    (id: string) => {
      const template = templates.find((t) => t.id === id);
      deleteTemplateFromStore(id);
      toast.success(`Template "${template?.name || ''}" deleted`);
    },
    [templates, deleteTemplateFromStore]
  );

  // Set default template for platform
  const setDefault = useCallback(
    (platform: Platform, id: string) => {
      setDefaultInStore(platform, id);
      toast.success('Default template set');
    },
    [setDefaultInStore]
  );

  // Analyze examples to extract style
  const analyzeExamples = useCallback(
    async (examples: string[]): Promise<{
      tone: string;
      characteristics: string[];
    } | null> => {
      if (examples.length === 0) return null;

      try {
        const result = await analyzeStyleMutation.mutateAsync(examples);
        return {
          tone: result.tone || '',
          characteristics: result.characteristics || [],
        };
      } catch {
        return null;
      }
    },
    [analyzeStyleMutation]
  );

  // Create template from examples (analyze + create)
  const createTemplateFromExamples = useCallback(
    async (
      platform: Platform,
      name: string,
      examples: string[]
    ): Promise<StyleTemplate | null> => {
      const analysis = await analyzeExamples(examples);
      if (!analysis) return null;

      return addTemplate({
        platform,
        name,
        examples,
        tone: analysis.tone,
        characteristics: analysis.characteristics,
      });
    },
    [analyzeExamples, addTemplate]
  );

  // Refresh templates (no-op with Zustand - state is always fresh)
  const refreshTemplates = useCallback(() => {
    // Zustand state is reactive, no refresh needed
  }, []);

  return {
    templates,
    isLoading,
    isAnalyzing,
    getByPlatform,
    getDefault,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    setDefault,
    analyzeExamples,
    createTemplateFromExamples,
    refreshTemplates,
  };
}
