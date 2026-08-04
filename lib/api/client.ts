'use client';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(response.status, error.error || 'Request failed');
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  async saveWorkout(data: {
    day: number;
    date: string;
    deload: boolean;
    lifts: Array<{ exercise_id: number; weight: number }>;
    notes?: string;
  }) {
    return fetchApi('/api/workouts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getWorkouts(limit = 20) {
    return fetchApi(`/api/workouts?limit=${limit}`);
  },

  async getHistory(exerciseId: number) {
    return fetchApi(`/api/history/${exerciseId}`);
  },

  async getConfig() {
    return fetchApi('/api/config');
  },

  async addExercise(data: { name: string; days: number[] }) {
    return fetchApi('/api/exercises', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteExercise(id: number) {
    return fetchApi(`/api/exercises/${id}`, {
      method: 'DELETE',
    });
  },
};
