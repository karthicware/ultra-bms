'use client';

/**
 * Asset Depreciation Summary Card Component
 * Story 8.7: Assets Dashboard (AC-9, AC-15)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DepreciationSummary } from '@/types/assets-dashboard';
import { formatAssetDashboardCurrency, formatPercentage } from '@/types/assets-dashboard';

interface DepreciationSummaryCardProps {
  data: DepreciationSummary | undefined;
  isLoading?: boolean;
}

export function DepreciationSummaryCard({ data, isLoading }: DepreciationSummaryCardProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card data-testid="depreciation-summary-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Depreciation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card data-testid="depreciation-summary-empty">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Depreciation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p>No depreciation data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleViewDetails = () => {
    // AC-15: Click navigates to detailed depreciation report
    router.push('/reports/depreciation');
  };

  return (
    <Card
      data-testid="depreciation-summary-card"
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={handleViewDetails}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Depreciation Summary
          </span>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Original vs Current Value */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Original Value</p>
            <p className="text-lg font-semibold">
              {formatAssetDashboardCurrency(data.originalValueTotal)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Value</p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {formatAssetDashboardCurrency(data.currentValueTotal)}
            </p>
          </div>
        </div>

        {/* Depreciation Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Depreciation</p>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
              {formatPercentage(data.depreciationPercentage)}
            </Badge>
          </div>
          <Progress
            value={data.depreciationPercentage}
            className="h-2"
            data-testid="depreciation-progress"
          />
          <p className="text-sm font-medium mt-1">
            {formatAssetDashboardCurrency(data.totalDepreciation)}
          </p>
        </div>

        {/* Asset Statistics */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Depreciable Assets</p>
            <p className="text-lg font-semibold">{data.totalDepreciableAssets.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fully Depreciated</p>
            <p className="text-lg font-semibold text-muted-foreground">
              {data.fullyDepreciatedAssets.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Click hint */}
        <p className="text-xs text-muted-foreground text-center pt-2">
          Click to view detailed depreciation report
        </p>
      </CardContent>
    </Card>
  );
}

export default DepreciationSummaryCard;
