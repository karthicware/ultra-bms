'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Star,
  Briefcase,
  Clock,
  CheckCircle2,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { StarRatingDisplay } from './StarRatingInput';
import type { VendorPerformance } from '@/types/vendor-ratings';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/validations/quotations';

/**
 * VendorPerformanceCard Component
 * Story 5.3: Vendor Performance Tracking and Rating
 *
 * Displays vendor performance metrics including:
 * - Overall rating with stars
 * - Total jobs completed
 * - Average completion time
 * - On-time completion rate
 * - Total amount paid
 */

interface VendorPerformanceCardProps {
  /** Performance data */
  performance: VendorPerformance | undefined;
  /** Loading state */
  isLoading?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  testId: string;
}

function MetricItem({ icon, label, value, subtext, testId }: MetricItemProps) {
  return (
    <div
      className="flex items-start gap-3"
      data-testid={testId}
    >
      <div className="p-2 rounded-lg bg-muted/50">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold truncate">{value}</p>
        {subtext && (
          <p className="text-xs text-muted-foreground">{subtext}</p>
        )}
      </div>
    </div>
  );
}

function PerformanceCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function VendorPerformanceCard({
  performance,
  isLoading,
  compact = false
}: VendorPerformanceCardProps) {
  if (isLoading) {
    return <PerformanceCardSkeleton />;
  }

  if (!performance) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No performance data available</p>
        </CardContent>
      </Card>
    );
  }

  const {
    overallRating,
    totalJobsCompleted,
    averageCompletionTime,
    onTimeCompletionRate,
    totalAmountPaid,
    ratingDistribution
  } = performance;

  const formatCompletionTime = (days: number | null): string => {
    if (days === null) return 'N/A';
    if (days < 1) return `${Math.round(days * 24)} hours`;
    return `${days.toFixed(1)} days`;
  };

  const formatOnTimeRate = (rate: number | null): string => {
    if (rate === null) return 'N/A';
    return `${rate.toFixed(1)}%`;
  };

  return (
    <Card data-testid="vendor-performance-card">
      <CardHeader className={compact ? 'pb-2' : undefined}>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Performance Metrics
        </CardTitle>
      </CardHeader>

      <CardContent className={cn('space-y-6', compact && 'space-y-4')}>
        {/* Overall Rating - Prominent Display */}
        <div
          className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg"
          data-testid="performance-rating-section"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Overall Rating</p>
            <div className="flex items-baseline gap-2">
              <span
                className="text-3xl font-bold"
                data-testid="performance-rating-value"
              >
                {Number(overallRating).toFixed(1)}
              </span>
              <span className="text-muted-foreground">/ 5.0</span>
            </div>
            <StarRatingDisplay
              value={Number(overallRating)}
              size="sm"
              showValue={false}
              totalRatings={ratingDistribution?.totalCount}
              testIdPrefix="performance-stars"
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className={cn(
          'grid gap-4',
          compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'
        )}>
          <MetricItem
            icon={<Briefcase className="h-5 w-5 text-blue-500" />}
            label="Jobs Completed"
            value={totalJobsCompleted}
            testId="metric-jobs-completed"
          />

          <MetricItem
            icon={<Clock className="h-5 w-5 text-orange-500" />}
            label="Avg. Completion"
            value={formatCompletionTime(averageCompletionTime)}
            testId="metric-avg-completion"
          />

          <MetricItem
            icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
            label="On-Time Rate"
            value={formatOnTimeRate(onTimeCompletionRate)}
            testId="metric-on-time-rate"
          />

          <MetricItem
            icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
            label="Total Paid"
            value={formatCurrency(Number(totalAmountPaid) || 0)}
            testId="metric-total-paid"
          />
        </div>

        {/* Category Score Breakdown (if available) */}
        {performance.averageQualityScore !== undefined && !compact && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Rating Breakdown</p>
            <div className="grid grid-cols-2 gap-3">
              <CategoryScore
                label="Quality"
                value={performance.averageQualityScore}
                testId="category-quality"
              />
              <CategoryScore
                label="Timeliness"
                value={performance.averageTimelinessScore}
                testId="category-timeliness"
              />
              <CategoryScore
                label="Communication"
                value={performance.averageCommunicationScore}
                testId="category-communication"
              />
              <CategoryScore
                label="Professionalism"
                value={performance.averageProfessionalismScore}
                testId="category-professionalism"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CategoryScoreProps {
  label: string;
  value: number | undefined | null;
  testId: string;
}

function CategoryScore({ label, value, testId }: CategoryScoreProps) {
  const displayValue = value !== null && value !== undefined ? value.toFixed(1) : 'N/A';
  const percentage = value !== null && value !== undefined ? (value / 5) * 100 : 0;

  return (
    <div className="space-y-1" data-testid={testId}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{displayValue}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default VendorPerformanceCard;
