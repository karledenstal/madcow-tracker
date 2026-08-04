import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ exerciseId: string }> }) {
  const db = getDb();
  const { exerciseId: exerciseIdParam } = await params;
  const exerciseId = parseInt(exerciseIdParam, 10);

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


