'use client';

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ButtonVariant, ButtonSize } from '@/components/ui/Button';

interface CopyButtonProps {
  content: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  label?: string;
  successLabel?: string;
  className?: string;
  onCopy?: () => void;
}

export function CopyButton({
  content,
  variant = 'secondary',
  size = 'sm',
  label = 'Copy',
  successLabel = 'Copied!',
  className = '',
  onCopy,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy?.();

      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [content, onCopy]);

  return (
    <Button
      variant={copied ? 'primary' : variant}
      size={size}
      onClick={handleCopy}
      leftIcon={
        copied ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )
      }
      className={`transition-all duration-200 ${className}`}
    >
      {copied ? successLabel : label}
    </Button>
  );
}

export default CopyButton;
