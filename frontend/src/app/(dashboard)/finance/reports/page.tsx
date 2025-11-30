'use client';

/**
 * Financial Dashboard Page
 * Story 6.4: Financial Reporting and Analytics
 * AC #6: Financial Dashboard at /finance/reports with KPIs and insights
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  AlertCircle,
  Building2,
  PieChart,
  FileText,
  BarChart3,
  RefreshCw,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getFinancialDashboard, refreshFinancialDashboard } from '@/services/reports.service';
import { formatReportCurrency, formatReportPercentage } from '@/types/reports';

// Query keys
const DASHBOARD_QUERY_KEY = ['financialDashboard'];

// Format relative time
function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export default function FinancialDashboardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [propertyId, setPropertyId] = useState<string | undefined>(undefined);

  // Fetch financial dashboard data
  const {
    data: dashboard,
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, propertyId],
    queryFn: () => getFinancialDashboard(propertyId),
    staleTime: 60 * 60 * 1000, // 1 hour (matches backend cache)
  });

  // Refresh mutation
  const refreshMutation = useMutation({
    mutationFn: refreshFinancialDashboard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      toast({
        title: 'Dashboard Refreshed',
        description: 'Financial dashboard data has been updated.',
        variant: 'success',
      });
    },
    onError: () => {
      toast({
        title: 'Refresh Failed',
        description: 'Could not refresh dashboard. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Report navigation cards
  const reportCards = [
    {
      title: 'Income Statement (P&L)',
      description: 'Revenue vs expenses with profit margin analysis',
      href: '/finance/reports/income-statement',
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: 'Cash Flow Summary',
      description: 'Cash inflows, outflows, and monthly trends',
      href: '/finance/reports/cash-flow',
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'AR Aging Report',
      description: 'Outstanding receivables by aging bucket',
      href: '/finance/reports/receivables-aging',
      icon: Clock,
      color: 'bg-orange-500',
    },
    {
      title: 'Revenue Breakdown',
      description: 'Revenue by property, type, and trends',
      href: '/finance/reports/revenue',
      icon: PieChart,
      color: 'bg-purple-500',
    },
    {
      title: 'Expense Breakdown',
      description: 'Expenses by category, vendor, and property',
      href: '/finance/reports/expenses',
      icon: BarChart3,
      color: 'bg-red-500',
    },
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Failed to load financial dashboard data. Please try again.
            </p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY })}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpis = dashboard?.kpis;
  const insights = dashboard?.insights;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            {dashboard?.currentMonth} financial overview
            {dashboard?.propertyName && dashboard.propertyName !== 'All Properties' && (
              <span> for {dashboard.propertyName}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={propertyId || 'all'}
            onValueChange={(value) => setPropertyId(value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {/* Property list would be populated from a properties query */}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending || isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(refreshMutation.isPending || isFetching) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Cache info */}
      {dashboard?.cachedAt && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Last updated: {formatRelativeTime(dashboard.cachedAt)}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatReportCurrency(kpis?.totalRevenue || 0)}
            </div>
            <p className={`text-xs ${(kpis?.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatReportPercentage(kpis?.revenueGrowth || 0)} from {dashboard?.previousMonth}
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatReportCurrency(kpis?.totalExpenses || 0)}
            </div>
            <p className={`text-xs ${(kpis?.expenseGrowth || 0) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatReportPercentage(kpis?.expenseGrowth || 0)} from {dashboard?.previousMonth}
            </p>
          </CardContent>
        </Card>

        {/* Net Profit/Loss */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle>
            {(kpis?.netProfitLoss || 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(kpis?.netProfitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatReportCurrency(kpis?.netProfitLoss || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue minus expenses
            </p>
          </CardContent>
        </Card>

        {/* Collection Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(kpis?.collectionRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Of invoiced amount collected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Receivables Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Outstanding Receivables</CardTitle>
            <CardDescription>Total amount pending collection</CardDescription>
          </div>
          <Link href="/finance/reports/receivables-aging">
            <Button variant="outline" size="sm">
              View AR Aging
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">
            {formatReportCurrency(kpis?.outstandingReceivables || 0)}
          </div>
        </CardContent>
      </Card>

      {/* Insights Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Performing Property */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-green-600" />
              Top Performing Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights?.topPerformingProperty ? (
              <div className="space-y-2">
                <p className="text-xl font-semibold">
                  {insights.topPerformingProperty.propertyName}
                </p>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {formatReportCurrency(insights.topPerformingProperty.revenue)} revenue
                </Badge>
              </div>
            ) : (
              <p className="text-muted-foreground">No property data available</p>
            )}
          </CardContent>
        </Card>

        {/* Highest Expense Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Highest Expense Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights?.highestExpenseCategory ? (
              <div className="space-y-2">
                <p className="text-xl font-semibold">
                  {insights.highestExpenseCategory.categoryLabel}
                </p>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {formatReportCurrency(insights.highestExpenseCategory.amount)} spent
                </Badge>
              </div>
            ) : (
              <p className="text-muted-foreground">No expense data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Navigation Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Financial Reports</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportCards.map((report) => (
            <Link key={report.href} href={report.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className={`p-2 rounded-lg ${report.color}`}>
                    <report.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for dashboard
function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-6 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
