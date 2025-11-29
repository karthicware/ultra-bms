'use client';

/**
 * Cash Flow Summary Report Page
 * Story 6.4: Financial Reporting and Analytics
 * AC #3: Cash Flow Report with inflows, outflows, and net position
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
  ArrowUpRight,
  ArrowDownRight,
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
import { getCashFlow, downloadPDF, downloadExcel } from '@/services/reports.service';
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

export default function CashFlowPage() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>(DateRangePreset.THIS_MONTH);
  const [propertyId, setPropertyId] = useState<string | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  const dateRange = getDateRange(datePreset);

  // Fetch cash flow data
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['cashFlow', dateRange.startDate, dateRange.endDate, propertyId],
    queryFn: () => getCashFlow({
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
        reportType: ReportType.CASH_FLOW,
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
        reportType: ReportType.CASH_FLOW,
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
              Failed to load cash flow report. Please try again.
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
          <h1 className="text-3xl font-bold tracking-tight">Cash Flow Summary</h1>
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              Cash Inflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatReportCurrency(report.totalInflows)}
            </div>
            <div className={`text-sm flex items-center gap-1 ${report.inflowChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {report.inflowChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatReportPercentage(report.inflowChange)} vs previous period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-red-600" />
              Cash Outflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatReportCurrency(report.totalOutflows)}
            </div>
            <div className={`text-sm flex items-center gap-1 ${report.outflowChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {report.outflowChange <= 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              {formatReportPercentage(report.outflowChange)} vs previous period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${report.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatReportCurrency(report.netCashFlow)}
            </div>
            <div className={`text-sm flex items-center gap-1 ${report.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {report.netChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatReportPercentage(report.netChange)} vs previous period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Cash Flow Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Cash Flow</CardTitle>
          <CardDescription>Month-by-month breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Inflows</TableHead>
                <TableHead className="text-right">Outflows</TableHead>
                <TableHead className="text-right">Net Cash Flow</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.monthlyCashFlows.map((month) => (
                <TableRow key={month.month}>
                  <TableCell className="font-medium">{month.month}</TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatReportCurrency(month.inflows)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {formatReportCurrency(month.outflows)}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${month.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatReportCurrency(month.net)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell>Total</TableCell>
                <TableCell className="text-right text-green-600">
                  {formatReportCurrency(report.totalInflows)}
                </TableCell>
                <TableCell className="text-right text-red-600">
                  {formatReportCurrency(report.totalOutflows)}
                </TableCell>
                <TableCell className={`text-right ${report.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatReportCurrency(report.netCashFlow)}
                </TableCell>
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
                <TableCell className="font-medium">Cash Inflows</TableCell>
                <TableCell className="text-right text-green-600">{formatReportCurrency(report.totalInflows)}</TableCell>
                <TableCell className="text-right">{formatReportCurrency(report.previousPeriodInflows)}</TableCell>
                <TableCell className={`text-right ${report.inflowChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatReportPercentage(report.inflowChange)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Cash Outflows</TableCell>
                <TableCell className="text-right text-red-600">{formatReportCurrency(report.totalOutflows)}</TableCell>
                <TableCell className="text-right">{formatReportCurrency(report.previousPeriodOutflows)}</TableCell>
                <TableCell className={`text-right ${report.outflowChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatReportPercentage(report.outflowChange)}
                </TableCell>
              </TableRow>
              <TableRow className="font-bold">
                <TableCell>Net Cash Flow</TableCell>
                <TableCell className={`text-right ${report.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatReportCurrency(report.netCashFlow)}
                </TableCell>
                <TableCell className={`text-right ${report.previousPeriodNetCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatReportCurrency(report.previousPeriodNetCashFlow)}
                </TableCell>
                <TableCell className={`text-right ${report.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatReportPercentage(report.netChange)}
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
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
