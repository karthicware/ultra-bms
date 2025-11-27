'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, BarChart3 } from 'lucide-react';
import type { VendorRatingDistribution } from '@/types/vendor-ratings';
import { cn } from '@/lib/utils';

/**
 * RatingDistributionChart Component
 * Story 5.3: Vendor Performance Tracking and Rating
 *
 * Displays horizontal bar chart showing rating distribution
 * from 5 stars to 1 star with counts and percentages.
 */

interface RatingDistributionChartProps {
  /** Distribution data */
  distribution: VendorRatingDistribution | undefined;
  /** Loading state */
  isLoading?: boolean;
  /** Show as card or inline */
  variant?: 'card' | 'inline';
}

interface RatingBarProps {
  stars: number;
  count: number;
  percent: number;
  maxPercent: number;
  testId: string;
}

function RatingBar({ stars, count, percent, maxPercent, testId }: RatingBarProps) {
  // Scale bar width relative to max for visual balance
  const barWidth = maxPercent > 0 ? (percent / maxPercent) * 100 : 0;

  return (
    <div
      className="flex items-center gap-3"
      data-testid={testId}
    >
      {/* Star label */}
      <div className="flex items-center gap-1 w-16 shrink-0">
        <span className="text-sm font-medium">{stars}</span>
        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
      </div>

      {/* Bar */}
      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            stars >= 4 ? 'bg-green-500' :
            stars === 3 ? 'bg-yellow-500' :
            'bg-red-500'
          )}
          style={{ width: `${barWidth}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${stars} star ratings: ${percent.toFixed(1)}%`}
        />
      </div>

      {/* Count and percent */}
      <div className="flex items-center gap-2 w-24 shrink-0 justify-end">
        <span className="text-sm font-medium" data-testid={`${testId}-count`}>
          {count}
        </span>
        <span className="text-sm text-muted-foreground w-12 text-right" data-testid={`${testId}-percent`}>
          {percent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function DistributionSkeleton() {
  return (
    <div className="space-y-3">
      {[5, 4, 3, 2, 1].map((star) => (
        <div key={star} className="flex items-center gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 flex-1 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export function RatingDistributionChart({
  distribution,
  isLoading,
  variant = 'card'
}: RatingDistributionChartProps) {
  if (isLoading) {
    if (variant === 'inline') {
      return <DistributionSkeleton />;
    }
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <DistributionSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (!distribution || distribution.totalCount === 0) {
    const emptyContent = (
      <div className="py-8 text-center">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No ratings yet</p>
      </div>
    );

    if (variant === 'inline') {
      return emptyContent;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Rating Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>{emptyContent}</CardContent>
      </Card>
    );
  }

  const ratingData = [
    { stars: 5, count: distribution.fiveStarCount, percent: distribution.fiveStarPercent },
    { stars: 4, count: distribution.fourStarCount, percent: distribution.fourStarPercent },
    { stars: 3, count: distribution.threeStarCount, percent: distribution.threeStarPercent },
    { stars: 2, count: distribution.twoStarCount, percent: distribution.twoStarPercent },
    { stars: 1, count: distribution.oneStarCount, percent: distribution.oneStarPercent }
  ];

  const maxPercent = Math.max(...ratingData.map(d => d.percent));

  const chartContent = (
    <div className="space-y-3" data-testid="rating-distribution-chart">
      {ratingData.map((data) => (
        <RatingBar
          key={data.stars}
          stars={data.stars}
          count={data.count}
          percent={data.percent}
          maxPercent={maxPercent}
          testId={`rating-bar-${data.stars}`}
        />
      ))}

      {/* Total count */}
      <div className="pt-3 border-t mt-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Ratings</span>
          <span className="font-semibold" data-testid="rating-total-count">
            {distribution.totalCount}
          </span>
        </div>
      </div>
    </div>
  );

  if (variant === 'inline') {
    return chartContent;
  }

  return (
    <Card data-testid="rating-distribution-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Rating Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>{chartContent}</CardContent>
    </Card>
  );
}

export default RatingDistributionChart;
