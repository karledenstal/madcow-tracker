import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';

async function handler(request: NextRequest, { params }: { params: { exerciseId: string } }) {
  const db = getDb();
  const exerciseId = parseInt(params.exerciseId, 10);

  if (isNaN(exerciseId)) {
    return NextResponse.json({ error: 'Invalid exercise ID' }, { status: 400 });
  }

  const history = db
    .prepare(`
      SELECT 
        w.date,
        ll.weight,
        w.day as workout_day,
        w.cycle,
        w.deload
      FROM lift_logs ll
      JOIN workouts w ON ll.workout_id = w.id
      WHERE ll.exercise_id = ?
      ORDER BY w.date ASC, w.id ASC
    `)
    .all(exerciseId) as Array<{
      date: string;
      weight: number;
      workout_day: number;
      cycle: number;
      deload: number;
    }>;

  return NextResponse.json({ history });
}

export const GET = requireAuth(handler);
