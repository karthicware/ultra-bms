'use client';

/**
 * Maintenance Dashboard Page (AC-16, AC-17, AC-18)
 * Dedicated dashboard for maintenance supervisors with job metrics and status tracking
 * Story 8.4: Maintenance Dashboard
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, AlertCircle, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

// Dashboard components
import {
  MaintenanceKpiCards,
  JobsByStatusChart,
  JobsByPriorityChart,
  JobsByCategoryChart,
  HighPriorityOverdueTable,
  RecentlyCompletedList
} from '@/components/maintenance-dashboard';

// Hooks
import { useMaintenanceDashboardWithFilters } from '@/hooks/useMaintenanceDashboard';

// Property hook for filter dropdown
import { useProperties } from '@/hooks/useProperties';

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function MaintenanceDashboardPage() {
  const router = useRouter();

  // Fetch maintenance dashboard data with integrated filter state
  const {
    dashboard,
    highPriorityJobs,
    isLoading,
    isHighPriorityLoading,
    error,
    highPriorityError,
    filters,
    setPropertyId,
    setStatusFilter,
    setPage,
    clearFilters,
    refetch
  } = useMaintenanceDashboardWithFilters();

  // Fetch properties for filter dropdown
  const { data: propertiesData, isLoading: propertiesLoading } = useProperties();
  const properties = propertiesData?.content ?? [];

  // Handle property filter change
  const handlePropertyChange = useCallback((value: string) => {
    setPropertyId(value === 'all' ? undefined : value);
  }, [setPropertyId]);

  // Handle KPI card click navigation
  const handleKpiClick = useCallback((kpiType: 'active' | 'overdue' | 'pending' | 'completed') => {
    const filterMap: Record<string, string> = {
      active: 'status=OPEN,ASSIGNED,IN_PROGRESS',
      overdue: 'overdue=true',
      pending: 'status=OPEN',
      completed: 'status=COMPLETED,CLOSED'
    };
    const propertyFilter = filters.propertyId ? `&propertyId=${filters.propertyId}` : '';
    router.push(`/property-manager/work-orders?${filterMap[kpiType]}${propertyFilter}`);
  }, [router, filters.propertyId]);

  // Handle job click from table
  const handleJobClick = useCallback((jobId: string) => {
    router.push(`/property-manager/work-orders/${jobId}`);
  }, [router]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="container mx-auto space-y-6 py-6" data-testid="maintenance-dashboard-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Maintenance Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor and manage maintenance operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Property Filter (AC-16) */}
          <Select
            value={filters.propertyId ?? 'all'}
            onValueChange={handlePropertyChange}
            disabled={propertiesLoading}
          >
            <SelectTrigger className="w-[200px]" data-testid="property-filter">
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties?.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {(filters.propertyId || filters.statusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              data-testid="clear-filters"
            >
              Clear filters
            </Button>
          )}

          {/* Refresh Button (AC-18) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {(error || highPriorityError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>
            {error?.message || highPriorityError?.message || 'Failed to load dashboard data. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards (AC-1 to AC-4) */}
      <MaintenanceKpiCards
        kpis={dashboard?.kpis}
        isLoading={isLoading}
        onKpiClick={handleKpiClick}
      />

      {/* Charts Row (AC-5, AC-6, AC-7) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Jobs by Status Pie Chart (AC-5, AC-17) */}
        <JobsByStatusChart
          data={dashboard?.jobsByStatus}
          isLoading={isLoading}
          onStatusClick={setStatusFilter}
          selectedStatus={filters.statusFilter}
        />

        {/* Jobs by Priority Bar Chart (AC-6) */}
        <JobsByPriorityChart
          data={dashboard?.jobsByPriority}
          isLoading={isLoading}
        />

        {/* Jobs by Category Horizontal Bar Chart (AC-7) */}
        <JobsByCategoryChart
          data={dashboard?.jobsByCategory}
          isLoading={isLoading}
        />
      </div>

      {/* High Priority & Overdue Table (AC-8) */}
      <HighPriorityOverdueTable
        data={highPriorityJobs}
        isLoading={isHighPriorityLoading}
        onPageChange={setPage}
        onJobClick={handleJobClick}
      />

      {/* Recently Completed Jobs (AC-9) */}
      <RecentlyCompletedList
        data={dashboard?.recentlyCompletedJobs}
        isLoading={isLoading}
        onJobClick={handleJobClick}
      />
    </div>
  );
}
