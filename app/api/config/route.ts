import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { WORKOUT_DAY_NAMES } from '@/lib/madcow';

async function handler(request: NextRequest) {
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

export const GET = requireAuth(handler);
