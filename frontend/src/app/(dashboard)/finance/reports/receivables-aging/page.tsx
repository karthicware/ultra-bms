'use client';

/**
 * Accounts Receivable Aging Report Page
 * Story 6.4: Financial Reporting and Analytics
 * AC #4: AR Aging Report by bucket (Current, 1-30, 31-60, 61-90, 90+)
 * AC #5: Tenant-level drill-down with outstanding amounts
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Mail,
  Building2,
  Clock,
  Users,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { getARAging, downloadPDF, downloadExcel } from '@/services/reports.service';
import {
  formatReportCurrency,
  formatPercentage,
  ReportType,
  AgingBucket,
  getAgingBucketColor,
  AGING_BUCKET_COLORS,
} from '@/types/reports';

export default function ReceivablesAgingPage() {
  const [propertyId, setPropertyId] = useState<string | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(new Set());

  // Calculate as-of date (today)
  const asOfDate = new Date().toISOString().split('T')[0];

  // Fetch AR aging data
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['arAging', asOfDate, propertyId],
    queryFn: () => getARAging({
      asOfDate,
      propertyId,
    }),
  });

  // Export handlers
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await downloadPDF({
        reportType: ReportType.AR_AGING,
        startDate: asOfDate,
        endDate: asOfDate,
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
        reportType: ReportType.AR_AGING,
        startDate: asOfDate,
        endDate: asOfDate,
        propertyId,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Toggle tenant expansion
  const toggleTenant = (tenantId: string) => {
    setExpandedTenants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tenantId)) {
        newSet.delete(tenantId);
      } else {
        newSet.add(tenantId);
      }
      return newSet;
    });
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
              Failed to load accounts receivable aging report. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate percentages for aging buckets
  const totalOutstanding = report.totalOutstanding || 0;

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
          <h1 className="text-3xl font-bold tracking-tight">Accounts Receivable Aging</h1>
          <p className="text-muted-foreground">
            As of {report.asOfDate}
            {report.propertyName && report.propertyName !== 'All Properties' && (
              <span> - {report.propertyName}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Total Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatReportCurrency(report.totalOutstanding)}
            </div>
            <p className="text-sm text-muted-foreground">
              Across all aging buckets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Total Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.totalInvoiceCount}
            </div>
            <p className="text-sm text-muted-foreground">
              Outstanding invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              Average Days Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.averageDaysOutstanding.toFixed(0)} days
            </div>
            <p className="text-sm text-muted-foreground">
              Average invoice age
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aging Buckets Visual */}
      <Card>
        <CardHeader>
          <CardTitle>Aging Distribution</CardTitle>
          <CardDescription>Outstanding amounts by aging bucket</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.agingBuckets.map((bucket) => (
            <div key={bucket.bucket} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge className={getAgingBucketColor(bucket.bucket as AgingBucket)}>
                    {bucket.bucketLabel}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({bucket.count} invoices)
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{formatReportCurrency(bucket.amount)}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({formatPercentage(bucket.percentage)})
                  </span>
                </div>
              </div>
              <Progress
                value={bucket.percentage}
                className="h-2"
                style={{
                  ['--progress-color' as string]: AGING_BUCKET_COLORS[bucket.bucket as AgingBucket] || '#767676'
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Aging Buckets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aging Summary</CardTitle>
          <CardDescription>Breakdown by aging period</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aging Period</TableHead>
                <TableHead className="text-right">Invoice Count</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.agingBuckets.map((bucket) => (
                <TableRow key={bucket.bucket}>
                  <TableCell>
                    <Badge className={getAgingBucketColor(bucket.bucket as AgingBucket)}>
                      {bucket.bucketLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{bucket.count}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatReportCurrency(bucket.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercentage(bucket.percentage)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{report.totalInvoiceCount}</TableCell>
                <TableCell className="text-right">
                  {formatReportCurrency(report.totalOutstanding)}
                </TableCell>
                <TableCell className="text-right">100.0%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tenant Details with Drill-down (AC#5) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tenant-Level Details
          </CardTitle>
          <CardDescription>
            Click on a tenant to see aging breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {report.tenantDetails.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No outstanding receivables from tenants.
              </p>
            ) : (
              report.tenantDetails.map((tenant) => (
                <Collapsible
                  key={tenant.tenantId}
                  open={expandedTenants.has(tenant.tenantId)}
                  onOpenChange={() => toggleTenant(tenant.tenantId)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        {expandedTenants.has(tenant.tenantId) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">{tenant.tenantName}</p>
                          <p className="text-sm text-muted-foreground">
                            {tenant.invoiceCount} outstanding invoice{tenant.invoiceCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">
                          {formatReportCurrency(tenant.totalOutstanding)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total outstanding
                        </p>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-7 mr-4 mb-4 p-4 bg-muted/30 rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Aging Period</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>
                              <Badge className={getAgingBucketColor(AgingBucket.CURRENT)}>
                                Current
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatReportCurrency(tenant.currentAmount)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <Badge className={getAgingBucketColor(AgingBucket.DAYS_1_30)}>
                                1-30 Days
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatReportCurrency(tenant.days1to30)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <Badge className={getAgingBucketColor(AgingBucket.DAYS_31_60)}>
                                31-60 Days
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatReportCurrency(tenant.days31to60)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <Badge className={getAgingBucketColor(AgingBucket.DAYS_61_90)}>
                                61-90 Days
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatReportCurrency(tenant.days61to90)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <Badge className={getAgingBucketColor(AgingBucket.DAYS_90_PLUS)}>
                                90+ Days
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatReportCurrency(tenant.over90Days)}
                            </TableCell>
                          </TableRow>
                          <TableRow className="font-bold border-t-2">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right">
                              {formatReportCurrency(tenant.totalOutstanding)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </div>
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
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[180px]" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-36 mb-2" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
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
