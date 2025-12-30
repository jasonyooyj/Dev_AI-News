'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Sparkles,
  Star,
  Edit2,
  Trash2,
  FileText,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Platform, StyleTemplate, PLATFORM_CONFIGS } from '@/types/news';

// Platform icons mapping
const PlatformIcon = ({ platform }: { platform: Platform }) => {
  const iconClass = 'w-4 h-4';

  switch (platform) {
    case 'twitter':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'threads':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.781 3.632 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.9-.746 2.17-1.186 3.577-1.239l.054-.002c.328-.005.66.006.994.032-.02-.335-.07-.664-.152-.983-.293-1.143-.903-2.008-1.813-2.572-1.043-.647-2.397-.838-3.735-.564l-.446-1.97c1.757-.36 3.587-.12 5.023.687 1.32.74 2.274 1.9 2.756 3.357.138.416.235.843.293 1.279.907.413 1.705.946 2.373 1.587.795.762 1.378 1.662 1.731 2.675.486 1.395.46 3.37-.783 5.006-1.643 2.165-4.151 3.088-7.461 3.088zm.589-8.083c-.956.034-1.766.298-2.32.756-.476.395-.693.878-.665 1.48.035.71.402 1.183.994 1.566.65.422 1.509.62 2.419.566 1.132-.06 2.01-.467 2.612-1.214.538-.669.927-1.643 1.049-2.792-.608-.209-1.263-.357-1.954-.4a8.723 8.723 0 0 0-2.135.038z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    default:
      return null;
  }
};

// Platform badge variant mapping
const getPlatformBadgeVariant = (platform: Platform): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  switch (platform) {
    case 'twitter':
      return 'default';
    case 'threads':
      return 'default';
    case 'instagram':
      return 'danger';
    case 'linkedin':
      return 'info';
    default:
      return 'default';
  }
};

interface StyleEditorProps {
  templates: StyleTemplate[];
  onAddTemplate: (template: Omit<StyleTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>) => void;
  onUpdateTemplate: (id: string, updates: Partial<StyleTemplate>) => void;
  onDeleteTemplate: (id: string) => void;
  onSetDefault: (platform: Platform, id: string) => void;
  onAnalyzeExamples: (examples: string[]) => Promise<{ tone: string; characteristics: string[] } | null>;
  isAnalyzing?: boolean;
}

interface TemplateFormData {
  platform: Platform;
  name: string;
  examples: string[];
  tone?: string;
  characteristics?: string[];
}

const PLATFORMS: Platform[] = ['twitter', 'threads', 'instagram', 'linkedin'];

const initialFormData: TemplateFormData = {
  platform: 'twitter',
  name: '',
  examples: [''],
  tone: undefined,
  characteristics: undefined,
};

