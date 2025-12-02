'use client';

/**
 * Occupancy Dashboard Page
 * Story 8.3: Occupancy Dashboard
 *
 * Property manager focused dashboard showing:
 * - Portfolio occupancy KPIs (AC-1 to AC-4)
 * - Occupancy donut chart (AC-5)
 * - Lease expiration bar chart (AC-6)
 * - Upcoming lease expirations table (AC-7)
 * - Lease activity feed (AC-8)
 *
 * Uses Recharts for all visualizations (AC-13)
 * Renders on page load without user intervention (AC-16)
 * Supports responsive layout (AC-17)
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { AlertCircle, RefreshCw, Building2 } from 'lucide-react';

// Occupancy Dashboard components
import {
  OccupancyKpiCards,
  PortfolioOccupancyChart,
  LeaseExpirationBarChart,
  UpcomingLeaseExpirations,
  LeaseActivityFeed
} from '@/components/occupancy-dashboard';

// Hooks
import { useOccupancyDashboard } from '@/hooks/useOccupancyDashboard';
import { useProperties } from '@/hooks/useProperties';

// ============================================================================
// TYPES
// ============================================================================

interface OccupancyFilterValues {
  propertyId?: string;
}

// ============================================================================
// FILTER COMPONENT
// ============================================================================

function OccupancyDashboardFilters({
  onFilterChange,
  isLoading
}: {
  onFilterChange: (filters: OccupancyFilterValues) => void;
  isLoading?: boolean;
}) {
  const { data: properties, isLoading: loadingProperties } = useProperties();

  const handlePropertyChange = (value: string) => {
    onFilterChange({
      propertyId: value === 'all' ? undefined : value
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <Select
          onValueChange={handlePropertyChange}
          defaultValue="all"
          disabled={isLoading || loadingProperties}
        >
          <SelectTrigger className="w-[200px]" data-testid="property-filter">
            <SelectValue placeholder="Select property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties?.content?.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function OccupancyDashboardPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<OccupancyFilterValues>({});

  // Fetch dashboard data with React Query (AC-16: renders on page load)
  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useOccupancyDashboard(filters);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: OccupancyFilterValues) => {
    setFilters(newFilters);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div
      className="container mx-auto space-y-6 py-6"
      data-testid="occupancy-dashboard-page"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Occupancy Dashboard
          </h1>
          <p className="text-muted-foreground">
            Portfolio occupancy metrics and lease management insights
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
          data-testid="refresh-button"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
          />
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Property Filter */}
      <OccupancyDashboardFilters
        onFilterChange={handleFilterChange}
        isLoading={isLoading}
      />

      {/* Error State */}
      {isError && (
        <Alert variant="destructive" data-testid="error-alert">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : 'Failed to load occupancy dashboard data. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards - AC-1 to AC-4 */}
      <OccupancyKpiCards
        kpis={dashboardData?.kpis ?? null}
        isLoading={isLoading}
        expiryPeriodDays={dashboardData?.expiryPeriodDays ?? 100}
      />

      {/* Charts Row - AC-5 and AC-6 (AC-13: Uses Recharts, AC-17: Responsive) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Portfolio Occupancy Donut Chart - AC-5 */}
        <PortfolioOccupancyChart
          data={dashboardData?.occupancyChart ?? null}
          isLoading={isLoading}
        />

        {/* Lease Expiration Bar Chart - AC-6 */}
        <LeaseExpirationBarChart
          data={dashboardData?.leaseExpirationChart ?? null}
          isLoading={isLoading}
        />
      </div>

      {/* Detail Section - AC-7 and AC-8 (AC-17: Responsive) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Lease Expirations Table - AC-7 */}
        <div className="lg:col-span-2">
          <UpcomingLeaseExpirations
            items={dashboardData?.upcomingExpirations ?? null}
            isLoading={isLoading}
            maxItems={10}
            showViewAll={true}
          />
        </div>

        {/* Lease Activity Feed - AC-8 */}
        <div className="lg:col-span-1">
          <LeaseActivityFeed
            activities={dashboardData?.recentActivity ?? null}
            isLoading={isLoading}
            maxItems={10}
          />
        </div>
      </div>
    </div>
  );
}
