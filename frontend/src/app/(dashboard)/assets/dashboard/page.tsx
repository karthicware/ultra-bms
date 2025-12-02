'use client';

/**
 * Assets Dashboard Page
 * Story 8.7: Assets Dashboard (AC-16, AC-19, AC-22)
 *
 * Provides a comprehensive view of asset metrics and management:
 * - KPI cards (total assets, total value, overdue PM, highest TCO)
 * - Assets by category donut chart
 * - Top 5 maintenance spend bar chart
 * - Overdue PM assets table
 * - Recently added assets table
 * - Depreciation summary card
 */

import { useAssetsDashboard } from '@/hooks/useAssetsDashboard';
import {
  AssetKpiCards,
  AssetsByCategoryChart,
  TopMaintenanceSpendChart,
  OverduePmTable,
  RecentlyAddedAssetsTable,
  DepreciationSummaryCard,
} from '@/components/assets-dashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function AssetsDashboardPage() {
  const { data, isLoading, error, refetch, isRefetching } = useAssetsDashboard();

  if (error) {
    return (
      <div className="container mx-auto p-6" data-testid="assets-dashboard-error">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load assets dashboard data'}
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
    <div className="container mx-auto p-6 space-y-6" data-testid="assets-dashboard-page">
      {/* Page Header */}
      <div className="flex items-center justify-between" data-testid="assets-dashboard-header">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor asset performance, maintenance, and depreciation metrics
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          disabled={isRefetching}
          data-testid="assets-dashboard-refresh"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards Row (AC-1 to AC-4) */}
      <section data-testid="assets-dashboard-kpi-section">
        <AssetKpiCards kpis={data?.kpis} isLoading={isLoading} />
      </section>

      {/* Charts Row (AC-5, AC-6) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Assets by Category Donut Chart (AC-5, AC-11) */}
        <section data-testid="assets-dashboard-category-section">
          <AssetsByCategoryChart
            data={data?.assetsByCategory}
            isLoading={isLoading}
          />
        </section>

        {/* Top 5 Maintenance Spend Bar Chart (AC-6, AC-12) */}
        <section data-testid="assets-dashboard-maintenance-section">
          <TopMaintenanceSpendChart
            data={data?.topMaintenanceSpend}
            isLoading={isLoading}
          />
        </section>
      </div>

      {/* Tables and Summary Row (AC-7, AC-8, AC-9) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Overdue PM Assets Table (AC-7, AC-13) - spans 2 columns */}
        <section className="xl:col-span-2" data-testid="assets-dashboard-overdue-section">
          <OverduePmTable
            data={data?.overduePmAssets}
            isLoading={isLoading}
          />
        </section>

        {/* Depreciation Summary Card (AC-9, AC-15) */}
        <section data-testid="assets-dashboard-depreciation-section">
          <DepreciationSummaryCard
            data={data?.depreciationSummary}
            isLoading={isLoading}
          />
        </section>
      </div>

      {/* Recently Added Assets (AC-8, AC-14) */}
      <section data-testid="assets-dashboard-recent-section">
        <RecentlyAddedAssetsTable
          data={data?.recentlyAddedAssets}
          isLoading={isLoading}
        />
      </section>
    </div>
  );
}
