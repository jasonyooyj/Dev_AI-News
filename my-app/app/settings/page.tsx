'use client';

import Link from 'next/link';
import { Link2, ChevronRight, Palette } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StyleEditor } from '@/components/settings/StyleEditor';
import { Card } from '@/components/ui/Card';
import { useStyleTemplates } from '@/hooks/useStyleTemplates';
import { useSources } from '@/hooks/useSources';
import { useSocialConnections } from '@/hooks/useSocialConnections';

export default function SettingsPage() {
  const { sources } = useSources();
  const { connections } = useSocialConnections();
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

  const connectedCount = connections.filter((c) => c.isConnected).length;

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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Settings Navigation */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Social Connections Card */}
          <Link href="/settings/connections">
            <Card
              variant="bordered"
              padding="md"
              className="hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                      Social Connections
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {connectedCount > 0
                        ? `${connectedCount} account${connectedCount > 1 ? 's' : ''} connected`
                        : 'Connect your social accounts'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
              </div>
            </Card>
          </Link>

          {/* Style Templates Card (scroll to section) */}
          <a href="#style-templates">
            <Card
              variant="bordered"
              padding="md"
              className="hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                    <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                      Style Templates
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {templates.length} template{templates.length !== 1 ? 's' : ''} created
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
              </div>
            </Card>
          </a>
        </div>

        {/* Style Editor Section */}
        <div id="style-templates" className="pt-4">
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
      </div>
    </MainLayout>
  );
}
