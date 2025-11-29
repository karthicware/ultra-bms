'use client';

/**
 * Expense Breakdown Report Page
 * Story 6.4: Financial Reporting and Analytics
 * AC #8: Expense breakdown by category and vendor with charts
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Mail,
  Calendar,
  Building2,
  TrendingDown,
  PieChart,
  BarChart3,
  Users,
  Wrench,
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
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getExpenseBreakdown, downloadPDF, downloadExcel } from '@/services/reports.service';
import {
  formatReportCurrency,
  formatPercentage,
  ReportType,
  DateRangePreset,
  CHART_COLOR_PALETTE,
} from '@/types/reports';

// Get date range from preset
function getDateRange(preset: DateRangePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (preset) {
    case DateRangePreset.THIS_MONTH:
      return {
        startDate: new Date(year, month, 1).toISOString().split('T')[0],
        endDate: new Date(year, month + 1, 0).toISOString().split('T')[0],
      };
    case DateRangePreset.LAST_MONTH:
      return {
        startDate: new Date(year, month - 1, 1).toISOString().split('T')[0],
        endDate: new Date(year, month, 0).toISOString().split('T')[0],
      };
    case DateRangePreset.THIS_QUARTER: {
      const quarterStart = Math.floor(month / 3) * 3;
      return {
        startDate: new Date(year, quarterStart, 1).toISOString().split('T')[0],
        endDate: new Date(year, quarterStart + 3, 0).toISOString().split('T')[0],
      };
    }
    case DateRangePreset.THIS_YEAR:
      return {
        startDate: new Date(year, 0, 1).toISOString().split('T')[0],
        endDate: new Date(year, 11, 31).toISOString().split('T')[0],
      };
    default:
      return {
        startDate: new Date(year, month, 1).toISOString().split('T')[0],
        endDate: new Date(year, month + 1, 0).toISOString().split('T')[0],
      };
  }
}

export default function ExpenseBreakdownPage() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>(DateRangePreset.THIS_YEAR);
  const [propertyId, setPropertyId] = useState<string | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  const dateRange = getDateRange(datePreset);

  // Fetch expense breakdown data
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['expenseBreakdown', dateRange.startDate, dateRange.endDate, propertyId],
    queryFn: () => getExpenseBreakdown({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      propertyId,
    }),
  });

  // Export handlers
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await downloadPDF({
        reportType: ReportType.EXPENSE_BREAKDOWN,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        propertyId,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await downloadExcel({
        reportType: ReportType.EXPENSE_BREAKDOWN,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        propertyId,
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (error || !report) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Failed to load expense breakdown report. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/finance/reports">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Breakdown</h1>
          <p className="text-muted-foreground">
            {report.startDate} to {report.endDate}
            {report.propertyName && report.propertyName !== 'All Properties' && (
              <span> - {report.propertyName}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={datePreset}
            onValueChange={(value) => setDatePreset(value as DateRangePreset)}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DateRangePreset.THIS_MONTH}>This Month</SelectItem>
              <SelectItem value={DateRangePreset.LAST_MONTH}>Last Month</SelectItem>
              <SelectItem value={DateRangePreset.THIS_QUARTER}>This Quarter</SelectItem>
              <SelectItem value={DateRangePreset.THIS_YEAR}>This Year</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={propertyId || 'all'}
            onValueChange={(value) => setPropertyId(value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[180px]">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isExporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel
        </Button>
        <Button variant="outline" size="sm" disabled>
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
      </div>

      {/* Total Expenses Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            Total Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">
            {formatReportCurrency(report.totalExpenses)}
          </div>
          <p className="text-sm text-muted-foreground">
            For the selected period
          </p>
        </CardContent>
      </Card>

      {/* Expense by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Expenses by Category
          </CardTitle>
          <CardDescription>Distribution by expense category</CardDescription>
        </CardHeader>
        <CardContent>
          {report.expenseByCategory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No expense category data available.
            </p>
          ) : (
            <div className="space-y-4">
              {report.expenseByCategory.map((item, index) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length] }}
                      />
                      <span className="font-medium">{item.categoryLabel}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{formatReportCurrency(item.amount)}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({formatPercentage(item.percentage)})
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={item.percentage}
                    className="h-2"
                    style={{
                      ['--progress-foreground' as string]: CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Vendors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Vendors
          </CardTitle>
          <CardDescription>Highest payments by vendor</CardDescription>
        </CardHeader>
        <CardContent>
          {report.topVendors.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No vendor payment data available.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Amount Paid</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.topVendors.map((vendor, index) => (
                  <TableRow key={vendor.vendorId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length] }}
                        />
                        <span className="font-medium">{vendor.vendorName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {formatReportCurrency(vendor.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(vendor.percentage)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Monthly Expense Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Expense Trend
          </CardTitle>
          <CardDescription>Month-by-month expense performance</CardDescription>
        </CardHeader>
        <CardContent>
          {report.monthlyTrend.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No monthly trend data available.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="w-[40%]">Visual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.monthlyTrend.map((item) => {
                  const maxAmount = Math.max(...report.monthlyTrend.map(m => m.amount));
                  const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                  return (
                    <TableRow key={item.month}>
                      <TableCell className="font-medium">{item.month}</TableCell>
                      <TableCell className="text-right text-red-600 font-medium">
                        {formatReportCurrency(item.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Cost by Property */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Costs by Property
          </CardTitle>
          <CardDescription>Work order expenses per property</CardDescription>
        </CardHeader>
        <CardContent>
          {report.maintenanceCostByProperty.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No maintenance cost data available.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead className="text-right">Maintenance Cost</TableHead>
                  <TableHead className="w-[40%]">Visual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.maintenanceCostByProperty.map((item, index) => {
                  const maxAmount = Math.max(...report.maintenanceCostByProperty.map(p => p.amount));
                  const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                  return (
                    <TableRow key={item.propertyId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length] }}
                          />
                          <span className="font-medium">{item.propertyName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatReportCurrency(item.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Skeleton loader
function ReportSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-20" />
      </div>
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
