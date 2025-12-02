'use client';

/**
 * Occupancy KPI Cards Component
 * Story 8.3: Occupancy Dashboard
 * AC-1 to AC-4: Display occupancy KPI metrics with trend indicators
 */

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Home,
  Calendar,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OccupancyKpis, OccupancyKpiValue } from '@/types';
import { TrendDirection } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface OccupancyKpiCardsProps {
  kpis: OccupancyKpis | null;
  isLoading?: boolean;
  expiryPeriodDays?: number;
}

interface OccupancyKpiCardProps {
  title: string;
  data: OccupancyKpiValue | null;
  icon: React.ReactNode;
  isLoading?: boolean;
  higherIsBetter?: boolean;
  showProgress?: boolean;
  onClick?: () => void;
  testId: string;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TrendIndicator({
  trend,
  changePercent,
  higherIsBetter = true
}: {
  trend: TrendDirection;
  changePercent?: number | null;
  higherIsBetter?: boolean;
}) {
  if (changePercent === undefined || changePercent === null) {
    return null;
  }

  const isPositive = trend === TrendDirection.UP;
  const isGood = higherIsBetter ? isPositive : !isPositive;

  const Icon = trend === TrendDirection.UP
    ? ArrowUp
    : trend === TrendDirection.DOWN
      ? ArrowDown
      : Minus;

  const colorClass = trend === TrendDirection.NEUTRAL
    ? 'text-muted-foreground'
    : isGood
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <div
      className={cn('flex items-center gap-1 text-sm font-medium', colorClass)}
      data-testid="trend-indicator"
    >
      <Icon className="h-4 w-4" />
      <span>{Math.abs(changePercent).toFixed(1)}%</span>
    </div>
  );
}

function OccupancyKpiCardSkeleton() {
  return (
    <Card className="p-4">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-16" />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SINGLE KPI CARD COMPONENT
// ============================================================================

function OccupancyKpiCard({
  title,
  data,
  icon,
  isLoading = false,
  higherIsBetter = true,
  showProgress = false,
  onClick,
  testId
}: OccupancyKpiCardProps) {
  if (isLoading || !data) {
    return <OccupancyKpiCardSkeleton />;
  }

  const isClickable = !!onClick;

  return (
    <Card
      className={cn(
        'p-4 transition-shadow hover:shadow-md',
        isClickable && 'cursor-pointer hover:border-primary/50'
      )}
      onClick={onClick}
      data-testid={testId}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold" data-testid={`${testId}-value`}>
            {data.formattedValue}
          </span>
          <TrendIndicator
            trend={data.trend}
            changePercent={data.changePercentage}
            higherIsBetter={higherIsBetter}
          />
        </div>

        {showProgress && (
          <div className="mt-3">
            <Progress
              value={data.value}
              className="h-2"
              data-testid={`${testId}-progress`}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {data.value.toFixed(1)}% occupied
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OccupancyKpiCards({
  kpis,
  isLoading = false,
  expiryPeriodDays = 100
}: OccupancyKpiCardsProps) {
  const router = useRouter();

  const handleVacantUnitsClick = () => {
    // Navigate to units page filtered by vacant status
    router.push('/units?status=vacant');
  };

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      data-testid="occupancy-kpi-cards"
    >
      {/* AC-1: Portfolio Occupancy % with visual progress indicator */}
      <OccupancyKpiCard
        title="Portfolio Occupancy"
        data={kpis?.portfolioOccupancy ?? null}
        icon={<Building2 className="h-4 w-4" />}
        isLoading={isLoading}
        higherIsBetter={true}
        showProgress={true}
        testId="kpi-portfolio-occupancy"
      />

      {/* AC-2: Vacant Units with click navigation */}
      <OccupancyKpiCard
        title="Vacant Units"
        data={kpis?.vacantUnits ?? null}
        icon={<Home className="h-4 w-4" />}
        isLoading={isLoading}
        higherIsBetter={false}
        onClick={handleVacantUnitsClick}
        testId="kpi-vacant-units"
      />

      {/* AC-3: Leases Expiring within configurable period */}
      <OccupancyKpiCard
        title={`Leases Expiring (${expiryPeriodDays} days)`}
        data={kpis?.leasesExpiring ?? null}
        icon={<Calendar className="h-4 w-4" />}
        isLoading={isLoading}
        higherIsBetter={false}
        testId="kpi-leases-expiring"
      />

      {/* AC-4: Average Rent per SqFt */}
      <OccupancyKpiCard
        title="Avg Rent/SqFt"
        data={kpis?.averageRentPerSqft ?? null}
        icon={<TrendingUp className="h-4 w-4" />}
        isLoading={isLoading}
        higherIsBetter={true}
        testId="kpi-avg-rent-sqft"
      />
    </div>
  );
}
