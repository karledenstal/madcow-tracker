import type { Exercise } from './db';

/**
 * Get recommended rest duration in seconds for an exercise
 * 
 * Madcow main lifts (heavy compounds): 180s (3 min)
 * Custom/accessory lifts: 90s (1.5 min)
 */
export function getRecommendedRest(exercise: { name: string; kind: 'madcow' | 'custom' }): number {
  return exercise.kind === 'madcow' ? 180 : 90;
}

/**
 * Format seconds as mm:ss
 */
export function formatRestTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
