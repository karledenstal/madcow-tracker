import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import type { Exercise } from '@/lib/db';

async function handlePOST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { name, days } = body;

  if (!name || !days || !Array.isArray(days)) {
    return NextResponse.json(
      { error: 'Missing required fields: name, days' },
      { status: 400 }
    );
  }

  // Get max sort_order
  const maxSort = db.prepare('SELECT MAX(sort_order) as max FROM exercises').get() as {
    max: number | null;
  };
  const sortOrder = (maxSort.max || 0) + 1;

  try {
    const insert = db.prepare(
      'INSERT INTO exercises (name, kind, days, sort_order) VALUES (?, ?, ?, ?)'
    );
    const result = insert.run(name, 'custom', JSON.stringify(days), sortOrder);

    const exercise = db
      .prepare('SELECT * FROM exercises WHERE id = ?')
      .get(result.lastInsertRowid) as any;

    return NextResponse.json({
      exercise: {
        ...exercise,
        days: JSON.parse(exercise.days),
      },
    });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'Exercise already exists' }, { status: 400 });
    }
    throw error;
  }
}

export const POST = requireAuth(handlePOST);
