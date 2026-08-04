'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';

interface Exercise {
  id: number;
  name: string;
  kind: string;
  days: number[];
  sort_order: number;
}

const DAY_NAMES = {
  1: 'Volume (A)',
  2: 'Light (B)',
  3: 'Intensity (C)',
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1]);
  const [saving, setSaving] = useState(false);

  const loadExercises = () => {
    api
      .getConfig()
      .then((response) => {
        setExercises(response.exercises);
      })
      .catch((error) => {
        console.error('Failed to load exercises:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadExercises();
  }, []);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleAddExercise = async () => {
    if (!newExerciseName.trim() || selectedDays.length === 0) {
      alert('Please enter an exercise name and select at least one day');
      return;
    }

    setSaving(true);
    try {
      await api.addExercise({
        name: newExerciseName.trim(),
        days: selectedDays,
      });
      setNewExerciseName('');
      setSelectedDays([1]);
      setShowAddForm(false);
      loadExercises();
    } catch (error: any) {
      alert(error.message || 'Failed to add exercise');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExercise = async (id: number, name: string, kind: string) => {
    if (kind === 'madcow') {
      alert('Cannot delete default Madcow exercises');
      return;
    }

    if (!confirm(`Delete ${name}?`)) {
      return;
    }

    try {
      await api.deleteExercise(id);
      loadExercises();
    } catch (error: any) {
      alert(error.message || 'Failed to delete exercise');
    }
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Exercises</h1>
        <p className="text-muted-foreground">Manage your workout exercises</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Exercises</CardTitle>
          <CardDescription>Default Madcow exercises and your custom additions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
            >
              <div className="flex-1">
                <div className="font-semibold">{exercise.name}</div>
                <div className="text-xs text-muted-foreground">
                  {exercise.days.map((day) => DAY_NAMES[day as keyof typeof DAY_NAMES]).join(', ')}
                  {exercise.kind === 'madcow' && ' • Default'}
                </div>
              </div>
              {exercise.kind === 'custom' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteExercise(exercise.id, exercise.name, exercise.kind)}
                >
                  Delete
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {!showAddForm ? (
        <Button onClick={() => setShowAddForm(true)} className="w-full" size="lg">
          Add Custom Exercise
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Add Exercise</CardTitle>
            <CardDescription>Create a new custom exercise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="exercise-name" className="text-sm font-medium block mb-2">
                Exercise Name
              </label>
              <Input
                id="exercise-name"
                type="text"
                placeholder="e.g., Pull-ups"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Select Days</label>
              <div className="flex gap-2">
                {[1, 2, 3].map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={selectedDays.includes(day) ? 'default' : 'outline'}
                    onClick={() => toggleDay(day)}
                    className="flex-1"
                  >
                    {DAY_NAMES[day as keyof typeof DAY_NAMES]}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewExerciseName('');
                  setSelectedDays([1]);
                }}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleAddExercise} className="flex-1" disabled={saving}>
                {saving ? 'Adding...' : 'Add Exercise'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
