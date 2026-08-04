import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDb } from '@/lib/db';
import type { Workout, Exercise } from '@/lib/db';
import { getNextDay, isDeloadDue, getSuggestedLifts, WORKOUT_DAY_NAMES } from '@/lib/madcow';
import type { LiftHistory } from '@/lib/madcow';

export default function TodayPage() {
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

  const dayName = WORKOUT_DAY_NAMES[nextDay as keyof typeof WORKOUT_DAY_NAMES];

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Today's Workout</h1>
        <div className="flex items-center justify-center gap-3">
          <p className="text-lg text-muted-foreground">
            Workout {String.fromCharCode(64 + nextDay)} - {dayName}
          </p>
          <span className="text-sm bg-primary/20 text-primary px-2 py-1 rounded">
            Cycle {nextCycle}
          </span>
          {isDeload && (
            <span className="text-sm bg-destructive/20 text-destructive px-2 py-1 rounded">
              Deload Week
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lifts</CardTitle>
          <CardDescription>
            {isDeload
              ? 'Deload week - reduced weights for recovery'
              : 'Suggested weights based on your progression'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lifts.map((lift) => (
            <div
              key={lift.exercise_id}
              className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{lift.exercise_name}</h3>
                {lift.last_weight && (
                  <p className="text-sm text-muted-foreground">
                    Last: {lift.last_weight} kg
                    {lift.last_date && ` (${new Date(lift.last_date).toLocaleDateString()})`}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{lift.suggested_weight} kg</div>
                <div className="text-xs text-muted-foreground">suggested</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Link href="/log" className="block">
        <Button size="lg" className="w-full text-lg h-14">
          Log Workout
        </Button>
      </Link>
    </div>
  );
}
