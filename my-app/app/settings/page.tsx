'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { StyleEditor } from '@/components/settings/StyleEditor';
import { useStyleTemplates } from '@/hooks/useStyleTemplates';

export default function SettingsPage() {
  const {
    templates,
    isLoading,
    isAnalyzing,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    setDefault,
    analyzeExamples,
  } = useStyleTemplates();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your style templates and customize AI-generated content.
          </p>
        </div>

        {/* Style Editor */}
        <StyleEditor
          templates={templates}
          onAddTemplate={addTemplate}
          onUpdateTemplate={updateTemplate}
          onDeleteTemplate={deleteTemplate}
          onSetDefault={setDefault}
          onAnalyzeExamples={analyzeExamples}
          isAnalyzing={isAnalyzing}
        />
      </div>
    </MainLayout>
  );
}
