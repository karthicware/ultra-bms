'use client';

/**
 * Income Statement (P&L) Report Page
 * Story 6.4: Financial Reporting and Analytics
 * AC #1, #2: Income Statement with revenue/expense breakdown and MoM comparison
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Mail,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getIncomeStatement, downloadPDF, downloadExcel } from '@/services/reports.service';
import { formatReportCurrency, formatReportPercentage, ReportType, DateRangePreset } from '@/types/reports';

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
    case DateRangePreset.LAST_QUARTER: {
      const lastQuarterStart = Math.floor(month / 3) * 3 - 3;
      const adjustedYear = lastQuarterStart < 0 ? year - 1 : year;
      const adjustedMonth = lastQuarterStart < 0 ? lastQuarterStart + 12 : lastQuarterStart;
      return {
        startDate: new Date(adjustedYear, adjustedMonth, 1).toISOString().split('T')[0],
        endDate: new Date(adjustedYear, adjustedMonth + 3, 0).toISOString().split('T')[0],
      };
    }
    case DateRangePreset.THIS_YEAR:
      return {
        startDate: new Date(year, 0, 1).toISOString().split('T')[0],
        endDate: new Date(year, 11, 31).toISOString().split('T')[0],
      };
    case DateRangePreset.LAST_YEAR:
      return {
        startDate: new Date(year - 1, 0, 1).toISOString().split('T')[0],
        endDate: new Date(year - 1, 11, 31).toISOString().split('T')[0],
      };
    default:
      return {
        startDate: new Date(year, month, 1).toISOString().split('T')[0],
        endDate: new Date(year, month + 1, 0).toISOString().split('T')[0],
      };
  }
}

export default function IncomeStatementPage() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>(DateRangePreset.THIS_MONTH);
  const [propertyId, setPropertyId] = useState<string | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  const dateRange = getDateRange(datePreset);

  // Fetch income statement data
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['incomeStatement', dateRange.startDate, dateRange.endDate, propertyId],
    queryFn: () => getIncomeStatement({
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
        reportType: ReportType.INCOME_STATEMENT,
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
        reportType: ReportType.INCOME_STATEMENT,
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
              Failed to load income statement. Please try again.
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
          <h1 className="text-3xl font-bold tracking-tight">Income Statement (P&L)</h1>
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
              <SelectItem value={DateRangePreset.LAST_QUARTER}>Last Quarter</SelectItem>
              <SelectItem value={DateRangePreset.THIS_YEAR}>This Year</SelectItem>
              <SelectItem value={DateRangePreset.LAST_YEAR}>Last Year</SelectItem>
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatReportCurrency(report.totalRevenue)}
            </div>
            <div className={`text-sm flex items-center gap-1 ${report.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {report.revenueChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatReportPercentage(report.revenueChange)} vs previous period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatReportCurrency(report.totalExpenses)}
            </div>
            <div className={`text-sm flex items-center gap-1 ${report.expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {report.expenseChange <= 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              {formatReportPercentage(report.expenseChange)} vs previous period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${report.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatReportCurrency(report.netIncome)}
            </div>
            <div className={`text-sm flex items-center gap-1 ${report.netIncomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {report.netIncomeChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatReportPercentage(report.netIncomeChange)} vs previous period
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Net Margin: {report.netMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
          <CardDescription>Revenue by category</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.revenueBreakdown.map((item) => (
                <TableRow key={item.category}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell className="text-right">{formatReportCurrency(item.amount)}</TableCell>
                  <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell>Total Revenue</TableCell>
                <TableCell className="text-right text-green-600">
                  {formatReportCurrency(report.totalRevenue)}
                </TableCell>
                <TableCell className="text-right">100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
          <CardDescription>Expenses by category</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.expenseBreakdown.map((item) => (
                <TableRow key={item.category}>
                  <TableCell className="font-medium">{item.categoryLabel}</TableCell>
                  <TableCell className="text-right">{formatReportCurrency(item.amount)}</TableCell>
                  <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell>Total Expenses</TableCell>
                <TableCell className="text-right text-red-600">
                  {formatReportCurrency(report.totalExpenses)}
                </TableCell>
                <TableCell className="text-right">100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Period Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Period Comparison</CardTitle>
          <CardDescription>Current vs Previous Period</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Current Period</TableHead>
                <TableHead className="text-right">Previous Period</TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total Revenue</TableCell>
                <TableCell className="text-right">{formatReportCurrency(report.totalRevenue)}</TableCell>
                <TableCell className="text-right">{formatReportCurrency(report.previousPeriodRevenue)}</TableCell>
                <TableCell className={`text-right ${report.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatReportPercentage(report.revenueChange)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Total Expenses</TableCell>
                <TableCell className="text-right">{formatReportCurrency(report.totalExpenses)}</TableCell>
                <TableCell className="text-right">{formatReportCurrency(report.previousPeriodExpenses)}</TableCell>
                <TableCell className={`text-right ${report.expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatReportPercentage(report.expenseChange)}
                </TableCell>
              </TableRow>
              <TableRow className="font-bold">
                <TableCell>Net Income</TableCell>
                <TableCell className={`text-right ${report.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatReportCurrency(report.netIncome)}
                </TableCell>
                <TableCell className={`text-right ${report.previousPeriodNetIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatReportCurrency(report.previousPeriodNetIncome)}
                </TableCell>
                <TableCell className={`text-right ${report.netIncomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatReportPercentage(report.netIncomeChange)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
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
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
