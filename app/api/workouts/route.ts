import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { Workout, WorkoutWithLifts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const workouts = db
    .prepare(`
      SELECT * FROM workouts 
      ORDER BY date DESC, id DESC 
      LIMIT ?
    `)
    .all(limit) as Workout[];

  // Get lifts for each workout
  const workoutsWithLifts: WorkoutWithLifts[] = workouts.map((workout) => {
    const lifts = db
      .prepare(`
        SELECT 
          ll.exercise_id,
          e.name as exercise_name,
          ll.weight
        FROM lift_logs ll
        JOIN exercises e ON ll.exercise_id = e.id
        WHERE ll.workout_id = ?
        ORDER BY e.sort_order
      `)
      .all(workout.id) as Array<{
        exercise_id: number;
        exercise_name: string;
        weight: number;
      }>;

    return {
      ...workout,
      lifts,
    };
  });

  return NextResponse.json({ workouts: workoutsWithLifts });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { day, date, deload, lifts, notes } = body;

  if (!day || !date || !lifts || !Array.isArray(lifts)) {
    return NextResponse.json(
      { error: 'Missing required fields: day, date, lifts' },
      { status: 400 }
    );
  }

  // Get the cycle number
  const lastWorkout = db
    .prepare('SELECT * FROM workouts ORDER BY date DESC, id DESC LIMIT 1')
    .get() as Workout | undefined;

  let cycle = 1;
  if (lastWorkout) {
    if (day === 1 && lastWorkout.day === 3) {
      // Starting new cycle after Intensity day
      cycle = lastWorkout.cycle + 1;
    } else {
      cycle = lastWorkout.cycle;
    }
  }

  // Insert workout
  const insertWorkout = db.prepare(
    'INSERT INTO workouts (day, date, cycle, deload, notes) VALUES (?, ?, ?, ?, ?)'
  );
  const result = insertWorkout.run(day, date, cycle, deload || 0, notes || null);
  const workoutId = result.lastInsertRowid;

  // Insert lift logs
  const insertLift = db.prepare(
    'INSERT INTO lift_logs (workout_id, exercise_id, weight) VALUES (?, ?, ?)'
  );

  for (const lift of lifts) {
    insertLift.run(workoutId, lift.exercise_id, lift.weight);
  }

  // Return the created workout with lifts
  const workout = db.prepare('SELECT * FROM workouts WHERE id = ?').get(workoutId) as Workout;
  const workoutLifts = db
    .prepare(`
      SELECT 
        ll.exercise_id,
        e.name as exercise_name,
        ll.weight
      FROM lift_logs ll
      JOIN exercises e ON ll.exercise_id = e.id
      WHERE ll.workout_id = ?
      ORDER BY e.sort_order
    `)
    .all(workoutId) as Array<{
      exercise_id: number;
      exercise_name: string;
      weight: number;
    }>;

  return NextResponse.json({
    workout: {
      ...workout,
      lifts: workoutLifts,
    },
  });
}


