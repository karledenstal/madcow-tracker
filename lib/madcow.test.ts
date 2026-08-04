import { describe, it, expect } from 'vitest';
import {
  getNextDay,
  isDeloadDue,
  getSuggestedWeight,
  getSuggestedLifts,
  WORKOUT_DAYS,
  PROGRESSION_INCREMENT_KG,
  LIGHT_DAY_SQUAT_PERCENTAGE,
  DELOAD_PERCENTAGE,
} from './madcow';
import type { Workout, Exercise } from './db';
import type { LiftHistory } from './madcow';

describe('madcow progression logic', () => {
  describe('getNextDay', () => {
    it('should start with Volume day cycle 1 when no history', () => {
      const result = getNextDay(null);
      expect(result).toEqual({ day: WORKOUT_DAYS.VOLUME, cycle: 1 });
    });

    it('should progress Volume -> Light -> Intensity', () => {
      const volumeWorkout: Workout = {
        id: 1,
        day: WORKOUT_DAYS.VOLUME,
        date: '2026-01-01',
        cycle: 1,
        deload: 0,
        notes: null,
      };
      expect(getNextDay(volumeWorkout)).toEqual({ day: WORKOUT_DAYS.LIGHT, cycle: 1 });

      const lightWorkout: Workout = { ...volumeWorkout, day: WORKOUT_DAYS.LIGHT };
      expect(getNextDay(lightWorkout)).toEqual({ day: WORKOUT_DAYS.INTENSITY, cycle: 1 });
    });

    it('should increment cycle after Intensity day', () => {
      const intensityWorkout: Workout = {
        id: 1,
        day: WORKOUT_DAYS.INTENSITY,
        date: '2026-01-05',
        cycle: 1,
        deload: 0,
        notes: null,
      };
      expect(getNextDay(intensityWorkout)).toEqual({ day: WORKOUT_DAYS.VOLUME, cycle: 2 });
    });
  });

  describe('isDeloadDue', () => {
    it('should return false for cycles 1-3', () => {
      expect(isDeloadDue(1)).toBe(false);
      expect(isDeloadDue(2)).toBe(false);
      expect(isDeloadDue(3)).toBe(false);
    });

    it('should return true for cycle 4, 8, 12, etc.', () => {
      expect(isDeloadDue(4)).toBe(true);
      expect(isDeloadDue(8)).toBe(true);
      expect(isDeloadDue(12)).toBe(true);
    });

    it('should return false for cycle 5, 6, 7', () => {
      expect(isDeloadDue(5)).toBe(false);
      expect(isDeloadDue(6)).toBe(false);
      expect(isDeloadDue(7)).toBe(false);
    });
  });

  describe('getSuggestedWeight', () => {
    const squatExercise: Exercise = {
      id: 1,
      name: 'Squat',
      kind: 'madcow',
      days: [1, 2, 3],
      sort_order: 1,
    };

    const benchExercise: Exercise = {
      id: 2,
      name: 'Bench Press',
      kind: 'madcow',
      days: [1, 3],
      sort_order: 2,
    };

    it('should suggest starting weight when no history', () => {
      const weight = getSuggestedWeight(benchExercise, WORKOUT_DAYS.VOLUME, 1, false, []);
      expect(weight).toBe(20 + PROGRESSION_INCREMENT_KG); // 22.5
    });

    it('should add progression increment to last weight', () => {
      const history: LiftHistory[] = [
        {
          exercise_id: 2,
          workout_day: WORKOUT_DAYS.VOLUME,
          weight: 60,
          date: '2026-01-01',
          cycle: 1,
          deload: 0,
        },
      ];
      const weight = getSuggestedWeight(benchExercise, WORKOUT_DAYS.VOLUME, 2, false, history);
      expect(weight).toBe(60 + PROGRESSION_INCREMENT_KG); // 62.5
    });

    it('should suggest 50% of last Volume squat for Light day', () => {
      const history: LiftHistory[] = [
        {
          exercise_id: 1,
          workout_day: WORKOUT_DAYS.VOLUME,
          weight: 100,
          date: '2026-01-01',
          cycle: 1,
          deload: 0,
        },
      ];
      const weight = getSuggestedWeight(squatExercise, WORKOUT_DAYS.LIGHT, 1, false, history);
      expect(weight).toBe(50); // 50% of 100
    });

    it('should apply deload percentage when deloading', () => {
      const history: LiftHistory[] = [
        {
          exercise_id: 2,
          workout_day: WORKOUT_DAYS.VOLUME,
          weight: 60,
          date: '2026-01-01',
          cycle: 3,
          deload: 0,
        },
      ];
      const weight = getSuggestedWeight(benchExercise, WORKOUT_DAYS.VOLUME, 4, true, history);
      const expected = Math.round((60 + PROGRESSION_INCREMENT_KG) * DELOAD_PERCENTAGE / 2.5) * 2.5;
      expect(weight).toBe(expected); // ~53.125 rounded to 52.5
    });

    it('should round to nearest 2.5 kg', () => {
      const history: LiftHistory[] = [
        {
          exercise_id: 2,
          workout_day: WORKOUT_DAYS.VOLUME,
          weight: 61.3,
          date: '2026-01-01',
          cycle: 1,
          deload: 0,
        },
      ];
      const weight = getSuggestedWeight(benchExercise, WORKOUT_DAYS.VOLUME, 2, false, history);
      expect(weight).toBe(65); // 61.3 + 2.5 = 63.8, rounded to 65
    });

    it('should suggest last Intensity weight for Volume day (Madcow: Monday = previous Friday)', () => {
      const history: LiftHistory[] = [
        {
          exercise_id: 2,
          workout_day: WORKOUT_DAYS.INTENSITY,
          weight: 25,
          date: '2026-01-05',
          cycle: 1,
          deload: 0,
        },
        {
          exercise_id: 2,
          workout_day: WORKOUT_DAYS.VOLUME,
          weight: 22.5,
          date: '2026-01-01',
          cycle: 1,
          deload: 0,
        },
      ];
      const weight = getSuggestedWeight(benchExercise, WORKOUT_DAYS.VOLUME, 2, false, history);
      expect(weight).toBe(25); // Volume follows last Intensity (no +2.5)
    });

    it('should add increment to last Intensity weight for Intensity day', () => {
      const history: LiftHistory[] = [
        {
          exercise_id: 2,
          workout_day: WORKOUT_DAYS.INTENSITY,
          weight: 25,
          date: '2026-01-05',
          cycle: 1,
          deload: 0,
        },
        {
          exercise_id: 2,
          workout_day: WORKOUT_DAYS.VOLUME,
          weight: 22.5,
          date: '2026-01-01',
          cycle: 1,
          deload: 0,
        },
      ];
      const weight = getSuggestedWeight(benchExercise, WORKOUT_DAYS.INTENSITY, 2, false, history);
      expect(weight).toBe(27.5); // Intensity adds +2.5 to last Intensity
    });
  });

  describe('getSuggestedLifts', () => {
    const exercises: Exercise[] = [
      {
        id: 1,
        name: 'Squat',
        kind: 'madcow',
        days: [1, 2, 3],
        sort_order: 1,
      },
      {
        id: 2,
        name: 'Bench Press',
        kind: 'madcow',
        days: [1, 3],
        sort_order: 2,
      },
      {
        id: 3,
        name: 'Barbell Row',
        kind: 'madcow',
        days: [1, 3],
        sort_order: 3,
      },
    ];

    const history: LiftHistory[] = [
      {
        exercise_id: 1,
        workout_day: WORKOUT_DAYS.VOLUME,
        weight: 100,
        date: '2026-01-01',
        cycle: 1,
        deload: 0,
      },
      {
        exercise_id: 2,
        workout_day: WORKOUT_DAYS.VOLUME,
        weight: 60,
        date: '2026-01-01',
        cycle: 1,
        deload: 0,
      },
      {
        exercise_id: 3,
        workout_day: WORKOUT_DAYS.VOLUME,
        weight: 70,
        date: '2026-01-01',
        cycle: 1,
        deload: 0,
      },
    ];

    it('should return lifts for Volume day', () => {
      const lifts = getSuggestedLifts(exercises, WORKOUT_DAYS.VOLUME, 2, false, history);
      expect(lifts).toHaveLength(3);
      expect(lifts[0].exercise_name).toBe('Squat');
      expect(lifts[0].suggested_weight).toBe(102.5);
      expect(lifts[1].exercise_name).toBe('Bench Press');
      expect(lifts[1].suggested_weight).toBe(62.5);
      expect(lifts[2].exercise_name).toBe('Barbell Row');
      expect(lifts[2].suggested_weight).toBe(72.5);
    });

    it('should return lifts for Light day with squat at 50%', () => {
      const lightExercises: Exercise[] = [
        {
          id: 1,
          name: 'Squat',
          kind: 'madcow',
          days: [1, 2, 3],
          sort_order: 1,
        },
        {
          id: 4,
          name: 'Overhead Press',
          kind: 'madcow',
          days: [2],
          sort_order: 4,
        },
      ];

      const lifts = getSuggestedLifts(lightExercises, WORKOUT_DAYS.LIGHT, 1, false, history);
      expect(lifts).toHaveLength(2);
      expect(lifts[0].exercise_name).toBe('Squat');
      expect(lifts[0].suggested_weight).toBe(50); // 50% of 100
    });

    it('should include last weight and date', () => {
      const lifts = getSuggestedLifts(exercises, WORKOUT_DAYS.VOLUME, 2, false, history);
      expect(lifts[0].last_weight).toBe(100);
      expect(lifts[0].last_date).toBe('2026-01-01');
    });

    it('should handle no history', () => {
      const lifts = getSuggestedLifts(exercises, WORKOUT_DAYS.VOLUME, 1, false, []);
      expect(lifts[0].last_weight).toBeNull();
      expect(lifts[0].last_date).toBeNull();
      expect(lifts[0].suggested_weight).toBe(22.5); // 20 + 2.5
    });
  });
});
