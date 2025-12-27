'use client';

import { HTMLAttributes, forwardRef } from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  color?: 'primary' | 'white' | 'current';
  label?: string;
}

const sizeStyles: Record<SpinnerSize, { container: string; svg: string }> = {
  sm: { container: 'w-4 h-4', svg: 'w-4 h-4' },
  md: { container: 'w-6 h-6', svg: 'w-6 h-6' },
  lg: { container: 'w-8 h-8', svg: 'w-8 h-8' },
  xl: { container: 'w-12 h-12', svg: 'w-12 h-12' },
};

const colorStyles = {
  primary: 'text-blue-600 dark:text-blue-400',
  white: 'text-white',
  current: 'text-current',
};

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', color = 'primary', label, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label={label || 'Loading'}
        className={`
          inline-flex items-center justify-center
          ${sizeStyles[size].container}
          ${colorStyles[color]}
          ${className}
        `}
        {...props}
      >
        <svg
          className={`animate-spin ${sizeStyles[size].svg}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {label && <span className="sr-only">{label}</span>}
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

interface LoadingOverlayProps extends HTMLAttributes<HTMLDivElement> {
  isLoading: boolean;
  label?: string;
}

export const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ isLoading, label, className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`relative ${className}`} {...props}>
        {children}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-lg z-10">
            <div className="flex flex-col items-center gap-3">
              <Spinner size="lg" />
              {label && (
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {label}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';

export default Spinner;
