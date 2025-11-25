'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenantDashboard } from '@/hooks/useTenantDashboard';
import { UnitInfoCard } from '@/components/tenant/UnitInfoCard';
import { DashboardStatsGrid } from '@/components/tenant/DashboardStatsGrid';
import { QuickActionsGrid } from '@/components/tenant/QuickActionsGrid';

/**
 * Tenant Dashboard Page
 * Displays unit information, stats, and quick actions for authenticated tenants
 */
export default function TenantDashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Route protection: redirect non-tenants
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'TENANT')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user || user.role !== 'TENANT') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation - Desktop */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Ultra BMS</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* User menu will go here */}
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
        <UnitInfoSection />

        {/* Stats Grid */}
        <StatsSection />

        {/* Quick Actions */}
        <QuickActionsSection />
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background" role="navigation" aria-label="Mobile navigation">
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
          >
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

/**
 * Dashboard sections with data fetching
 */
function UnitInfoSection() {
  const { data: dashboard, isLoading } = useTenantDashboard();

  if (isLoading) return <Skeleton className="h-48 col-span-full" />;
  if (!dashboard) return null;

  return <UnitInfoCard unitInfo={dashboard.currentUnit} />;
}

function StatsSection() {
  const { data: dashboard, isLoading } = useTenantDashboard();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!dashboard) return null;

  return <DashboardStatsGrid stats={dashboard.stats} />;
}

function QuickActionsSection() {
  const { data: dashboard, isLoading } = useTenantDashboard();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  if (!dashboard) return null;

  return <QuickActionsGrid actions={dashboard.quickActions} />;
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
