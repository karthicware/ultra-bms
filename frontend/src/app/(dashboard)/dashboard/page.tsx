'use client';

/**
 * Executive Summary Dashboard Page
 * Story 8.1: Executive Summary Dashboard
 * Main landing page after login with comprehensive property management KPIs
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dashboard components
import { KpiCardsGrid } from '@/components/dashboard/KpiCard';
import { MaintenanceQueueCard } from '@/components/dashboard/MaintenanceQueueCard';
import { PmJobsChart } from '@/components/dashboard/PmJobsChart';
import { LeaseExpirationTimeline } from '@/components/dashboard/LeaseExpirationTimeline';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { PropertyComparisonTable } from '@/components/dashboard/PropertyComparisonTable';
import { DashboardFilters, type DashboardFilterValues } from '@/components/dashboard/DashboardFilters';

// Hooks
import { useExecutiveDashboard } from '@/hooks/useDashboard';

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ExecutiveDashboardPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<DashboardFilterValues>({});

  // Fetch dashboard data with React Query
  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useExecutiveDashboard(filters);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: DashboardFilterValues) => {
    setFilters(newFilters);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="container mx-auto space-y-6 py-6" data-testid="executive-dashboard-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName || 'User'}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s your property management overview
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Filters - AC-10 */}
      <DashboardFilters
        onFilterChange={handleFilterChange}
        isLoading={isLoading}
      />

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load dashboard data. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards - AC-1 to AC-5 */}
      <KpiCardsGrid
        kpis={dashboardData?.kpis ?? null}
        isLoading={isLoading}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Maintenance Queue - AC-5 */}
          <MaintenanceQueueCard
            items={dashboardData?.priorityMaintenanceQueue ?? null}
            isLoading={isLoading}
          />

          {/* Alerts Panel - AC-8 */}
          <AlertsPanel
            alerts={dashboardData?.criticalAlerts ?? null}
            isLoading={isLoading}
            maxItems={5}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* PM Jobs Chart - AC-6 */}
          <PmJobsChart
            data={dashboardData?.upcomingPmJobs ?? null}
            isLoading={isLoading}
          />

          {/* Lease Expiration Timeline - AC-7 */}
          <LeaseExpirationTimeline
            data={dashboardData?.leaseExpirations ?? null}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Property Comparison Table - AC-9 */}
      <PropertyComparisonTable
        properties={dashboardData?.propertyComparison ?? null}
        isLoading={isLoading}
      />
    </div>
  );
}
