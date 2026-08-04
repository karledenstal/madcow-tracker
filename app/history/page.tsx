'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';

interface Exercise {
  id: number;
  name: string;
  kind: string;
  days: number[];
  sort_order: number;
}

interface HistoryEntry {
  date: string;
  weight: number;
  workout_day: number;
  cycle: number;
  deload: number;
}

export default function HistoryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getConfig()
      .then((response) => {
        setExercises(response.exercises);
        if (response.exercises.length > 0) {
          setSelectedExercise(response.exercises[0].id);
        }
      })
      .catch((error) => {
        console.error('Failed to load exercises:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedExercise === null) return;

    api
      .getHistory(selectedExercise)
      .then((response) => {
        setHistory(response.history);
      })
      .catch((error) => {
        console.error('Failed to load history:', error);
      });
  }, [selectedExercise]);

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const selectedExerciseName =
    exercises.find((e) => e.id === selectedExercise)?.name || '';

  // Calculate chart dimensions and data
  const chartData = history.length > 0 ? history : [];
  const maxWeight = chartData.length > 0 ? Math.max(...chartData.map((h) => h.weight)) : 100;
  const minWeight = chartData.length > 0 ? Math.min(...chartData.map((h) => h.weight)) : 0;
  const weightRange = maxWeight - minWeight || 20;
  const chartHeight = 200;
  const chartWidth = 300;
  const padding = { top: 10, right: 10, bottom: 30, left: 40 };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-muted-foreground">Track your progression over time</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Exercise</CardTitle>
          <CardDescription>View your lifting history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {exercises.map((exercise) => (
              <Button
                key={exercise.id}
                variant={selectedExercise === exercise.id ? 'default' : 'outline'}
                onClick={() => setSelectedExercise(exercise.id)}
                className="flex-1 min-w-[100px]"
              >
                {exercise.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedExerciseName} Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <svg
                width={chartWidth}
                height={chartHeight}
                className="mx-auto"
                style={{ maxWidth: '100%' }}
              >
                {/* Y-axis */}
                <line
                  x1={padding.left}
                  y1={padding.top}
                  x2={padding.left}
                  y2={chartHeight - padding.bottom}
                  stroke="currentColor"
                  strokeOpacity={0.3}
                />
                {/* X-axis */}
                <line
                  x1={padding.left}
                  y1={chartHeight - padding.bottom}
                  x2={chartWidth - padding.right}
                  y2={chartHeight - padding.bottom}
                  stroke="currentColor"
                  strokeOpacity={0.3}
                />

                {/* Y-axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const weight = minWeight + weightRange * ratio;
                  const y =
                    chartHeight - padding.bottom - (chartHeight - padding.top - padding.bottom) * ratio;
                  return (
                    <text
                      key={ratio}
                      x={padding.left - 5}
                      y={y}
                      textAnchor="end"
                      fontSize="10"
                      fill="currentColor"
                      opacity={0.6}
                      alignmentBaseline="middle"
                    >
                      {weight.toFixed(0)}
                    </text>
                  );
                })}

                {/* Data line */}
                <polyline
                  points={chartData
                    .map((entry, i) => {
                      const x =
                        padding.left +
                        ((chartWidth - padding.left - padding.right) / (chartData.length - 1 || 1)) * i;
                      const y =
                        chartHeight -
                        padding.bottom -
                        ((entry.weight - minWeight) / weightRange) *
                          (chartHeight - padding.top - padding.bottom);
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                />

                {/* Data points */}
                {chartData.map((entry, i) => {
                  const x =
                    padding.left +
                    ((chartWidth - padding.left - padding.right) / (chartData.length - 1 || 1)) * i;
                  const y =
                    chartHeight -
                    padding.bottom -
                    ((entry.weight - minWeight) / weightRange) *
                      (chartHeight - padding.top - padding.bottom);
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={entry.deload ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                    />
                  );
                })}
              </svg>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>History Log</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No history for this exercise yet
            </p>
          ) : (
            <div className="space-y-2">
              {chartData
                .slice()
                .reverse()
                .map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div>
                      <div className="font-semibold">{entry.weight} kg</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()} • Cycle {entry.cycle}
                        {entry.deload ? ' • Deload' : ''}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
