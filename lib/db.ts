import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'madcow.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA foreign_keys = ON');
    migrate(db);
  }
  return db;
}

function migrate(db: DatabaseSync) {
  const currentVersion = db.prepare('PRAGMA user_version').get() as { user_version: number };
  const version = currentVersion.user_version;

  if (version < 1) {
    // Initial schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        kind TEXT NOT NULL DEFAULT 'custom',
        days TEXT NOT NULL DEFAULT '[]',
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day INTEGER NOT NULL,
        date TEXT NOT NULL,
        cycle INTEGER NOT NULL,
        deload INTEGER NOT NULL DEFAULT 0,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS lift_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id),
        weight REAL NOT NULL,
        UNIQUE(workout_id, exercise_id)
      );

      CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date DESC);
      CREATE INDEX IF NOT EXISTS idx_lift_logs_workout ON lift_logs(workout_id);
      CREATE INDEX IF NOT EXISTS idx_lift_logs_exercise ON lift_logs(exercise_id);
    `);

    // Seed default Madcow exercises
    const insertExercise = db.prepare(
      'INSERT OR IGNORE INTO exercises (name, kind, days, sort_order) VALUES (?, ?, ?, ?)'
    );

    insertExercise.run('Squat', 'madcow', JSON.stringify([1, 2, 3]), 1);
    insertExercise.run('Bench Press', 'madcow', JSON.stringify([1, 3]), 2);
    insertExercise.run('Barbell Row', 'madcow', JSON.stringify([1, 3]), 3);
    insertExercise.run('Overhead Press', 'madcow', JSON.stringify([2]), 4);
    insertExercise.run('Deadlift', 'madcow', JSON.stringify([2]), 5);

    db.exec('PRAGMA user_version = 1');
  }

  // Future migrations can be added here with version checks
}

// Types
export interface Exercise {
  id: number;
  name: string;
  kind: 'madcow' | 'custom';
  days: number[]; // [1, 2, 3] for workout days A, B, C
  sort_order: number;
}

export interface Workout {
  id: number;
  day: number; // 1=Volume(A), 2=Light(B), 3=Intensity(C)
  date: string; // ISO date
  cycle: number; // 1-based cycle counter
  deload: number; // 0 or 1
  notes: string | null;
}

export interface LiftLog {
  id: number;
  workout_id: number;
  exercise_id: number;
  weight: number; // kg
}

export interface WorkoutWithLifts extends Workout {
  lifts: Array<{
    exercise_id: number;
    exercise_name: string;
    weight: number;
  }>;
}
