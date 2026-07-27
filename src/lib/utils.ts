import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes with clsx logic.
 *
 * @description
 * This utility combines `clsx` for conditional class joining and `tailwind-merge`
 * to handle conflicting Tailwind classes (e.g., `p-4` vs `p-2`).
 *
 * @param inputs - Class names, objects, or arrays to merge.
 * @returns A single string of merged class names.
 * @usedBy All UI components (Button, Card, Input, etc.).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
