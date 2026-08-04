import type { Workout, Exercise, LiftLog } from './db';

export const WORKOUT_DAYS = {
  VOLUME: 1,
  LIGHT: 2,
  INTENSITY: 3,
} as const;

export const WORKOUT_DAY_NAMES = {
  [WORKOUT_DAYS.VOLUME]: 'Volume',
  [WORKOUT_DAYS.LIGHT]: 'Light',
  [WORKOUT_DAYS.INTENSITY]: 'Intensity',
} as const;

export const PROGRESSION_INCREMENT_KG = 2.5;
export const LIGHT_DAY_SQUAT_PERCENTAGE = 0.5; // 50% of last Volume squat
export const DELOAD_CYCLE_INTERVAL = 4; // Every 4th cycle
export const DELOAD_PERCENTAGE = 0.85; // 85% of normal weight (15% reduction)

/**
 * Get the next workout day in the A->B->C->A cycle
 */
export function getNextDay(lastWorkout: Workout | null): {
  day: number;
  cycle: number;
} {
  if (!lastWorkout) {
    return { day: WORKOUT_DAYS.VOLUME, cycle: 1 };
  }

  switch (lastWorkout.day) {
    case WORKOUT_DAYS.VOLUME:
      return { day: WORKOUT_DAYS.LIGHT, cycle: lastWorkout.cycle };
    case WORKOUT_DAYS.LIGHT:
      return { day: WORKOUT_DAYS.INTENSITY, cycle: lastWorkout.cycle };
    case WORKOUT_DAYS.INTENSITY:
      // Complete cycle, increment for next Volume day
      return { day: WORKOUT_DAYS.VOLUME, cycle: lastWorkout.cycle + 1 };
    default:
      return { day: WORKOUT_DAYS.VOLUME, cycle: 1 };
  }
}

/**
 * Check if a deload week is due
 */
export function isDeloadDue(cycle: number): boolean {
  return cycle > 0 && cycle % DELOAD_CYCLE_INTERVAL === 0;
}

export interface LiftHistory {
  exercise_id: number;
  workout_day: number;
  weight: number;
  date: string;
  cycle: number;
  deload: number;
}

export interface SuggestedLift {
  exercise_id: number;
  exercise_name: string;
  suggested_weight: number;
  last_weight: number | null;
  last_date: string | null;
}

/**
 * Calculate suggested weight for an exercise on a given workout day
 */
export function getSuggestedWeight(
  exercise: Exercise,
  nextDay: number,
  nextCycle: number,
  isDeload: boolean,
  history: LiftHistory[]
): number {
  // Special handling for Squat on Light day (B)
  if (exercise.name === 'Squat' && nextDay === WORKOUT_DAYS.LIGHT) {
    // Find last Volume (A) squat weight
    const lastVolumeSquat = history.find(
      (h) => h.exercise_id === exercise.id && h.workout_day === WORKOUT_DAYS.VOLUME && h.deload === 0
    );
    if (lastVolumeSquat) {
      return roundToNearest2_5(lastVolumeSquat.weight * LIGHT_DAY_SQUAT_PERCENTAGE);
    }
    return 20; // Default starting weight
  }

  // OHP/Deadlift on Light day (B): last Light weight + 2.5
  if (nextDay === WORKOUT_DAYS.LIGHT) {
    const lastLift = history.find(
      (h) => h.exercise_id === exercise.id && h.workout_day === WORKOUT_DAYS.LIGHT && h.deload === 0
    );
    let baseWeight = lastLift ? lastLift.weight : 20;
    baseWeight += PROGRESSION_INCREMENT_KG;
    if (isDeload) {
      baseWeight = roundToNearest2_5(baseWeight * DELOAD_PERCENTAGE);
    }
    return roundToNearest2_5(baseWeight);
  }

  // Volume day (A): follow last Intensity (C) weight (no increment — the increment belongs to Intensity)
  // Fallback: if no Intensity logged yet, use last Volume + 2.5
  if (nextDay === WORKOUT_DAYS.VOLUME) {
    const lastIntensity = history.find(
      (h) => h.exercise_id === exercise.id && h.workout_day === WORKOUT_DAYS.INTENSITY && h.deload === 0
    );
    let baseWeight;
    if (lastIntensity) {
      // Volume follows last Intensity (Madcow: Monday = previous Friday)
      baseWeight = lastIntensity.weight;
    } else {
      // No Intensity yet — fallback to last Volume + 2.5, or default
      const lastVolume = history.find(
        (h) => h.exercise_id === exercise.id && h.workout_day === WORKOUT_DAYS.VOLUME && h.deload === 0
      );
      baseWeight = (lastVolume ? lastVolume.weight : 20) + PROGRESSION_INCREMENT_KG;
    }
    if (isDeload) {
      baseWeight = roundToNearest2_5(baseWeight * DELOAD_PERCENTAGE);
    }
    return roundToNearest2_5(baseWeight);
  }

  // Intensity day (C): last Volume or Intensity weight + 2.5 (this is where progression happens)
  const lastLift = history.find(
    (h) =>
      h.exercise_id === exercise.id &&
      (h.workout_day === WORKOUT_DAYS.VOLUME || h.workout_day === WORKOUT_DAYS.INTENSITY) &&
      h.deload === 0
  );
  let baseWeight = lastLift ? lastLift.weight : 20;
  baseWeight += PROGRESSION_INCREMENT_KG;
  if (isDeload) {
    baseWeight = roundToNearest2_5(baseWeight * DELOAD_PERCENTAGE);
  }
  return roundToNearest2_5(baseWeight);
}

/**
 * Get all suggested lifts for the next workout
 */
export function getSuggestedLifts(
  exercises: Exercise[],
  nextDay: number,
  nextCycle: number,
  isDeload: boolean,
  allHistory: LiftHistory[]
): SuggestedLift[] {
  // Filter exercises for the next workout day
  const dayExercises = exercises
    .filter((ex) => ex.days.includes(nextDay))
    .sort((a, b) => a.sort_order - b.sort_order);

  return dayExercises.map((exercise) => {
    const suggested_weight = getSuggestedWeight(exercise, nextDay, nextCycle, isDeload, allHistory);

    // Find last logged weight for this exercise on this day
    const lastLog = allHistory.find((h) => h.exercise_id === exercise.id && h.workout_day === nextDay);

    return {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      suggested_weight,
      last_weight: lastLog?.weight ?? null,
      last_date: lastLog?.date ?? null,
    };
  });
}

/**
 * Round to nearest 2.5 kg
 */
function roundToNearest2_5(weight: number): number {
  return Math.round(weight / 2.5) * 2.5;
}
