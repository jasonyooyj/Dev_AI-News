'use client';

import { useEffect, useCallback, HTMLAttributes, forwardRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw] max-h-[90vh]',
};

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      description,
      size = 'md',
      showCloseButton = true,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const handleEscape = useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      },
      [onClose]
    );

    useEffect(() => {
      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 animate-in fade-in duration-150"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Content */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
          className={`
            relative z-10 w-full ${sizeStyles[size]}
            bg-white dark:bg-zinc-900
            border border-zinc-200 dark:border-zinc-800
            rounded-xl shadow-2xl
            animate-in zoom-in-95 fade-in duration-200
            max-h-[85vh] overflow-hidden flex flex-col
            mx-4
            ${className}
          `}
          {...props}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex-1 pr-4">
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="modal-description"
                    className="mt-1 text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="flex-shrink-0 -mr-2 -mt-1"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          flex items-center justify-end gap-3
          p-5 border-t border-zinc-200 dark:border-zinc-800
          bg-zinc-50 dark:bg-zinc-900/50
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ModalFooter.displayName = 'ModalFooter';

export default Modal;
