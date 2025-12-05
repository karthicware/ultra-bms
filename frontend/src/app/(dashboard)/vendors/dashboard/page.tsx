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
import { Separator } from '@/components/ui/separator';
import { RefreshCw, AlertCircle, Calendar } from 'lucide-react';

export default function VendorDashboardPage() {
  const { data, isLoading, error, refetch, isRefetching } = useVendorDashboard();

  // Get current date formatted
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Vendor Dashboard</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load vendor dashboard data'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 py-8 max-w-7xl" data-testid="vendor-dashboard-page">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Vendor Dashboard</h1>
          <div className="flex items-center text-muted-foreground text-sm gap-2">
            <Calendar className="h-4 w-4" />
            <span>{today}</span>
            <span className="text-border">|</span>
            <span>Monitor vendor performance and compliance metrics</span>
          </div>
        </div>
        
        <Button
          onClick={() => refetch()}
          variant="outline"
          disabled={isRefetching}
          data-testid="vendor-dashboard-refresh"
          className="shrink-0"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* KPI Section */}
      <section data-testid="vendor-dashboard-kpi-section">
        <h2 className="text-lg font-semibold mb-4 tracking-tight">Key Performance Indicators</h2>
        <VendorKpiCards kpis={data?.kpis} isLoading={isLoading} />
      </section>

      <Separator className="my-6" />

      {/* Charts Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4 tracking-tight">Performance & Activity</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Jobs by Specialization */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden" data-testid="vendor-dashboard-specialization-section">
            <JobsBySpecializationChart
              data={data?.jobsBySpecialization}
              isLoading={isLoading}
            />
          </div>

          {/* Vendor Performance Scatter */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden" data-testid="vendor-dashboard-performance-section">
            <VendorPerformanceScatter
              data={data?.performanceSnapshot}
              isLoading={isLoading}
            />
          </div>
        </div>
      </section>

      {/* Tables Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4 tracking-tight">Vendor Management</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Expiring Documents */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden" data-testid="vendor-dashboard-expiring-docs-section">
            <ExpiringDocumentsTable
              data={data?.expiringDocuments}
              isLoading={isLoading}
            />
          </div>

          {/* Top Vendors */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden" data-testid="vendor-dashboard-top-vendors-section">
            <TopVendorsTable data={data?.topVendors} isLoading={isLoading} />
          </div>
        </div>
      </section>
    </div>
  );
}
