'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';

interface NextWorkoutData {
  day: number;
  dayName: string;
  cycle: number;
  isDeload: boolean;
  date: string;
  lifts: Array<{
    exercise_id: number;
    exercise_name: string;
    suggested_weight: number;
    last_weight: number | null;
    last_date: string | null;
  }>;
}

export default function LogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<NextWorkoutData | null>(null);
  const [weights, setWeights] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    api
      .getNext()
      .then((response) => {
        setData(response);
        // Initialize weights with suggested values
        const initialWeights: { [key: number]: string } = {};
        response.lifts.forEach((lift: any) => {
          initialWeights[lift.exercise_id] = lift.suggested_weight.toString();
        });
        setWeights(initialWeights);
      })
      .catch((error) => {
        console.error('Failed to load workout:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleWeightChange = (exerciseId: number, value: string) => {
    // Allow empty string, numbers, and decimal points
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

  const handleSubmit = async () => {
    if (!data) return;

    // Validate all weights are filled
    const lifts = data.lifts.map((lift) => {
      const weight = parseFloat(weights[lift.exercise_id] || '0');
      if (weight <= 0) {
        throw new Error(`Invalid weight for ${lift.exercise_name}`);
      }
      return {
        exercise_id: lift.exercise_id,
        weight,
      };
    });

    setSaving(true);
    try {
      await api.saveWorkout({
        day: data.day,
        date: data.date,
        deload: data.isDeload,
        lifts,
      });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Failed to save workout:', error);
      alert('Failed to save workout. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="text-center text-destructive">Failed to load workout data</div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Log Workout</h1>
        <div className="flex items-center justify-center gap-3">
          <p className="text-lg text-muted-foreground">
            Workout {String.fromCharCode(64 + data.day)} - {data.dayName}
          </p>
          <span className="text-sm bg-primary/20 text-primary px-2 py-1 rounded">
            Cycle {data.cycle}
          </span>
          {data.isDeload && (
            <span className="text-sm bg-destructive/20 text-destructive px-2 py-1 rounded">
              Deload Week
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter Weights</CardTitle>
          <CardDescription>Adjust the weights you lifted for each exercise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.lifts.map((lift) => (
            <div key={lift.exercise_id} className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor={`weight-${lift.exercise_id}`} className="font-semibold">
                  {lift.exercise_name}
                </label>
                {lift.last_weight && (
                  <span className="text-xs text-muted-foreground">
                    Last: {lift.last_weight} kg
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => adjustWeight(lift.exercise_id, -2.5)}
                  className="shrink-0"
                >
                  -
                </Button>
                <div className="relative flex-1">
                  <Input
                    id={`weight-${lift.exercise_id}`}
                    type="text"
                    inputMode="decimal"
                    value={weights[lift.exercise_id] || ''}
                    onChange={(e) => handleWeightChange(lift.exercise_id, e.target.value)}
                    className="text-center text-lg font-semibold pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    kg
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => adjustWeight(lift.exercise_id, 2.5)}
                  className="shrink-0"
                >
                  +
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Workout'}
        </Button>
      </div>
    </div>
  );
}
