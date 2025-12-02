'use client';

/**
 * Overdue Preventive Maintenance Assets Table Component
 * Story 8.7: Assets Dashboard (AC-7, AC-13)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Eye, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { OverduePmAsset } from '@/types/assets-dashboard';
import { formatDashboardDate, getOverdueBadgeClass } from '@/types/assets-dashboard';

interface OverduePmTableProps {
  data: OverduePmAsset[] | undefined;
  isLoading?: boolean;
}

export function OverduePmTable({ data, isLoading }: OverduePmTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card data-testid="overdue-pm-table-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Overdue Preventive Maintenance
          </CardTitle>
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
      <Card data-testid="overdue-pm-table-empty">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-green-500" />
            Overdue Preventive Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p>All preventive maintenance is up to date</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleCreateWorkOrder = (assetId: string) => {
    // AC-13: Quick action to create work order
    router.push(`/work-orders/new?assetId=${assetId}&type=PM`);
  };

  const handleViewAsset = (assetId: string) => {
    router.push(`/assets/${assetId}`);
  };

  return (
    <Card data-testid="overdue-pm-table">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Overdue Preventive Maintenance
          <Badge variant="secondary" className="ml-2">
            {data.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Last PM</TableHead>
                <TableHead className="text-center">Days Overdue</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow
                  key={item.assetId}
                  className={cn(item.isCritical && 'bg-red-50 dark:bg-red-950/20')}
                  data-testid={`overdue-pm-row-${item.assetId}`}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.assetName}</p>
                      <p className="text-xs text-muted-foreground">{item.assetNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.categoryDisplayName}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">{item.propertyName}</TableCell>
                  <TableCell>{formatDashboardDate(item.lastPmDate)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={getOverdueBadgeClass(item.isCritical)}>
                      {item.daysOverdue} days
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewAsset(item.assetId)}
                        data-testid={`view-asset-${item.assetId}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleCreateWorkOrder(item.assetId)}
                        data-testid={`create-wo-${item.assetId}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Create WO
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default OverduePmTable;
