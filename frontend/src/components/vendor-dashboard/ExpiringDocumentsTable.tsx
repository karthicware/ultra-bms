'use client';

/**
 * Expiring Documents Table Component
 * Story 8.5: Vendor Dashboard (AC-7)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      <Card>
        <CardHeader>
          <CardTitle>Expiring Documents</CardTitle>
          <CardDescription>Vendor documents expiring within 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expiring Documents</CardTitle>
          <CardDescription>Vendor documents expiring within 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No documents expiring soon
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleViewVendor = (vendorId: string) => {
    router.push(`/vendors/${vendorId}`);
  };

  const handleUploadDocument = (vendorId: string, documentType: string) => {
    router.push(`/vendors/${vendorId}/documents?upload=true&type=${documentType}`);
  };

  return (
    <Card data-testid="vendor-expiring-documents-table">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Expiring Documents
          {data.some((d) => d.daysUntilExpiry < 7 && d.isCritical) && (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          )}
        </CardTitle>
        <CardDescription>Vendor documents expiring within 30 days</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}

export default ExpiringDocumentsTable;
