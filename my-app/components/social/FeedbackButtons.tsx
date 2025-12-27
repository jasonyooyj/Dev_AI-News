'use client';

import { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  ChevronDown,
  X,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';

interface FeedbackButtonsProps {
  onThumbsUp?: () => void;
  onThumbsDown?: (feedback: string) => void;
  onRegenerate?: (feedback?: string) => void;
  isRegenerating?: boolean;
  disabled?: boolean;
}

interface QuickFeedbackOption {
  id: string;
  label: string;
}

const QUICK_FEEDBACK_OPTIONS: QuickFeedbackOption[] = [
  { id: 'too-formal', label: 'Too formal' },
  { id: 'too-casual', label: 'Too casual' },
  { id: 'too-long', label: 'Too long' },
  { id: 'too-short', label: 'Too short' },
  { id: 'more-hashtags', label: 'More hashtags' },
  { id: 'less-hashtags', label: 'Less hashtags' },
  { id: 'more-engaging', label: 'More engaging' },
  { id: 'more-professional', label: 'More professional' },
];

type FeedbackState = 'idle' | 'thumbs-up' | 'feedback-open';

export function FeedbackButtons({
  onThumbsUp,
  onThumbsDown,
  onRegenerate,
  isRegenerating = false,
  disabled = false,
}: FeedbackButtonsProps) {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('idle');
  const [customFeedback, setCustomFeedback] = useState('');
  const [selectedQuickFeedback, setSelectedQuickFeedback] = useState<string[]>([]);

  const handleThumbsUp = () => {
    setFeedbackState('thumbs-up');
    onThumbsUp?.();
  };

  const handleThumbsDown = () => {
    setFeedbackState('feedback-open');
  };

  const handleQuickFeedbackToggle = (feedbackId: string) => {
    setSelectedQuickFeedback((prev) =>
      prev.includes(feedbackId)
        ? prev.filter((id) => id !== feedbackId)
        : [...prev, feedbackId]
    );
  };

  const handleSubmitFeedback = () => {
    const quickFeedbackLabels = selectedQuickFeedback
      .map((id) => QUICK_FEEDBACK_OPTIONS.find((opt) => opt.id === id)?.label)
      .filter((label): label is string => Boolean(label));

    const feedbackParts = [...quickFeedbackLabels];
    if (customFeedback.trim()) {
      feedbackParts.push(customFeedback.trim());
    }

    const combinedFeedback = feedbackParts.join('. ');

    if (combinedFeedback) {
      onThumbsDown?.(combinedFeedback);
      onRegenerate?.(combinedFeedback);
    }

    // Reset state after submission
    setFeedbackState('idle');
    setCustomFeedback('');
    setSelectedQuickFeedback([]);
  };

  const handleCloseFeedback = () => {
    setFeedbackState('idle');
    setCustomFeedback('');
    setSelectedQuickFeedback([]);
  };

  const handleSimpleRegenerate = () => {
    onRegenerate?.();
  };

  if (feedbackState === 'thumbs-up') {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
        <ThumbsUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          Thanks for your feedback!
        </span>
        <button
          onClick={() => setFeedbackState('idle')}
          className="ml-auto text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (feedbackState === 'feedback-open') {
    return (
      <div className="space-y-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            What could be improved?
          </span>
          <button
            onClick={handleCloseFeedback}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick feedback options */}
        <div className="flex flex-wrap gap-2">
          {QUICK_FEEDBACK_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleQuickFeedbackToggle(option.id)}
              className={`
                px-3 py-1.5 text-sm rounded-full transition-all duration-150
                ${
                  selectedQuickFeedback.includes(option.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600 hover:border-blue-400 dark:hover:border-blue-500'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Custom feedback input */}
        <Textarea
          placeholder="Add specific feedback (optional)..."
          value={customFeedback}
          onChange={(e) => setCustomFeedback(e.target.value)}
          className="min-h-[80px]"
        />

        {/* Submit button */}
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseFeedback}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmitFeedback}
            disabled={selectedQuickFeedback.length === 0 && !customFeedback.trim()}
            isLoading={isRegenerating}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Regenerate with Feedback
          </Button>
        </div>
      </div>
    );
  }

  // Default idle state - show buttons
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-500 dark:text-zinc-400 mr-2">
        How is this content?
      </span>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleThumbsUp}
        disabled={disabled || isRegenerating}
        className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
      >
        <ThumbsUp className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleThumbsDown}
        disabled={disabled || isRegenerating}
        className="text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <ThumbsDown className="w-4 h-4" />
      </Button>

      <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />

      <Button
        variant="secondary"
        size="sm"
        onClick={handleSimpleRegenerate}
        disabled={disabled}
        isLoading={isRegenerating}
        leftIcon={!isRegenerating ? <RefreshCw className="w-4 h-4" /> : undefined}
      >
        Regenerate
      </Button>
    </div>
  );
}

export default FeedbackButtons;
