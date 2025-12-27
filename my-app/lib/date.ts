import { formatDistanceToNow, format, parseISO, isValid } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString?: string | Date, locale: 'en' | 'ko' = 'en'): string {
  if (!dateString) return 'Unknown date';

  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  if (!isValid(date)) return 'Invalid date';

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: locale === 'ko' ? ko : undefined,
  });
}

/**
 * Format a date for display (e.g., "Dec 27, 2025")
 */
export function formatDisplayDate(dateString?: string | Date): string {
  if (!dateString) return 'Unknown date';

  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  if (!isValid(date)) return 'Invalid date';

  return format(date, 'MMM d, yyyy');
}

/**
 * Format a date with time (e.g., "Dec 27, 2025, 2:30 PM")
 */
export function formatDateTime(dateString?: string | Date): string {
  if (!dateString) return 'Unknown date';

  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  if (!isValid(date)) return 'Invalid date';

  return format(date, 'MMM d, yyyy, h:mm a');
}

/**
 * Format for compact display (e.g., "2h", "3d", "Dec 15")
 */
export function formatCompactDate(dateString?: string | Date): string {
  if (!dateString) return 'Unknown';

  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  if (!isValid(date)) return 'Invalid';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return format(date, 'MMM d');
}
