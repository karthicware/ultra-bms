'use client';

/**
 * Finance Dashboard Page
 * Story 8.6: Finance Dashboard
 * AC-1 to AC-22: Comprehensive finance metrics dashboard
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, AlertCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Dashboard components
import {
  FinanceKpiCards,
  IncomeExpenseChart,
  ExpenseCategoriesDonut,
  OutstandingReceivablesCard,
  RecentTransactionsTable,
  PdcStatusCard,
} from '@/components/finance-dashboard';

// Hooks
import { useFinanceDashboard } from '@/hooks/useFinanceDashboard';
import { useProperties } from '@/hooks/useProperties';

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function FinanceDashboardPage() {
  const router = useRouter();
  const [propertyId, setPropertyId] = useState<string | undefined>();

  // Fetch finance dashboard data (AC-10)
  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
  } = useFinanceDashboard(propertyId);

  // Fetch properties for filter dropdown (AC-20)
  const { data: propertiesData, isLoading: propertiesLoading } = useProperties();
  const properties = propertiesData?.content ?? [];

  // Handle property filter change
  const handlePropertyChange = useCallback((value: string) => {
    setPropertyId(value === 'all' ? undefined : value);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setPropertyId(undefined);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div
      className="container mx-auto space-y-6 py-6"
      data-testid="finance-dashboard-page"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Finance Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor financial performance and cash flow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Property Filter */}
          <Select
            value={propertyId ?? 'all'}
            onValueChange={handlePropertyChange}
            disabled={propertiesLoading}
          >
            <SelectTrigger className="w-[200px]" data-testid="finance-property-filter">
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
          {propertyId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              data-testid="finance-clear-filters"
            >
              Clear filters
            </Button>
          )}

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            data-testid="finance-refresh-btn"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" data-testid="finance-dashboard-error">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>
            {error?.message || 'Failed to load finance dashboard. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards (AC-1, AC-2, AC-3, AC-4, AC-17, AC-21) */}
      <FinanceKpiCards kpis={dashboard?.kpis} isLoading={isLoading} />

      {/* Charts Row - Income vs Expense & Expense Categories */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Income vs Expense Chart (AC-5, AC-16) */}
        <IncomeExpenseChart
          data={dashboard?.incomeVsExpense}
          isLoading={isLoading}
        />

        {/* Expense Categories Donut (AC-6, AC-19) */}
        <ExpenseCategoriesDonut
          data={dashboard?.expenseCategories}
          isLoading={isLoading}
        />
      </div>

      {/* Receivables and PDC Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Outstanding Receivables (AC-7) */}
        <OutstandingReceivablesCard
          data={dashboard?.outstandingReceivables}
          isLoading={isLoading}
        />

        {/* PDC Status (AC-9) */}
        <PdcStatusCard data={dashboard?.pdcStatus} isLoading={isLoading} />
      </div>

      {/* Recent Transactions Table (AC-8) */}
      <RecentTransactionsTable
        data={dashboard?.recentTransactions}
        isLoading={isLoading}
      />
    </div>
  );
}
