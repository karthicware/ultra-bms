'use client';

/**
 * Expiring Documents Table Component
 * Story 8.5: Vendor Dashboard (AC-7)
 */

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Upload, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ExpiringDocument } from '@/types/vendor-dashboard';

interface ExpiringDocumentsTableProps {
  data: ExpiringDocument[] | undefined;
  isLoading?: boolean;
}

export function ExpiringDocumentsTable({ data, isLoading }: ExpiringDocumentsTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-1 mb-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6">
        <div className="space-y-1 mb-6">
          <h3 className="font-semibold text-lg">Expiring Documents</h3>
          <p className="text-sm text-muted-foreground">Vendor documents expiring within 30 days</p>
        </div>
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          No documents expiring soon
        </div>
      </div>
    );
  }

  const handleViewVendor = (vendorId: string) => {
    router.push(`/vendors/${vendorId}`);
  };

  const handleUploadDocument = (vendorId: string, documentType: string) => {
    router.push(`/vendors/${vendorId}/documents?upload=true&type=${documentType}`);
  };

  return (
    <div className="p-6" data-testid="vendor-expiring-documents-table">
      <div className="space-y-1 mb-6">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Expiring Documents</h3>
          {data.some((d) => d.daysUntilExpiry < 7 && d.isCritical) && (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">Vendor documents expiring within 30 days</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor Name</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead className="text-center">Days Until Expiry</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((doc) => {
              const isUrgent = doc.daysUntilExpiry < 7;
              const isExpired = doc.daysUntilExpiry < 0;

              return (
                <TableRow
                  key={doc.documentId}
                  className={cn(isUrgent && 'bg-red-50 dark:bg-red-950/20')}
                  data-testid={`vendor-expiring-doc-row-${doc.documentId}`}
                >
                  <TableCell className="font-medium">{doc.vendorName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {doc.documentTypeName}
                      {doc.isCritical && (
                        <Badge variant="destructive" className="text-xs">
                          Critical
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(parseISO(doc.expiryDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={isExpired ? 'destructive' : isUrgent ? 'destructive' : 'secondary'}
                      className={cn(
                        isExpired && 'bg-red-600',
                        isUrgent && !isExpired && 'bg-red-500',
                        !isUrgent && !isExpired && 'bg-amber-500 text-white'
                      )}
                    >
                      {isExpired
                        ? `Expired ${Math.abs(doc.daysUntilExpiry)} days ago`
                        : `${doc.daysUntilExpiry} days`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewVendor(doc.vendorId)}
                        data-testid={`vendor-expiring-doc-view-${doc.documentId}`}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Vendor</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUploadDocument(doc.vendorId, doc.documentType)}
                        data-testid={`vendor-expiring-doc-upload-${doc.documentId}`}
                      >
                        <Upload className="h-4 w-4" />
                        <span className="sr-only">Upload Document</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default ExpiringDocumentsTable;
