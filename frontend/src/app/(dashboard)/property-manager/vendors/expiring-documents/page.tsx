'use client';

/**
 * Expiring Documents List Page
 * Story 5.2: Vendor Document and License Management
 *
 * AC #17: Dedicated page showing all documents expiring within configurable days
 * - Filterable by days threshold
 * - Shows vendor info, document type, expiry date, days remaining
 * - Links to vendor detail page for document management
 */

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  Clock,
  ArrowLeft,
  Filter,
  ExternalLink,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useExpiringDocuments } from '@/hooks/useVendorDocuments';
import { getDocumentTypeLabel } from '@/types/vendor-documents';

// Days threshold options
const DAYS_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '15', label: '15 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
];

export default function ExpiringDocumentsPage() {
  const [days, setDays] = useState(30);
  const { data: documents, isLoading, error } = useExpiringDocuments(days);

  // Get urgency level based on days until expiry
  const getUrgencyBadge = (daysUntilExpiry: number, isCritical: boolean) => {
    if (daysUntilExpiry <= 0) {
      return (
        <Badge variant="destructive" className="font-semibold">
          EXPIRED
        </Badge>
      );
    }
    if (daysUntilExpiry <= 7) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <Clock className="h-3 w-3 mr-1" />
          {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}
        </Badge>
      );
    }
    if (daysUntilExpiry <= 15) {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
          <Clock className="h-3 w-3 mr-1" />
          {daysUntilExpiry} days
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <Clock className="h-3 w-3 mr-1" />
        {daysUntilExpiry} days
      </Badge>
    );
  };

  // Stats
  const totalCount = documents?.length || 0;
  const criticalCount = documents?.filter((d) => d.isCritical).length || 0;
  const urgentCount = documents?.filter((d) => d.daysUntilExpiry <= 7).length || 0;

  return (
    <div className="container mx-auto space-y-6">      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            Expiring Documents
          </h1>
          <p className="text-muted-foreground mt-1">
            Vendor documents requiring renewal or attention
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Show expiring within:</span>
          </div>
          <Select
            value={String(days)}
            onValueChange={(value) => setDays(Number(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expiring</CardDescription>
            <CardTitle className="text-3xl">{totalCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Within {days} days
            </p>
          </CardContent>
        </Card>
        <Card className={criticalCount > 0 ? 'border-red-200 dark:border-red-900' : ''}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Critical Documents
            </CardDescription>
            <CardTitle className={cn('text-3xl', criticalCount > 0 && 'text-red-600')}>
              {criticalCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Trade License & Insurance
            </p>
          </CardContent>
        </Card>
        <Card className={urgentCount > 0 ? 'border-orange-200 dark:border-orange-900' : ''}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Urgent (≤7 days)
            </CardDescription>
            <CardTitle className={cn('text-3xl', urgentCount > 0 && 'text-orange-600')}>
              {urgentCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents List</CardTitle>
          <CardDescription>
            All vendor documents expiring within {days} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-2" />
              <p className="text-muted-foreground">Failed to load expiring documents</p>
            </div>
          ) : !documents || documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No Expiring Documents</h3>
              <p className="text-muted-foreground">
                No vendor documents are expiring within the next {days} days
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Time Remaining</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow
                      key={doc.id}
                      className={cn(
                        doc.daysUntilExpiry <= 7 && 'bg-red-50/50 dark:bg-red-900/10'
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.companyName}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {doc.vendorNumber}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={doc.isCritical ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {doc.isCritical && (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            )}
                            {getDocumentTypeLabel(doc.documentType)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[150px]" title={doc.fileName}>
                            {doc.fileName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(doc.expiryDate), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getUrgencyBadge(doc.daysUntilExpiry, doc.isCritical ?? false)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/property-manager/vendors/${doc.vendorId}`}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Vendor
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
