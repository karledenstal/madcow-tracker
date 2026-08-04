import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { WORKOUT_DAY_NAMES } from '@/lib/madcow';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();

  const exercises = db
    .prepare('SELECT id, name, kind, days, sort_order FROM exercises ORDER BY sort_order')
    .all()
    .map((row: any) => ({
      ...row,
      days: JSON.parse(row.days),
    }));

  return NextResponse.json({
    exercises,
    dayNames: WORKOUT_DAY_NAMES,
  });
}
