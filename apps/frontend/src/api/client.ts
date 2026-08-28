import { useAuthStore } from '../stores/authStore.js';
import type { ApiResponse } from '@hotspot/shared';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://hotspotbackend-production-4084.up.railway.app/api' : 'http://localhost:4000/api');

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { accessToken, logout } = useAuthStore.getState();

  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let body = options.body;
  if ((method === 'POST' || method === 'PUT') && body === undefined) {
    body = JSON.stringify({});
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      body
    });

    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }

    const data: ApiResponse<T> = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'API request failed');
    }

    return data.data as T;
  } catch (err) {
    throw err;
  }
}
