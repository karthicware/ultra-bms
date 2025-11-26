'use client';

/**
 * Expiring Documents Dashboard Card Component
 * Story 5.2: Vendor Document and License Management
 *
 * AC #16: Dashboard alert for documents expiring within 30 days
 * - Shows count of expiring documents
 * - Lists critical documents first (Trade License, Insurance)
 * - Links to full expiring documents page
 */

import Link from 'next/link';
import { format } from 'date-fns';
import {
  AlertTriangle,
  FileText,
  ChevronRight,
  Loader2,
  Clock,
  Building2,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useExpiringDocuments } from '@/hooks/useVendorDocuments';
import { getDocumentTypeLabel } from '@/types/vendor-documents';

interface ExpiringDocumentsCardProps {
  /** Days threshold for expiring documents (default 30) */
  days?: number;
  /** Maximum documents to show in preview */
  maxPreview?: number;
  /** Custom class name */
  className?: string;
}

export function ExpiringDocumentsCard({
  days = 30,
  maxPreview = 5,
  className,
}: ExpiringDocumentsCardProps) {
  const { data: documents, isLoading, error } = useExpiringDocuments(days);

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-destructive/50', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Expiring Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load expiring documents
          </p>
        </CardContent>
      </Card>
    );
  }

  const count = documents?.length || 0;
  const criticalCount = documents?.filter((d) => d.isCritical).length || 0;
  const previewDocs = documents?.slice(0, maxPreview) || [];
  const hasMore = count > maxPreview;

  // No expiring documents
  if (count === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-green-600" />
            Document Expiry
          </CardTitle>
          <CardDescription>No documents expiring in the next {days} days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4 text-green-600">
            <span className="text-sm">All documents are up to date</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(criticalCount > 0 ? 'border-red-200 dark:border-red-900' : 'border-yellow-200 dark:border-yellow-900', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className={cn(
              'h-5 w-5',
              criticalCount > 0 ? 'text-red-500' : 'text-yellow-500'
            )} />
            Expiring Documents
          </CardTitle>
          <Badge variant={criticalCount > 0 ? 'destructive' : 'secondary'}>
            {count} {count === 1 ? 'document' : 'documents'}
          </Badge>
        </div>
        <CardDescription>
          {criticalCount > 0 ? (
            <span className="text-red-600 dark:text-red-400">
              {criticalCount} critical {criticalCount === 1 ? 'document' : 'documents'} requiring immediate attention
            </span>
          ) : (
            `Documents expiring within ${days} days`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2">
          {previewDocs.map((doc) => (
            <Link
              key={doc.id}
              href={`/property-manager/vendors/${doc.vendorId}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  'p-2 rounded-md',
                  doc.isCritical ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
                )}>
                  <FileText className={cn(
                    'h-4 w-4',
                    doc.isCritical ? 'text-red-600' : 'text-yellow-600'
                  )} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getDocumentTypeLabel(doc.documentType)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">{doc.companyName}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      doc.daysUntilExpiry <= 7
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : doc.daysUntilExpiry <= 15
                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    )}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {doc.daysUntilExpiry} {doc.daysUntilExpiry === 1 ? 'day' : 'days'}
                  </Badge>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>

        {hasMore && (
          <div className="mt-3 pt-3 border-t">
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link href="/property-manager/vendors/expiring-documents">
                View all {count} expiring documents
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}

        {!hasMore && count > 0 && (
          <div className="mt-3 pt-3 border-t">
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link href="/property-manager/vendors/expiring-documents">
                View details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
