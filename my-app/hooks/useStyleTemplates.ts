'use client';

import { useState, useEffect, useCallback } from 'react';
import { StyleTemplate, Platform } from '@/types/news';
import {
  getStyleTemplates,
  getStyleTemplatesByPlatform,
  getDefaultStyleTemplate,
  addStyleTemplate as addStyleTemplateToStorage,
  updateStyleTemplate as updateStyleTemplateInStorage,
  deleteStyleTemplate as deleteStyleTemplateFromStorage,
  setDefaultStyleTemplate as setDefaultInStorage,
} from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export function useStyleTemplates() {
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setTemplates(getStyleTemplates());
    setIsLoading(false);
  }, []);

  const refreshTemplates = useCallback(() => {
    setTemplates(getStyleTemplates());
  }, []);

  const getByPlatform = useCallback((platform: Platform) => {
    return templates.filter((t) => t.platform === platform);
  }, [templates]);

  const getDefault = useCallback((platform: Platform) => {
    return templates.find((t) => t.platform === platform && t.isDefault);
  }, [templates]);

  const addTemplate = useCallback((data: Omit<StyleTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>) => {
    const now = new Date().toISOString();
    const newTemplate: StyleTemplate = {
      ...data,
      id: uuidv4(),
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };
    addStyleTemplateToStorage(newTemplate);
    refreshTemplates();
    return newTemplate;
  }, [refreshTemplates]);

  const updateTemplate = useCallback((id: string, updates: Partial<StyleTemplate>) => {
    updateStyleTemplateInStorage(id, updates);
    refreshTemplates();
  }, [refreshTemplates]);

  const deleteTemplate = useCallback((id: string) => {
    deleteStyleTemplateFromStorage(id);
    refreshTemplates();
  }, [refreshTemplates]);

  const setDefault = useCallback((platform: Platform, id: string) => {
    setDefaultInStorage(platform, id);
    refreshTemplates();
  }, [refreshTemplates]);

  // AI로 예시 텍스트 분석하여 스타일 추출
  const analyzeExamples = useCallback(async (examples: string[]): Promise<{
    tone: string;
    characteristics: string[];
  } | null> => {
    if (examples.length === 0) return null;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'analyze-style',
          examples,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze style');
      }

      const data = await response.json();
      return {
        tone: data.tone || '',
        characteristics: data.characteristics || [],
      };
    } catch (error) {
      console.error('Error analyzing style:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // 예시 분석 후 새 템플릿 생성
  const createTemplateFromExamples = useCallback(async (
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
  }, [analyzeExamples, addTemplate]);

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
