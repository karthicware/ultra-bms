/**
 * Server-side API utilities for Next.js App Router
 * Used in Server Components to fetch data with authentication
 */

import { cookies } from 'next/headers';
import type { DashboardData } from '@/types/tenant-portal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

/**
 * Server-side fetch with cookie forwarding
 * Forwards all cookies from the incoming request to the backend API
 */
async function serverFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll()
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
        ...options.headers,
      },
      // Don't cache authenticated requests
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { data: null, error: 'unauthorized' };
      }
      return { data: null, error: `API error: ${response.status}` };
    }

    const json = await response.json();
    return { data: json.data as T, error: null };
  } catch (error) {
    console.error('[Server API] Fetch error:', error);
    return { data: null, error: 'fetch_failed' };
  }
}

/**
 * Fetch tenant dashboard data server-side
 * Returns null if user is not authenticated or not a tenant
 */
export async function getTenantDashboardServer(): Promise<DashboardData | null> {
  const { data, error } = await serverFetch<DashboardData>('/v1/tenant/dashboard');

  if (error) {
    // Log but don't throw - client will handle auth
    console.log('[Server API] Dashboard fetch:', error);
    return null;
  }

  return data;
}
