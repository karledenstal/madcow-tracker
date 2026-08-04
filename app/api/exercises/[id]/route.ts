import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid exercise ID' }, { status: 400 });
  }

  // Check if exercise is a Madcow default
  const exercise = db.prepare('SELECT kind FROM exercises WHERE id = ?').get(id) as
    | { kind: string }
    | undefined;

  if (!exercise) {
    return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
  }

  if (exercise.kind === 'madcow') {
    return NextResponse.json(
      { error: 'Cannot delete default Madcow exercises' },
      { status: 400 }
    );
  }

  db.prepare('DELETE FROM exercises WHERE id = ?').run(id);

  return NextResponse.json({ ok: true });
}


