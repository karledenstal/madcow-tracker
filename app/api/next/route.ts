import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import type { Workout, Exercise } from '@/lib/db';
import { getNextDay, isDeloadDue, getSuggestedLifts, WORKOUT_DAY_NAMES } from '@/lib/madcow';
import type { LiftHistory } from '@/lib/madcow';

async function handler(request: NextRequest) {
  const db = getDb();

  // Get last workout
  const lastWorkout = db
    .prepare('SELECT * FROM workouts ORDER BY date DESC, id DESC LIMIT 1')
    .get() as Workout | undefined;

  // Get next day info
  const { day: nextDay, cycle: nextCycle } = getNextDay(lastWorkout || null);
  const isDeload = isDeloadDue(nextCycle);

  // Get all exercises
  const exercises = db
    .prepare('SELECT id, name, kind, days, sort_order FROM exercises ORDER BY sort_order')
    .all()
    .map((row: any) => ({
      ...row,
      days: JSON.parse(row.days),
    })) as Exercise[];

  // Get lift history for suggestions
  const historyRows = db
    .prepare(`
      SELECT 
        ll.exercise_id,
        w.day as workout_day,
        ll.weight,
        w.date,
        w.cycle,
        w.deload
      FROM lift_logs ll
      JOIN workouts w ON ll.workout_id = w.id
      ORDER BY w.date DESC, w.id DESC
    `)
    .all() as LiftHistory[];

  // Get suggested lifts
  const lifts = getSuggestedLifts(exercises, nextDay, nextCycle, isDeload, historyRows);

  return NextResponse.json({
    day: nextDay,
    dayName: WORKOUT_DAY_NAMES[nextDay as keyof typeof WORKOUT_DAY_NAMES],
    cycle: nextCycle,
    isDeload,
    date: new Date().toISOString().split('T')[0],
    lifts,
  });
}

export const GET = requireAuth(handler);
