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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { AlertCircle, RefreshCw, Building2, Calendar } from 'lucide-react';

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
          <SelectTrigger className="w-[200px] bg-background" data-testid="property-filter">
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

  // Get current date formatted
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div
      className="container mx-auto space-y-8 py-8 max-w-7xl"
      data-testid="occupancy-dashboard-page"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Occupancy Dashboard
          </h1>
          <div className="flex items-center text-muted-foreground text-sm gap-2">
            <Calendar className="h-4 w-4" />
            <span>{today}</span>
            <span className="text-border">|</span>
            <span>Portfolio occupancy metrics and lease insights</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="bg-background rounded-md border px-3 py-1">
             <OccupancyDashboardFilters
              onFilterChange={handleFilterChange}
              isLoading={isLoading}
            />
          </div>
          <Button
            variant="outline"
            size="default"
            onClick={handleRefresh}
            disabled={isFetching}
            data-testid="refresh-button"
            className="shrink-0"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />
            {isFetching ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

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
      <section>
        <h2 className="text-lg font-semibold mb-4 tracking-tight">Key Performance Indicators</h2>
        <OccupancyKpiCards
          kpis={dashboardData?.kpis ?? null}
          isLoading={isLoading}
          expiryPeriodDays={dashboardData?.expiryPeriodDays ?? 100}
        />
      </section>

      <Separator className="my-6" />

      {/* Charts Row - AC-5 and AC-6 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Portfolio Occupancy Donut Chart - AC-5 */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden p-1">
          <PortfolioOccupancyChart
            data={dashboardData?.occupancyChart ?? null}
            isLoading={isLoading}
          />
        </div>

        {/* Lease Expiration Bar Chart - AC-6 */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden p-1">
          <LeaseExpirationBarChart
            data={dashboardData?.leaseExpirationChart ?? null}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Detail Section - AC-7 and AC-8 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Lease Expirations Table - AC-7 */}
        <div className="lg:col-span-2 bg-card rounded-xl border shadow-sm overflow-hidden">
          <UpcomingLeaseExpirations
            items={dashboardData?.upcomingExpirations ?? null}
            isLoading={isLoading}
            maxItems={10}
            showViewAll={true}
          />
        </div>

        {/* Lease Activity Feed - AC-8 */}
        <div className="lg:col-span-1 bg-card rounded-xl border shadow-sm overflow-hidden">
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
