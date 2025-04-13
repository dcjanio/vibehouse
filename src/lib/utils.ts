import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date or timestamp to a readable string
 * @param dateInput Date object, ISO string, or timestamp in milliseconds
 * @returns Formatted date string
 */
export function formatDate(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'object' 
    ? dateInput 
    : new Date(dateInput);
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

/**
 * Format a duration in minutes to a readable string
 * @param minutes Duration in minutes
 * @returns Formatted duration string (e.g., "30 min", "1 hour", "1 hour 30 min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} min`;
} 