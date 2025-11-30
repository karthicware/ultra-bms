'use client';

/**
 * Tenant Dashboard Client Component
 * Handles auth, interactive elements, and React Query data fetching
 * Receives optional initialData from server component for faster hydration
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { UnitInfoCard } from '@/components/tenant/UnitInfoCard';
import { DashboardStatsGrid } from '@/components/tenant/DashboardStatsGrid';
import { QuickActionsGrid } from '@/components/tenant/QuickActionsGrid';
import { AnnouncementsWidget } from '@/components/announcements/AnnouncementsWidget';
import { getDashboardData } from '@/services/tenant-portal.service';
import type { DashboardData } from '@/types/tenant-portal';

interface TenantDashboardClientProps {
  /** Initial data from server-side fetch for faster hydration */
  initialData?: DashboardData | null;
}

export function TenantDashboardClient({ initialData }: TenantDashboardClientProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // React Query with server-provided initial data
  const { data: dashboard, isLoading: dataLoading } = useQuery<DashboardData>({
    queryKey: ['tenant', 'dashboard'],
    queryFn: getDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    initialData: initialData ?? undefined,
    // If we have initial data, don't refetch immediately
    refetchOnMount: !initialData,
  });

  // Route protection: redirect non-tenants
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'TENANT')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Show skeleton during auth check
  if (authLoading) {
    return <DashboardSkeleton />;
  }

  // Return null while redirecting
  if (!user || user.role !== 'TENANT') {
    return null;
  }

  const isLoading = dataLoading && !dashboard;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation - Desktop */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Ultra BMS</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              {user.firstName} {user.lastName}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName}!
          </h2>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-AE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'Asia/Dubai',
            })}
          </p>
        </div>

        {/* Unit Info Card */}
        {isLoading ? (
          <Skeleton className="h-48 mb-6" />
        ) : dashboard ? (
          <div className="mb-6">
            <UnitInfoCard unitInfo={dashboard.currentUnit} />
          </div>
        ) : null}

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : dashboard ? (
          <div className="mb-6">
            <DashboardStatsGrid stats={dashboard.stats} />
          </div>
        ) : null}

        {/* Quick Actions */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : dashboard ? (
          <QuickActionsGrid actions={dashboard.quickActions} />
        ) : null}

        {/* Announcements Widget - Story 9.2 AC #64-70 */}
        <div className="mt-6">
          <AnnouncementsWidget isTenantView={true} maxItems={5} />
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-4 gap-1 p-2">
          <button
            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-primary/10 text-primary"
            data-testid="mobile-nav-dashboard"
            aria-label="Dashboard"
            aria-current="page"
          >
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted"
            data-testid="mobile-nav-requests"
            aria-label="Requests"
            onClick={() => router.push('/tenant/requests')}
          >
            <span className="text-xs font-medium">Requests</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted"
            data-testid="mobile-nav-payments"
            aria-label="Payments"
          >
            <span className="text-xs font-medium">Payments</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted"
            data-testid="mobile-nav-profile"
            aria-label="Profile"
            onClick={() => router.push('/tenant/profile')}
          >
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

/**
 * Loading skeleton for dashboard
 */
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Skeleton className="h-8 w-32" />
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </main>
    </div>
  );
}
