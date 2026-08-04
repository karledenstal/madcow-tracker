'use client';

import { getAuthToken } from '@/lib/auth';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi(url: string, options: RequestInit = {}) {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Clear token and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  async getNext() {
    return fetchApi('/api/next');
  },

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

  async login(token: string) {
    return fetchApi('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
};
