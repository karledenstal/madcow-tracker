'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';

interface Lift {
  exercise_id: number;
  exercise_name: string;
  suggested_weight: number;
  last_weight: number | null;
  last_date: string | null;
}

interface TodayWorkoutProps {
  day: number;
  dayName: string;
  cycle: number;
  isDeload: boolean;
  date: string;
  lifts: Lift[];
}

export function TodayWorkout({ day, dayName, cycle, isDeload, date, lifts }: TodayWorkoutProps) {
  const router = useRouter();
  const [weights, setWeights] = useState<{ [key: number]: string }>(() => {
    const initial: { [key: number]: string } = {};
    lifts.forEach((lift) => {
      initial[lift.exercise_id] = lift.suggested_weight.toString();
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleWeightChange = (exerciseId: number, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setWeights((prev) => ({ ...prev, [exerciseId]: value }));
    }
  };

  const adjustWeight = (exerciseId: number, delta: number) => {
    const currentWeight = parseFloat(weights[exerciseId] || '0');
    const newWeight = Math.max(0, currentWeight + delta);
    setWeights((prev) => ({
      ...prev,
      [exerciseId]: newWeight.toFixed(1).replace(/\.0$/, ''),
    }));
  };

  const resetToSuggestion = (exerciseId: number, suggested: number) => {
    setWeights((prev) => ({
      ...prev,
      [exerciseId]: suggested.toString(),
    }));
  };

  const handleSave = async () => {
    // Double-submit guard
    if (saving) return;

    // Validate all weights
    for (const lift of lifts) {
      const weight = parseFloat(weights[lift.exercise_id] || '0');
      if (weight <= 0) {
        alert(`Please enter a valid weight for ${lift.exercise_name}`);
        return;
      }
    }

    const workoutLifts = lifts.map((lift) => ({
      exercise_id: lift.exercise_id,
      weight: parseFloat(weights[lift.exercise_id] || '0'),
    }));

    setSaving(true);
    try {
      await api.saveWorkout({
        day,
        date,
        deload: isDeload,
        lifts: workoutLifts,
      });
      setSaving(false);
      setSaved(true);
      
      // Brief confirmation flash, then auto-refresh to next workout
      setTimeout(() => {
        router.refresh();
      }, 600);
      
      // Safety: reset saved state after 2s in case refresh doesn't remount
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to save workout:', error);
      alert('Failed to save workout. Please try again.');
      setSaving(false);
    }
  };

  // Day descriptions
  const dayDescription = {
    1: '5×5 across all lifts — the top set is what counts',
    2: 'Squat is 50% of your last Volume squat; OHP & Deadlift are lighter',
    3: 'Heavy top sets — aim for a PR',
  }[day] || '';

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Today's Workout</h1>
        <div className="flex items-center justify-center gap-3">
          <p className="text-lg text-muted-foreground">
            Workout {String.fromCharCode(64 + day)} - {dayName}
          </p>
          <span className="text-sm bg-primary/20 text-primary px-2 py-1 rounded">
            Cycle {cycle}
          </span>
          {isDeload && (
            <span className="text-sm bg-destructive/20 text-destructive px-2 py-1 rounded">
              Deload Week
            </span>
          )}
        </div>
        {dayDescription && (
          <p className="text-sm text-muted-foreground italic max-w-xl mx-auto">
            {dayDescription}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lifts</CardTitle>
          <CardDescription>
            {isDeload
              ? 'Deload week - reduced weights for recovery'
              : 'Adjust weights as needed, then log your workout'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lifts.map((lift) => {
            const currentWeight = parseFloat(weights[lift.exercise_id] || '0');
            const isChanged = currentWeight !== lift.suggested_weight;

            return (
              <div key={lift.exercise_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label htmlFor={`weight-${lift.exercise_id}`} className="font-semibold">
                      {lift.exercise_name}
                    </label>
                    {lift.last_weight && (
                      <div className="text-xs text-muted-foreground">
                        Last: {lift.last_weight} kg
                        {lift.last_date && ` · ${lift.last_date}`}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Suggested: {lift.suggested_weight} kg
                      {day === 2 && lift.exercise_name === 'Squat' && (
                        <span className="text-xs text-muted-foreground/80"> (50% of Volume squat)</span>
                      )}
                      {isChanged && (
                        <button
                          type="button"
                          onClick={() => resetToSuggestion(lift.exercise_id, lift.suggested_weight)}
                          className="ml-2 text-primary hover:underline"
                        >
                          ↺ reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => adjustWeight(lift.exercise_id, -2.5)}
                    className="shrink-0 h-12 w-12 text-lg"
                    disabled={saving}
                  >
                    −
                  </Button>
                  <div className="relative flex-1">
                    <Input
                      id={`weight-${lift.exercise_id}`}
                      type="text"
                      inputMode="decimal"
                      value={weights[lift.exercise_id] || ''}
                      onChange={(e) => handleWeightChange(lift.exercise_id, e.target.value)}
                      className={`text-center text-2xl font-bold h-16 pr-14 ${
                        isChanged ? 'border-amber-500/50 bg-amber-500/5' : ''
                      }`}
                      disabled={saving}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                      kg
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => adjustWeight(lift.exercise_id, 2.5)}
                    className="shrink-0 h-12 w-12 text-lg"
                    disabled={saving}
                  >
                    +
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full text-lg h-16"
        onClick={handleSave}
        disabled={saving || saved}
      >
        {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Log Workout'}
      </Button>
    </div>
  );
}
