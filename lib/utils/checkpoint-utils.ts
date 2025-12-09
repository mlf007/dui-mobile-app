import type { Checkpoint } from '@/lib/types/checkpoint';

/**
 * Parse date string as local date (not UTC) to avoid timezone issues
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * Check if checkpoint is today
 */
export function isToday(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  const checkpointDate = parseLocalDate(dateString);
  const today = new Date();
  return checkpointDate.toDateString() === today.toDateString();
}

/**
 * Check if checkpoint is upcoming (today or future)
 */
export function isUpcoming(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  const checkpointDate = parseLocalDate(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  checkpointDate.setHours(0, 0, 0, 0);
  return checkpointDate >= today;
}

/**
 * Check if checkpoint is past
 */
export function isPast(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  return !isUpcoming(dateString);
}

/**
 * Get marker color for checkpoint
 * Red for today and upcoming, Blue for past
 */
export function getMarkerColor(checkpoint: Checkpoint): 'red' | 'blue' {
  if (isUpcoming(checkpoint.Date)) {
    return 'red';
  }
  return 'blue';
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Date TBD';
  return String(dateString);
}