// Template Card Component
function TemplateCard({
  template,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  template: StyleTemplate;
  onEdit: (template: StyleTemplate) => void;
  onDelete: (template: StyleTemplate) => void;
  onSetDefault: (platform: Platform, id: string) => void;
}) {
  return (
    <Card
      variant="default"
      padding="none"
      className="group transition-all duration-200 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`
                flex items-center justify-center w-10 h-10 rounded-lg
                ${template.platform === 'twitter' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : ''}
                ${template.platform === 'threads' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : ''}
                ${template.platform === 'instagram' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' : ''}
                ${template.platform === 'linkedin' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}
              `}
            >
              <PlatformIcon platform={template.platform} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {template.name}
                </h3>
                {template.isDefault && (
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                )}
              </div>
              <Badge variant={getPlatformBadgeVariant(template.platform)} size="sm">
                {PLATFORM_CONFIGS[template.platform].name}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(template)}
              aria-label="Edit template"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(template)}
              aria-label="Delete template"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tone */}
        {template.tone && (
          <div className="mb-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
              {template.tone}
            </p>
          </div>
        )}

        {/* Characteristics */}
        {template.characteristics && template.characteristics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {template.characteristics.slice(0, 4).map((char, index) => (
              <Badge
                key={index}
                variant="default"
                size="sm"
                className="bg-zinc-50 dark:bg-zinc-800/50"
              >
                {char}
              </Badge>
            ))}
            {template.characteristics.length > 4 && (
              <Badge variant="default" size="sm" className="bg-zinc-50 dark:bg-zinc-800/50">
                +{template.characteristics.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <FileText className="w-3.5 h-3.5" />
            <span>{template.examples.length} examples</span>
          </div>

          <button
            onClick={() => onSetDefault(template.platform, template.id)}
            disabled={template.isDefault}
            className={`
              flex items-center gap-1.5 text-xs font-medium rounded-md px-2 py-1 transition-colors
              ${
                template.isDefault
                  ? 'text-amber-600 dark:text-amber-400 cursor-default'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              }
            `}
            aria-label={template.isDefault ? 'Default template' : 'Set as default'}
          >
            <Star
              className={`w-3.5 h-3.5 ${template.isDefault ? 'fill-current' : ''}`}
            />
            {template.isDefault ? 'Default' : 'Set default'}
          </button>
        </div>
      </div>
    </Card>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  templateName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  templateName: string;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Template" size="sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <p className="text-zinc-700 dark:text-zinc-300">
            Are you sure you want to delete{' '}
            <span className="font-semibold">&quot;{templateName}&quot;</span>? This action
            cannot be undone.
          </p>
        </div>
      </div>
      <ModalFooter className="-mx-5 -mb-5 mt-6">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Main StyleEditor Component
export function StyleEditor({
  templates,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onSetDefault,
  onAnalyzeExamples,
  isAnalyzing = false,
}: StyleEditorProps) {
  const [activeFilter, setActiveFilter] = useState<Platform | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<StyleTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
  const [deleteTarget, setDeleteTarget] = useState<StyleTemplate | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filter templates by platform
  const filteredTemplates = useMemo(() => {
    if (activeFilter === 'all') return templates;
    return templates.filter((t) => t.platform === activeFilter);
  }, [templates, activeFilter]);

  // Group templates by platform for display
  const templatesByPlatform = useMemo(() => {
    const grouped: Record<Platform, StyleTemplate[]> = {
      twitter: [],
      bluesky: [],
      threads: [],
      instagram: [],
      linkedin: [],
    };
    filteredTemplates.forEach((t) => {
      grouped[t.platform].push(t);
    });
    return grouped;
  }, [filteredTemplates]);

  // Count templates per platform
  const platformCounts = useMemo(() => {
    const counts: Record<Platform | 'all', number> = {
      all: templates.length,
      twitter: 0,
      bluesky: 0,
      threads: 0,
      instagram: 0,
      linkedin: 0,
    };
    templates.forEach((t) => {
      counts[t.platform]++;
    });
    return counts;
  }, [templates]);

  // Form handlers
  const openAddForm = () => {
    setEditingTemplate(null);
    setFormData(initialFormData);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEditForm = (template: StyleTemplate) => {
    setEditingTemplate(template);
    setFormData({
      platform: template.platform,
      name: template.name,
      examples: template.examples.length > 0 ? template.examples : [''],
      tone: template.tone,
      characteristics: template.characteristics,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTemplate(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Template name is required';
    }

    const nonEmptyExamples = formData.examples.filter((e) => e.trim());
    if (nonEmptyExamples.length === 0) {
      errors.examples = 'At least one example is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const nonEmptyExamples = formData.examples.filter((e) => e.trim());

    if (editingTemplate) {
      onUpdateTemplate(editingTemplate.id, {
        platform: formData.platform,
        name: formData.name.trim(),
        examples: nonEmptyExamples,
        tone: formData.tone,
        characteristics: formData.characteristics,
      });
    } else {
      onAddTemplate({
        platform: formData.platform,
        name: formData.name.trim(),
        examples: nonEmptyExamples,
        tone: formData.tone,
        characteristics: formData.characteristics,
      });
    }

    closeForm();
  };

  const handleAnalyze = async () => {
    const nonEmptyExamples = formData.examples.filter((e) => e.trim());
    if (nonEmptyExamples.length === 0) {
      setFormErrors({ examples: 'Add at least one example to analyze' });
      return;
    }

    const result = await onAnalyzeExamples(nonEmptyExamples);
    if (result) {
      setFormData((prev) => ({
        ...prev,
        tone: result.tone,
        characteristics: result.characteristics,
      }));
    }
  };

  const addExample = () => {
    setFormData((prev) => ({
      ...prev,
      examples: [...prev.examples, ''],
    }));
  };

  const removeExample = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index),
    }));
  };

  const updateExample = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      examples: prev.examples.map((e, i) => (i === index ? value : e)),
    }));
  };

  const handleDeleteClick = (template: StyleTemplate) => {
    setDeleteTarget(template);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDeleteTemplate(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Style Templates
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {templates.length} templates across {PLATFORMS.filter((p) => platformCounts[p] > 0).length} platforms
          </p>
        </div>
        <Button
          variant="primary"
          onClick={openAddForm}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Template
        </Button>
      </div>

      {/* Platform Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveFilter('all')}
          className={`
            flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
            ${
              activeFilter === 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }
          `}
        >
          All
          <span className="text-xs opacity-70">({platformCounts.all})</span>
        </button>
        {PLATFORMS.map((platform) => (
          <button
            key={platform}
            onClick={() => setActiveFilter(platform)}
            className={`
              flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
              ${
                activeFilter === platform
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }
            `}
          >
            <PlatformIcon platform={platform} />
            {PLATFORM_CONFIGS[platform].name}
            <span className="text-xs opacity-70">({platformCounts[platform]})</span>
          </button>
        ))}
      </div>

      {/* Templates Grid or Empty State */}
      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Sparkles className="w-8 h-8 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              No templates yet
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              {activeFilter === 'all'
                ? 'Create your first style template to personalize AI-generated content'
                : `No templates for ${PLATFORM_CONFIGS[activeFilter].name}`}
            </p>
            <Button
              variant="primary"
              onClick={openAddForm}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Template
            </Button>
          </div>
        </div>
      ) : activeFilter === 'all' ? (
        // Show grouped by platform when "All" is selected
        <div className="space-y-8">
          {PLATFORMS.map((platform) => {
            const platformTemplates = templatesByPlatform[platform];
            if (platformTemplates.length === 0) return null;

            return (
              <div key={platform}>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={`
                      flex items-center justify-center w-6 h-6 rounded
                      ${platform === 'twitter' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : ''}
                      ${platform === 'threads' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : ''}
                      ${platform === 'instagram' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' : ''}
                      ${platform === 'linkedin' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}
                    `}
                  >
                    <PlatformIcon platform={platform} />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {PLATFORM_CONFIGS[platform].name}
                  </h3>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    ({platformTemplates.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {platformTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onEdit={openEditForm}
                      onDelete={handleDeleteClick}
                      onSetDefault={onSetDefault}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Show flat grid when a specific platform is selected
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={openEditForm}
              onDelete={handleDeleteClick}
              onSetDefault={onSetDefault}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingTemplate ? 'Edit Template' : 'Add New Template'}
        description="Create a style template by providing example texts. AI will analyze the style and characteristics."
        size="lg"
      >
        <div className="space-y-5">
          {/* Platform Selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Platform
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, platform }))}
                  className={`
                    flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all
                    ${
                      formData.platform === platform
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }
                  `}
                >
                  <PlatformIcon platform={platform} />
                  <span className="hidden sm:inline">{PLATFORM_CONFIGS[platform].name}</span>
                  <span className="sm:hidden">{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Template Name */}
          <Input
            label="Template Name"
            placeholder="e.g., My Twitter Style"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            error={formErrors.name}
          />

          {/* Examples */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Example Texts
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addExample}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Example
              </Button>
            </div>
            <div className="space-y-3">
              {formData.examples.map((example, index) => (
                <div key={index} className="relative">
                  <Textarea
                    placeholder={`Example ${index + 1}: Paste a sample post in your style...`}
                    value={example}
                    onChange={(e) => updateExample(index, e.target.value)}
                    className="pr-10"
                  />
                  {formData.examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExample(index)}
                      className="absolute top-2 right-2 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      aria-label="Remove example"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {formErrors.examples && (
              <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">
                {formErrors.examples}
              </p>
            )}
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Add 3-5 examples for best results. The AI will analyze these to understand your writing style.
            </p>
          </div>

          {/* Analyze Button */}
          <div className="flex items-center justify-center py-2">
            <Button
              variant="secondary"
              onClick={handleAnalyze}
              isLoading={isAnalyzing}
              leftIcon={<Sparkles className="w-4 h-4" />}
              disabled={formData.examples.filter((e) => e.trim()).length === 0}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Style'}
            </Button>
          </div>

          {/* Analysis Results */}
          {(formData.tone || (formData.characteristics && formData.characteristics.length > 0)) && (
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Analysis Results
              </div>

              {formData.tone && (
                <div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                    Tone
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{formData.tone}</p>
                </div>
              )}

              {formData.characteristics && formData.characteristics.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                    Characteristics
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.characteristics.map((char, index) => (
                      <Badge key={index} variant="info" size="sm">
                        {char}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <ModalFooter className="-mx-5 -mb-5 mt-6">
          <Button variant="secondary" onClick={closeForm}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {editingTemplate ? 'Save Changes' : 'Create Template'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        templateName={deleteTarget?.name || ''}
      />
    </div>
  );
}

export default StyleEditor;
