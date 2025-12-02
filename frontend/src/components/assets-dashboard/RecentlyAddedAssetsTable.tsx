'use client';

/**
 * Recently Added Assets Table Component
 * Story 8.7: Assets Dashboard (AC-8, AC-14)
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
import { Eye, PackagePlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { RecentAsset } from '@/types/assets-dashboard';
import { formatDashboardDateTime, formatAssetDashboardCurrency } from '@/types/assets-dashboard';

interface RecentlyAddedAssetsTableProps {
  data: RecentAsset[] | undefined;
  isLoading?: boolean;
}

export function RecentlyAddedAssetsTable({ data, isLoading }: RecentlyAddedAssetsTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card data-testid="recently-added-assets-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            Recently Added Assets
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
      <Card data-testid="recently-added-assets-empty">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            Recently Added Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p>No recent assets added</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleViewAsset = (assetId: string) => {
    // AC-14: Quick action to view asset
    router.push(`/assets/${assetId}`);
  };

  return (
    <Card data-testid="recently-added-assets-table">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackagePlus className="h-5 w-5" />
          Recently Added Assets
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
                <TableHead>Added Date</TableHead>
                <TableHead className="text-right">Value (AED)</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.assetId} data-testid={`recent-asset-row-${item.assetId}`}>
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
                  <TableCell className="text-sm">{formatDashboardDateTime(item.addedDate)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatAssetDashboardCurrency(item.value)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewAsset(item.assetId)}
                      data-testid={`view-recent-asset-${item.assetId}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
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

export default RecentlyAddedAssetsTable;
