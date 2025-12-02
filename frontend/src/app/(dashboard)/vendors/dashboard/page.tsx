'use client';

/**
 * Vendor Dashboard Page
 * Story 8.5: Vendor Dashboard (AC-14, AC-19)
 *
 * Provides a comprehensive view of vendor performance metrics:
 * - KPI cards (active vendors, SLA compliance, top vendor, expiring docs)
 * - Jobs by specialization bar chart
 * - Vendor performance scatter plot
 * - Expiring documents table
 * - Top vendors table
 */

import { useVendorDashboard } from '@/hooks/useVendorDashboard';
import {
  VendorKpiCards,
  JobsBySpecializationChart,
  VendorPerformanceScatter,
  ExpiringDocumentsTable,
  TopVendorsTable,
} from '@/components/vendor-dashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function VendorDashboardPage() {
  const { data, isLoading, error, refetch, isRefetching } = useVendorDashboard();

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load vendor dashboard data'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} className="mt-4" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="vendor-dashboard-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor vendor performance and compliance metrics
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          disabled={isRefetching}
          data-testid="vendor-dashboard-refresh"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards Row */}
      <section data-testid="vendor-dashboard-kpi-section">
        <VendorKpiCards kpis={data?.kpis} isLoading={isLoading} />
      </section>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Jobs by Specialization */}
        <section data-testid="vendor-dashboard-specialization-section">
          <JobsBySpecializationChart
            data={data?.jobsBySpecialization}
            isLoading={isLoading}
          />
        </section>

        {/* Vendor Performance Scatter */}
        <section data-testid="vendor-dashboard-performance-section">
          <VendorPerformanceScatter
            data={data?.performanceSnapshot}
            isLoading={isLoading}
          />
        </section>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Expiring Documents */}
        <section data-testid="vendor-dashboard-expiring-docs-section">
          <ExpiringDocumentsTable
            data={data?.expiringDocuments}
            isLoading={isLoading}
          />
        </section>

        {/* Top Vendors */}
        <section data-testid="vendor-dashboard-top-vendors-section">
          <TopVendorsTable data={data?.topVendors} isLoading={isLoading} />
        </section>
      </div>
    </div>
  );
}
