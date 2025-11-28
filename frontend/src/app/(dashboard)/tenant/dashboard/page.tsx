/**
 * Tenant Dashboard Page (Server Component)
 *
 * Server-side data fetching with client component hydration.
 * - Prefetches dashboard data server-side using cookies
 * - Passes data to client component for faster initial render
 * - Client handles auth checks and interactive elements
 *
 * AC1: Server component that fetches initial data server-side
 */

import { getTenantDashboardServer } from '@/lib/server-api';
import { TenantDashboardClient } from '@/components/tenant/TenantDashboardClient';

// Force dynamic rendering - user-specific content
export const dynamic = 'force-dynamic';

export default async function TenantDashboardPage() {
  // Prefetch dashboard data server-side
  // Returns null if not authenticated - client will handle redirect
  const initialData = await getTenantDashboardServer();

  return <TenantDashboardClient initialData={initialData} />;
}
